"""Server-only identity/configuration. Never accept resource IDs or credentials from tools."""
from dataclasses import dataclass, field, replace
import json
import os
from pathlib import Path
import re
import stat
from urllib.parse import urlsplit
from uuid import UUID

MM_ID = re.compile(r"^[a-z0-9]{26}$")
KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$")
SEATS = ("buddy", "finch")
# Jay's Buddy candidate. Finch must not reuse it. Funnel is not wired from this package.
BUDDY_RESOURCE = "https://nexus.tail3b496f.ts.net/mcp"
# Proposed public clients. The historical shared id is not a principal.
BUDDY_CLIENT = "chatgpt-council-buddy"
FINCH_CLIENT = "council-finch"
SHARED_CLIENT = "chatgpt-council-mcp"


class CouncilError(Exception):
    """A deliberately redacted, safe-to-return error."""


def require(value, message):
    if not value:
        raise CouncilError(message)


def private_file(path, create=False):
    path = Path(path)
    if create:
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.close(fd)
        except FileExistsError:
            pass
    parent = path.parent.lstat()
    require(stat.S_ISDIR(parent.st_mode) and not path.parent.is_symlink()
            and parent.st_uid == os.geteuid() and not parent.st_mode & 0o077,
            "Private parent directory must be owned by this service, mode 0700")
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and not path.is_symlink(), "Private file must be a regular file")
    require(info.st_uid == os.geteuid() and not info.st_mode & 0o077, "Private file must be owned by this service, mode 0600")
    return path


def secret(path):
    value = private_file(path).read_text().strip()
    require(16 <= len(value) <= 8192 and not any(c.isspace() for c in value), "Invalid credential file")
    return value


def base_url(value, allow_local_http=False):
    p = urlsplit(value)
    require(p.scheme in ("http", "https") and bool(p.hostname), "Invalid configured base URL")
    require(not p.username and not p.password and not p.query and not p.fragment and p.path in ("", "/"),
            "Configured base URL must be an origin without credentials or path")
    require(p.scheme == "https" or (allow_local_http and p.hostname in ("127.0.0.1", "localhost", "::1")),
            "HTTPS required; explicit loopback HTTP is allowed only on the host")
    return value.rstrip("/")


@dataclass(frozen=True)
class Settings:
    mm_url: str
    switch_url: str
    channel_id: str
    room_id: str
    agent_id: str
    reader_user_id: str
    sender_user_id: str
    human_user_ids: tuple[str, ...]
    mm_token: str = field(repr=False)
    switch_token: str = field(repr=False)
    state_file: str
    seat: str
    core_sender_id: str
    runtime_label: str = ""
    oauth_client_id: str = ""
    writes_enabled: bool = False
    max_writes_hour: int = 6
    max_writes_source: int = 1
    transport: str = "stdio"
    public_url: str = ""
    issuer_url: str = ""
    jwks_url: str = ""
    subjects: tuple[str, ...] = ()
    port: int = 8787
    allow_loopback_http: bool = False
    auth_diag: bool = False

    def validate(self):
        for value in (self.mm_url, self.switch_url):
            base_url(value, self.allow_loopback_http)
        require(isinstance(self.human_user_ids, tuple), "Human IDs must be a tuple")
        for value in (self.channel_id, self.reader_user_id, self.sender_user_id, *self.human_user_ids):
            require(bool(MM_ID.fullmatch(value)), "Invalid configured Mattermost ID")
        require(bool(self.human_user_ids) and self.sender_user_id not in self.human_user_ids
                and self.reader_user_id not in self.human_user_ids, "Human and service identities must be separate")
        for value in (self.room_id, self.agent_id):
            try:
                UUID(value)
            except ValueError as error:
                raise CouncilError("Invalid configured Switch ID") from error
        require(1 <= self.max_writes_hour <= 60 and 1 <= self.max_writes_source <= 3, "Invalid write ceilings")
        require(self.transport in ("stdio", "streamable-http"), "Unsupported transport")
        require(self.seat in SEATS, "Seat must be buddy or finch")
        require(isinstance(self.core_sender_id, str) and 1 <= len(self.core_sender_id) <= 200
                and not any(ord(c) < 32 for c in self.core_sender_id), "Invalid Core sender id")
        require(1 <= len(self.runtime_label) <= 80 and not any(ord(c) < 32 for c in self.runtime_label),
                "Invalid runtime label")
        if self.transport == "streamable-http":
            origin = base_url(self.public_url)
            require(origin == self.public_url.rstrip("/"), "Public URL must be an HTTPS origin")
            issuer = urlsplit(self.issuer_url)
            require(issuer.scheme == "https" and issuer.hostname and not issuer.username
                    and not issuer.password and not issuer.query and not issuer.fragment,
                    "HTTPS OAuth issuer required")
            p = urlsplit(self.jwks_url)
            require(p.scheme == "https" and p.hostname and not p.username and not p.password
                    and not p.fragment and not p.query, "HTTPS JWKS URL required")
            require(bool(self.subjects), "Explicit OAuth subject allowlist required")
            require(isinstance(self.oauth_client_id, str) and bool(KEY.fullmatch(self.oauth_client_id)),
                    "Explicit OAuth client id required")
            require(self.oauth_client_id != SHARED_CLIENT, "Shared council client is not a principal")
            if self.seat == "finch":
                require(self.resource != BUDDY_RESOURCE, "Finch must not reuse the Buddy resource URL")
                require(self.oauth_client_id != BUDDY_CLIENT, "Finch cannot use the Buddy client")
            else:
                require(self.oauth_client_id != FINCH_CLIENT, "Buddy cannot use the Finch client")
        require(1024 <= self.port <= 65535, "Invalid listen port")
        return self

    def labeled(self):
        """Return settings with the seat's runtime label filled in when omitted."""
        if self.runtime_label:
            return self
        return replace(self, runtime_label="Buddy Main" if self.seat == "buddy" else "Finch")

    @property
    def resource(self):
        return self.public_url.rstrip("/") + "/mcp"

    @classmethod
    def from_env(cls):
        def needed(name):
            value = os.environ.get(name, "")
            require(bool(value), "Missing configuration: " + name)
            return value
        local = os.environ.get("COUNCIL_ALLOW_LOOPBACK_HTTP") == "true"
        return cls(
            mm_url=base_url(needed("COUNCIL_MM_URL"), local),
            switch_url=base_url(needed("COUNCIL_SWITCH_URL"), local),
            channel_id=needed("COUNCIL_CHANNEL_ID"), room_id=needed("COUNCIL_ROOM_ID"),
            agent_id=needed("COUNCIL_AGENT_ID"), reader_user_id=needed("COUNCIL_READER_USER_ID"),
            sender_user_id=needed("COUNCIL_SENDER_USER_ID"),
            human_user_ids=tuple(json.loads(needed("COUNCIL_HUMAN_USER_IDS"))),
            mm_token=secret(needed("COUNCIL_MM_TOKEN_FILE")),
            switch_token=secret(needed("COUNCIL_SWITCH_TOKEN_FILE")),
            state_file=needed("COUNCIL_STATE_FILE"),
            seat=needed("COUNCIL_SEAT"),
            core_sender_id=needed("COUNCIL_CORE_SENDER_ID"),
            runtime_label=os.environ.get("COUNCIL_RUNTIME_LABEL", ""),
            oauth_client_id=os.environ.get("COUNCIL_OAUTH_CLIENT_ID", ""),
            writes_enabled=os.environ.get("COUNCIL_ENABLE_WRITES") == "true",
            max_writes_hour=int(os.environ.get("COUNCIL_MAX_WRITES_HOUR", "6")),
            max_writes_source=int(os.environ.get("COUNCIL_MAX_WRITES_SOURCE", "1")),
            transport=os.environ.get("COUNCIL_TRANSPORT", "stdio"),
            public_url=os.environ.get("COUNCIL_PUBLIC_URL", "").rstrip("/"),
            issuer_url=os.environ.get("COUNCIL_OAUTH_ISSUER", ""),
            jwks_url=os.environ.get("COUNCIL_OAUTH_JWKS_URL", ""),
            subjects=tuple(json.loads(os.environ.get("COUNCIL_OAUTH_SUBJECTS", "[]"))),
            port=int(os.environ.get("COUNCIL_PORT", "8787")),
            allow_loopback_http=local,
            auth_diag=os.environ.get("COUNCIL_AUTH_DIAG") == "true",
        ).labeled().validate()

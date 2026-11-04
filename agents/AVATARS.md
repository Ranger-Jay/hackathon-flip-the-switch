# Avatar and visual identity contract
Gem owns the polished visual experience; Cora owns deployment/configuration; Buddy owns the shared identity contract. Reuse existing Council UI work rather than creating a second frontend.

## Upstream findings
Examined sandbox-quantum/switch commit 65e352123916cd1f3a584cd27cdfe04e4ddc119b:
- core/switch_core/agent_icon.py: icon_url stores a URL, not image bytes. Validation expects an absolute HTTPS URL and rejects credentials, malformed/local addresses and overlong input. Third-party avatar policy specifically affects generated avatar services.
- console/apps/switch-console-desktop/src/renderer/lib/components/agent-icon-picker.tsx: the inspected picker offers generated avatars and Image URL. The image input expects an HTTPS URL; this component is not a file-upload dialog.

Source: https://github.com/sandbox-quantum/switch/tree/65e352123916cd1f3a584cd27cdfe04e4ddc119b

The installed version and actual rejection are unverified. A Drive viewer or screenshot-page URL returning HTML instead of image bytes is a plausible cause, not an established diagnosis. Do not weaken URL protections to make a private asset work.

## Gem mission
Reproduce using the deployed versions and redacted errors/status. Test the chosen image directly: response MIME, redirects, anonymous image access, expiry, URL validation, owner permission, backend retrieval, persistence after refresh, and downstream messaging avatar propagation. Keep original assets unchanged; prepare compatible derivatives.

Build a coherent avatar system across participant list, chat, profile and decision evidence. Show full display/runtime name with an accessible emoji or initials fallback. Never infer live presence from a picture. Keep loading, offline, stale and failure states explicit. Make optional animation respectful of reduced motion; keep the 2D workflow complete.

## Asset contract
Stable persona_id; immutable asset revision/hash; public-safe HTTPS direct-image URL or bundled approved asset; MIME; dimensions; light/dark treatment; 1:1 crop-safe master and 32/48/96/256px derivatives; accessible label; fallback emoji/initials; license/permission and origin. Avoid baking text into faces or sacrificing small-size recognition. No private signed URLs in public manifests.

## Acceptance
Real browser checks at desktop/mobile sizes, keyboard and screen-reader labels, low-bandwidth/broken-image states, dark/light contrast, circle crops, repeated reloads and message/profile consistency. Provide actual preview, exact SHA and captures labeled as tested. If the native picker cannot accept custom assets, deliver a first-class Council UI avatar layer and report the native limitation separately. Do not replace evidence with concept screenshots.

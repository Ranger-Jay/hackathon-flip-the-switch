# Security policy

This public project is a hackathon-stage demonstration in active development, not a production-hardened service. There is no verified production deployment or formal support SLA.

**Do not publish a suspected vulnerability, credential, private key, host address, tailnet detail, personal record or customer information in a public issue or pull request.**

For a security concern, use GitHub's private vulnerability reporting for this repository if enabled, or contact the repository owner through a private channel before public disclosure. Do not place exploit details in an ordinary public issue.

## Boundaries

- Never commit `.env`, service tokens, SSH private keys, cloud credentials or real customer data.
- Use non-production, non-sensitive example proposals when demonstrating a decision.
- Give agent hosts the least authority they need. SSH access to a machine is not proof of authorization to deploy or administer it.
- Docker socket access is effectively root-equivalent on typical Linux hosts; do not silently expand permissions.
- Real message IDs, human decisions and agent role boundaries must be enforced by the running system, not merely implied by the UI.
- Inspect third-party dependencies and review the upstream [Switch license](https://github.com/sandbox-quantum/switch/blob/main/LICENSE).

## Reporting

Please include affected version/commit, a minimum reproduction that avoids sensitive data, expected behavior, observed behavior, and impact. Maintainers will verify before making public claims.

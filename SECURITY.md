# Security Policy

## Supported Versions

Security fixes are prioritized for the latest version maintained on the default branch.

| Version | Supported |
| --- | --- |
| Latest (`main`) | :white_check_mark: |
| Older commits | :x: |

Security support for tagged releases will be documented as the project establishes a formal release policy.

## Reporting a Vulnerability

We take the security of LLM Observability Pipeline seriously.

If you discover a potential security vulnerability, please report it responsibly.

**Do not disclose vulnerabilities through public GitHub issues, discussions, pull requests, or other public channels.**

### Private Disclosure

Until GitHub Private Vulnerability Reporting is enabled for this repository, please contact the project maintainer through their GitHub profile:

https://github.com/Sakshisrivastava01

You may also use the contact information provided on the maintainer's linked professional profile.

Include the following information in your report:

- **Description:** A clear explanation of the vulnerability.
- **Affected components:** Relevant endpoints, modules, or configurations.
- **Impact:** Potential confidentiality, integrity, or availability consequences.
- **Reproduction steps:** A minimal, non-destructive proof of concept.
- **Suggested remediation:** If you have identified a potential fix.

Never include actual credentials, API keys, access tokens, personal information, or production customer data in a report.

### Disclosure Guidelines

Please follow responsible disclosure practices:

1. Give the maintainer a reasonable opportunity to investigate and address the vulnerability.
2. Avoid accessing, modifying, or exfiltrating data that does not belong to you.
3. Do not perform denial-of-service testing or destructive security testing against production infrastructure.
4. Do not publicly disclose vulnerability details before coordinating remediation with the maintainer.
5. Report exposed credentials privately so they can be revoked and rotated immediately.

### Response and Remediation

The maintainer is encouraged to:

- Acknowledge vulnerability reports within 5 business days.
- Provide an initial assessment and remediation status within 14 days.
- Coordinate disclosure timelines with the reporter.
- Publish security fixes and relevant advisories when appropriate.

These are recommended response targets, not guaranteed service-level commitments.

### Scope

Security reports concerning the following components are particularly relevant:

- Authentication, authorization, and JWT session management.
- Telemetry ingestion and trace integrity.
- API access controls and tenant isolation.
- Database connections, credentials, and transport security.
- LLM provider integrations and external request routing.
- Sensitive information exposure and secret management.
- Dependency vulnerabilities and CI/CD security.

### Out of Scope

The following are generally not considered security vulnerabilities without a demonstrated security impact:

- Issues requiring access to another user's private credentials.
- Vulnerabilities in unsupported or intentionally insecure local configurations.
- Reports based solely on automated scanner output without reproducible evidence.
- Theoretical concerns without a realistic attack scenario.

Thank you for helping keep LLM Observability Pipeline and its users secure.

Responsible disclosure helps protect the project and its community.

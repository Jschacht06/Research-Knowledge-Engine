# Security Documentation

## Registration Access Control

User registration is restricted to approved institutional email domains via server-side validation.
The allowed domains are configured through environment variables rather than hardcoded in the
application source.

This was implemented as a compensating control to reduce unauthorized public signups and limit
access to the shared research corpus to users with institutional email addresses.

## Current Limitation

Full identity verification has not been implemented.

Email verification or institutional SSO would be the preferred long-term solution, but this could
not be added within the current project constraints. In particular, the project does not have the
required organizational access to configure trusted outbound mail delivery or institution-managed
identity integration.

Because of that limitation, domain-restricted registration is used as the practical alternative.

## Security Impact

This mitigation significantly reduces open public registration, but it does not fully eliminate
the risk of unauthorized access. Anyone who can legitimately control an email address within an
allowed domain may still self-register and access the shared document corpus.

## Summary

User registration is restricted to approved institutional email domains via server-side
validation. Full email verification or SSO integration was considered but could not be implemented
due to organizational infrastructure constraints and lack of access to trusted mail delivery or
identity-provider configuration.

# Contributing to BuildWorks.AI Decision MCP Tools

Thanks for your interest in contributing! We welcome issues, bug fixes, documentation improvements, and new features.

## Getting Started
- Fork the repository and clone your fork
- Create a feature branch from `main`
- Install dependencies: `npm install`
- Build: `npm run build`
- Lint: `npm run lint`

## Commit Convention
Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `chore:` tooling/infra
- `refactor:` code change without behavior change

## Pull Requests
- Keep PRs focused and small
- Include description, motivation, and testing notes
- Ensure `npm run build` and `npm run lint` pass
- Link related issues

## Development Notes
- Code in TypeScript under `src/`
- Avoid `any`; prefer strict types
- Maintain stdio protocol compatibility (MCP)
- Ensure error handling and validation are present

## Security
Report security issues privately to `security@buildworks.ai`.

## Code of Conduct
This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.


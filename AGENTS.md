1. Keep functions small and focused on a single responsibility.
2. Give every function JSDoc that explains intent, constraints, or non-obvious behavior. Use as much detail as needed without restating the code.
3. Prefer a functional style. Do not use `.map()` or `.reduce()`; use loops instead.
4. No prose, AI slop, walls of text, or Markdown wrapping around code in responses.
5. Separate implementation by concern. `libs` contains code that talks to services; code that consumes those integrations belongs elsewhere.
6. One cohesive concern per file; keep closely related functions and types together.
7. No semicolons in JavaScript or TypeScript.
8. Use TypeScript.
9. Do only what is asked. Do not expand scope or go deeper without consent. Avoid unnecessary work and token use. Reply briefly.
10. Use logical spacing between code blocks.
11. Use `@/` imports and re-exports for modules within `src` instead of relative paths.
12. Edit code directly using patches. Do not use Python or printf to edit code.
13. Never run npm, pnpm, or any other package manager or project command without explicit user consent. Do not run tests or builds on your own.

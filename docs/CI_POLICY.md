# CI Policy

The required quality sequence is dependency install, lint, TypeScript, automated tests and production build. A failure stops later steps and is repaired before the branch is treated as green.

Only the result for the current exact head commit counts as current CI evidence.

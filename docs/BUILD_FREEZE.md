# Build Freeze

When moving to staging verification, freeze an exact commit. Avoid adding unrelated features during evidence collection. Any necessary fix creates a new candidate and reruns affected gates.

This prevents test evidence from being attributed to code that was never actually tested.

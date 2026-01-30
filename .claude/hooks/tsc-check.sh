#!/bin/bash
# TypeScript Check Hook (Optional)
# Runs type checking before certain bash commands
# Customize for your project's needs

set -e

# Read input from stdin
INPUT=$(cat)

# Extract command from input
COMMAND=$(echo "$INPUT" | jq -r '.command // empty' 2>/dev/null || echo "")

# Skip if command is npm/yarn/pnpm install or other non-code commands
case "$COMMAND" in
    *"install"*|*"add"*|*"init"*|*"version"*)
        exit 0
        ;;
esac

# Check if tsconfig.json exists (indicates TypeScript project)
if [ -f "tsconfig.json" ]; then
    # Run type check (silent, only show errors)
    if command -v npx &> /dev/null; then
        npx tsc --noEmit 2>&1 | grep -E "error TS" || true
    fi
fi

exit 0

#!/bin/bash
# Date Injection Hook
# Injects current date/time into Claude's context
#
# Configuration:
#   SKIP_DATE_INJECTION=1  - Disable this hook
#   DATE_FORMAT            - Custom date format (default: '%Y-%m-%d %H:%M %Z')
#
# Usage in settings.json:
#   "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "...date-injection.sh" }] }]

# Skip if disabled
if [ "$SKIP_DATE_INJECTION" = "1" ]; then
    exit 0
fi

# Use custom format or default
FORMAT="${DATE_FORMAT:-%Y-%m-%d %H:%M %Z}"

# Output current date/time
echo "---"
echo "SYSTEM DATE/TIME: $(date +"$FORMAT")"
echo "---"

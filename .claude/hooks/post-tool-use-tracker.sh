#!/bin/bash
# Post Tool Use Tracker
# Tracks file modifications and enforces the 500-line rule

set -e

# Read input from stdin (JSON with tool information)
INPUT=$(cat)

# Extract file path from input if available
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // empty' 2>/dev/null || echo "")

if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
    # Count lines in the file
    LINE_COUNT=$(wc -l < "$FILE_PATH" | tr -d ' ')

    # Check 500-line rule
    if [ "$LINE_COUNT" -gt 500 ]; then
        echo "[WARNING] File exceeds 500-line limit: $FILE_PATH ($LINE_COUNT lines)"
        echo "Consider using /add-skill to refactor into modular skills."
    fi
fi

# Log the modification for tracking
TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

echo "$TIMESTAMP|PostToolUse|$FILE_PATH" >> "$LOG_DIR/tool-usage.log" 2>/dev/null || true

exit 0

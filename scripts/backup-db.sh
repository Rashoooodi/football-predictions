#!/bin/bash
set -euo pipefail
SRC="${1:-football.db}"
DEST_DIR="${2:-backups}"
mkdir -p "$DEST_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
cp "$SRC" "$DEST_DIR/football-$STAMP.db"
if [ -f "$SRC-wal" ]; then
  cp "$SRC-wal" "$DEST_DIR/football-$STAMP.db-wal"
fi
echo "Backup written to $DEST_DIR/football-$STAMP.db"

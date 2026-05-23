#!/bin/bash
# Build the frontend upload folder for Stake Engine
# Usage: ./scripts/build-frontend-upload.sh

set -e

OUTPUT_DIR="dist/frontend"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy static frontend files
cp index.html "$OUTPUT_DIR/"
cp -r src/ "$OUTPUT_DIR/src/"

echo "✅ Frontend upload folder ready at: $OUTPUT_DIR/"
echo "   Upload this folder via the 'Front End' button in Stake Engine ACP."

#!/bin/bash
# Build the frontend for upload
# Usage: ./scripts/build-frontend-upload.sh

set -e

OUTPUT_DIR="dist/frontend"

echo "Building SvelteKit frontend..."
cd frontend && npm run build && cd ..

rm -rf "$OUTPUT_DIR"
cp -r frontend/build "$OUTPUT_DIR"

echo "✅ Frontend upload folder ready at: $OUTPUT_DIR/"
echo "   Upload this folder via the 'Front End' button in Stake Engine ACP."

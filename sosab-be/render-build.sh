#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting Render Build Script..."

# 1. Install dependencies with progress logging
echo "Installing dependencies (this may take a few minutes)..."
# Using --loglevel info so we see some activity
# --no-audit and --no-fund for speed
# --production to keep the build light
npm install --no-audit --no-fund --production --loglevel info

echo "Build Script Finished Successfully!"

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

# 2. Install Puppeteer Browser
echo "Installing Puppeteer browser..."
# We use npx to ensure the browser is installed in the correct cache directory
# The --progress flag ensures we see what's happening
npx puppeteer browsers install chrome --progress

echo "Build Script Finished Successfully!"

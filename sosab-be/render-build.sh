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
echo "Installing Puppeteer browser (this is a 150MB+ download, extraction takes time)..."
# Setting cache dir explicitly to ensure it sticks
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
npx puppeteer browsers install chrome

echo "Verifying installation..."
ls -R /opt/render/.cache/puppeteer | head -n 20

echo "Build Script Finished Successfully!"

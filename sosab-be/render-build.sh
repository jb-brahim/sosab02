#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting Render Build Script..."

# 1. Install system Chromium (fast, uses system package manager)
echo "Installing Chromium browser via apt-get..."
apt-get update && apt-get install -y chromium

# 2. Install dependencies (Puppeteer will skip browser download)
echo "Installing Node dependencies..."
npm install --no-audit --no-fund --production --loglevel info

echo "Build Script Finished Successfully!"

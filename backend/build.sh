#!/bin/bash
set -e

echo "🔧 Building AI Call Intelligence Backend..."

# Ensure we're using Python 3.11
python --version

# Upgrade pip and install build tools first
echo "📦 Installing build tools..."
python -m pip install --upgrade pip==23.3.1
pip install setuptools==68.2.2 wheel==0.41.2

# Install requirements
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "✅ Build completed successfully!"

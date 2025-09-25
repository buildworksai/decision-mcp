#!/bin/bash

# Decision MCP Setup Script

set -e

echo "🚀 Setting up Decision MCP Server..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t decision-mcp:latest .

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your editor (Cursor/Windsurf/Claude Desktop)"
echo "2. See SETUP.md for detailed configuration instructions"
echo "3. Restart your editor"
echo "4. Test with: 'Help me think through a complex problem'"
echo ""
echo "🔧 Available configurations:"
echo "- cursor-config.json (for Cursor)"
echo "- windsurf-config.json (for Windsurf)"
echo "- local-config.json (for local Node.js setup)"

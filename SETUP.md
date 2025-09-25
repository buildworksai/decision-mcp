# Decision MCP Setup Guide

## 🐳 Docker Setup

### Prerequisites
- Docker installed and running
- Node.js 18+ (for building)
- Git (for cloning)

### Build the Docker Image
```bash
# Clone the repository
git clone <your-repo-url>
cd decision-mcp

# Build the project
npm install
npm run build

# Build Docker image
docker build -t decision-mcp:latest .
```

### Test the Docker Image
```bash
# Test the container
docker run --rm -i decision-mcp:latest
```

## 🔧 Editor Configuration

### Cursor Setup

1. **Find Cursor's config directory:**
   - macOS: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/`
   - Windows: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\`
   - Linux: `~/.config/Cursor/User/globalStorage/cursor.mcp/`

2. **Create or edit `mcp_settings.json`:**
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--name",
        "decision-mcp-cursor",
        "decision-mcp:latest"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **Restart Cursor**

### Windsurf Setup

1. **Find Windsurf's config directory:**
   - macOS: `~/Library/Application Support/Windsurf/User/globalStorage/windsurf.mcp/`
   - Windows: `%APPDATA%\Windsurf\User\globalStorage\windsurf.mcp\`
   - Linux: `~/.config/Windsurf/User/globalStorage/windsurf.mcp/`

2. **Create or edit `mcp_settings.json`:**
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--name",
        "decision-mcp-windsurf",
        "decision-mcp:latest"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. **Restart Windsurf**

### Claude Desktop Setup

1. **Find Claude Desktop config:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add to `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--name",
        "decision-mcp-claude",
        "decision-mcp:latest"
      ]
    }
  }
}
```

3. **Restart Claude Desktop**

## 🚀 Alternative: Local Setup (No Docker)

If you prefer to run locally without Docker:

### For Cursor/Windsurf:
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/decision-mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### For Claude Desktop:
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/decision-mcp/dist/server.js"]
    }
  }
}
```

## 🔍 Verification

After setup, you should see the decision-mcp tools available in your editor:

### Available Tools:
- **Sequential Thinking**: `start_thinking`, `add_thought`, `revise_thought`, etc.
- **Decision Making**: `start_decision`, `add_criteria`, `add_option`, etc.
- **Decision Analysis**: `analyze_bias`, `validate_logic`, `assess_risks`, etc.

### Test Commands:
Try asking your AI assistant:
- "Help me think through a complex problem using sequential thinking"
- "I need to make a decision between multiple options"
- "Analyze this decision for potential biases"

## 🐛 Troubleshooting

### Common Issues:

1. **Docker not found:**
   - Ensure Docker is installed and running
   - Try the local setup instead

2. **Permission denied:**
   - Check Docker permissions
   - Ensure the image was built successfully

3. **Tools not appearing:**
   - Restart your editor after configuration
   - Check the config file syntax
   - Verify the MCP server is running

4. **Connection issues:**
   - Check if the container is running: `docker ps`
   - Check logs: `docker logs <container-name>`

### Debug Commands:
```bash
# Check if image exists
docker images | grep decision-mcp

# Test container manually
docker run --rm -i decision-mcp:latest

# Check container logs
docker logs <container-name>

# Remove old containers
docker container prune
```

## 📚 Usage Examples

Once configured, you can use the tools in your editor:

### Sequential Thinking Example:
```
"Help me think through how to improve our customer onboarding process"
```

### Decision Making Example:
```
"I need to choose between three project management tools. Help me make a structured decision."
```

### Analysis Example:
```
"Analyze my previous decision for potential biases and risks"
```

## 🔄 Updates

To update the Docker image:
```bash
# Rebuild the image
docker build -t decision-mcp:latest .

# Restart your editor to pick up changes
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify your configuration
3. Test with the local setup first
4. Check Docker and editor logs

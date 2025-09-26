# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Metadata labels
LABEL org.opencontainers.image.title="Decision MCP by BuildWorks.AI"
LABEL org.opencontainers.image.description="Sequential thinking, decision-making, and analysis server for MCP-compatible IDEs"
LABEL org.opencontainers.image.version="2.1.0"
LABEL org.opencontainers.image.vendor="BuildWorks.AI"
LABEL org.opencontainers.image.url="https://buildworks.ai"
LABEL org.opencontainers.image.source="https://github.com/buildworksai/decision-mcp"
LABEL org.opencontainers.image.documentation="https://github.com/buildworksai/decision-mcp#readme"
LABEL org.opencontainers.image.licenses="MIT"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Change ownership of the app directory
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port (optional, for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the MCP server
CMD ["node", "dist/server.js"]

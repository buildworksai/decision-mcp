# Decision MCP by BuildWorks.AI

[![npm version](https://badge.fury.io/js/buildworks-ai-decision-mcp.svg)](https://badge.fury.io/js/buildworks-ai-decision-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://github.com/buildworksai/decision-mcp/workflows/Publish/badge.svg)](https://github.com/buildworksai/decision-mcp/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/buildworks-ai-decision-mcp.svg)](https://www.npmjs.com/package/buildworks-ai-decision-mcp)

Decision MCP by BuildWorks.AI is a production-grade Model Context Protocol (MCP) server providing ultra-optimized decision making and structured thinking capabilities. Features just 5 powerful tools that consolidate 21+ individual functions for maximum efficiency. Works with Cursor, Windsurf, and Claude via stdio. Distributed via npm and Docker. Built and maintained by [BuildWorks.AI](https://buildworks.ai).

## 🚀 Ultra-Optimized 5-Tool Architecture

**76% reduction in tool count** - From 21 individual tools to just 5 powerful, consolidated tools that preserve all functionality while dramatically improving user experience.

### 🎯 1. `make_decision` - Complete Decision Workflow
**Consolidates 8 tools into 1 powerful workflow:**
- Create decision sessions with context
- Add multiple criteria with weights and types
- Define options with pros, cons, and risks
- Auto-generate or provide custom evaluations
- Generate comprehensive analysis and recommendations
- **One tool call = Complete decision from start to finish**

### 🔍 2. `analyze_decision` - Deep Analysis Suite
**Consolidates 5 analysis tools into 1 comprehensive analyzer:**
- Bias detection and mitigation strategies
- Logic validation and consistency checking
- Risk assessment with probability and impact analysis
- Alternative generation with feasibility scoring
- Comprehensive analysis combining all insights
- **One tool call = Complete decision analysis**

### 🧠 3. `structured_thinking` - Complete Thinking Workflow
**Consolidates 8 thinking tools into 1 flexible workflow:**
- Start thinking sessions with problems and context
- Add, revise, and branch thoughts dynamically
- Analyze progress and identify key insights
- Conclude with final conclusions and confidence levels
- **One tool call = Complete structured thinking process**

### 📋 4. `manage_sessions` - Universal Session Management
**Consolidates 4 session tools into 1 universal manager:**
- Get individual sessions (decision or thinking)
- List all sessions with filtering by type and status
- Universal session management across all tool types
- **One tool call = Complete session management**

### ✅ 5. `validate_logic` - Quick Logic Validation
**Standalone logic validation tool:**
- Quick logic consistency checking
- Strict or relaxed validation modes
- Perfect for quality assurance workflows
- **One tool call = Instant logic validation**

### ⚡ Performance & Reliability
- **Intelligent Caching**: Multi-layer caching for optimal performance
- **Performance Monitoring**: Built-in performance metrics and monitoring
- **Rate Limiting**: Configurable rate limits to prevent abuse
- **Session Limits**: Automatic cleanup of old sessions

### 🔒 Security & Validation
- **Input Validation**: Comprehensive input sanitization and validation
- **Security Auditing**: Complete audit trail of all actions
- **Session Security**: Secure session management with lifetime limits
- **Error Handling**: Robust error handling and recovery

## Installation

### Quick Start (Recommended)
No installation required! Use `npx` to run the latest version:

```bash
npx buildworks-ai-decision-mcp
```

### Global Installation (Optional)
```bash
npm install -g buildworks-ai-decision-mcp
```

### Development Setup
```bash
git clone https://github.com/buildworksai/decision-mcp.git
cd decision-mcp
npm install
npm run build
npm start
```

## Usage

### Starting the MCP Server

The server runs on stdio and can be integrated with MCP-compatible AI assistants:

```bash
decision-mcp
```

### Install from GitHub Packages (private/org registry)

1) Create `~/.npmrc` with:
```ini
@buildworksai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

2) Install the scoped package:
```bash
npm install -g @buildworksai/decision-mcp
```

## Technical Architecture

### 🏗️ Core Components
- **MCP Server**: Standard Model Context Protocol server with stdio transport
- **SQLite Database**: Persistent session storage with automatic recovery
- **Multi-layer Caching**: In-memory + persistent caching for optimal performance
- **Rate Limiting**: Configurable limits for sessions, analysis, and global operations
- **Security Layer**: Input validation, sanitization, and comprehensive audit logging
- **Performance Monitoring**: Built-in metrics and performance tracking

### 📊 Data Flow
1. **Input Validation**: All inputs are validated and sanitized
2. **Rate Limiting**: Requests are checked against configured limits
3. **Caching**: Frequently accessed data is cached for performance
4. **Processing**: Core decision-making logic executes
5. **Persistence**: Results are automatically saved to database
6. **Audit**: All actions are logged for security and debugging

## Configure in IDE (Cursor/Windsurf/Claude)

Add to your MCP settings:
```json
{
  "mcpServers": {
    "decision-mcp": {
      "command": "npx",
      "args": ["buildworks-ai-decision-mcp"],
      "env": {},
      "disabled": false
    }
  }
}
```

**Note**: Using `npx` ensures you always get the latest version and avoids global installation issues.

## Contributing and Conduct

- See [CONTRIBUTING.md](./CONTRIBUTING.md)
- See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).

---

Maintained by [BuildWorks.AI](https://buildworks.ai)

### Available Tools

#### Sequential Thinking Tools

1. **start_thinking** - Begin a new thinking session
2. **add_thought** - Add thoughts to an existing session
3. **revise_thought** - Modify existing thoughts
4. **branch_from_thought** - Create alternative thinking paths
5. **analyze_thinking_progress** - Get insights on thinking progress
6. **conclude_thinking** - Finalize a thinking session

#### Decision Making Tools

1. **start_decision** - Begin a new decision session
2. **add_criteria** - Define evaluation criteria
3. **add_option** - Add decision options
4. **evaluate_option** - Score options against criteria
5. **analyze_decision** - Analyze decision data
6. **make_recommendation** - Generate final recommendation

#### Decision Analysis Tools

1. **analyze_bias** - Detect cognitive biases
2. **validate_logic** - Check logical consistency
3. **assess_risks** - Evaluate decision risks
4. **generate_alternatives** - Create new options
5. **comprehensive_analysis** - Full decision analysis

## Examples

### Example 1: Sequential Thinking

```json
{
  "tool": "start_thinking",
  "arguments": {
    "problem": "How can we improve customer satisfaction in our e-commerce platform?",
    "context": "We've seen a 15% drop in customer satisfaction scores over the past quarter"
  }
}
```

### Example 2: Decision Making

```json
{
  "tool": "start_decision",
  "arguments": {
    "context": "Choose between three software vendors for our new CRM system",
    "description": "Budget: $50k, Timeline: 6 months, Team size: 10 people"
  }
}
```

### Example 3: Decision Analysis

```json
{
  "tool": "comprehensive_analysis",
  "arguments": {
    "sessionId": "decision-session-123",
    "includeAll": true
  }
}
```

## Architecture

### Core Components

- **SequentialThinkingTool**: Manages structured thinking sessions
- **DecisionMakerTool**: Handles decision-making processes
- **DecisionAnalyzerTool**: Provides analysis and validation
- **ValidationUtils**: Input validation and data integrity
- **AnalysisUtils**: Statistical and mathematical calculations

### Data Flow

1. **Session Creation**: User starts thinking or decision session
2. **Data Collection**: Add thoughts, criteria, options, evaluations
3. **Analysis**: Apply analytical tools for insights
4. **Recommendation**: Generate final recommendations
5. **Validation**: Ensure quality and consistency

## Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

### Customization

The server can be customized by modifying:
- Tool schemas in `src/server.ts`
- Validation rules in `src/utils/validation.ts`
- Analysis algorithms in `src/utils/analysis.ts`

## API Reference

### Sequential Thinking API

#### start_thinking
```typescript
interface StartThinkingParams {
  problem: string;
  context?: string;
  maxThoughts?: number;
}
```

#### add_thought
```typescript
interface AddThoughtParams {
  sessionId: string;
  thought: string;
  parentId?: string;
  branchId?: string;
}
```

### Decision Making API

#### start_decision
```typescript
interface StartDecisionParams {
  context: string;
  description?: string;
  deadline?: string;
}
```

#### add_criteria
```typescript
interface AddCriteriaParams {
  sessionId: string;
  name: string;
  description: string;
  weight: number; // 0-1
  type: 'benefit' | 'cost' | 'risk' | 'feasibility';
}
```

### Decision Analysis API

#### analyze_bias
```typescript
interface AnalyzeBiasParams {
  sessionId: string;
  includeMitigation?: boolean;
}
```

## Error Handling

The server provides comprehensive error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Session Errors**: Session not found or invalid state
- **Analysis Errors**: Insufficient data for analysis
- **System Errors**: Internal server errors with logging

## Performance Considerations

- **Memory Management**: Sessions are stored in memory (consider persistence for production)
- **Concurrent Sessions**: Supports multiple simultaneous sessions
- **Analysis Performance**: Optimized algorithms for real-time analysis
- **Validation Speed**: Fast input validation with early returns

## Security

- **Input Sanitization**: All inputs are validated and sanitized
- **Session Isolation**: Sessions are isolated and cannot access each other
- **Error Information**: Sensitive information is not exposed in error messages
- **Resource Limits**: Built-in limits to prevent resource exhaustion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples

## Roadmap

### ✅ Completed (v2.1.0)
- [x] **Persistent session storage** - SQLite database with automatic session recovery
- [x] **Performance optimization** - Multi-layer caching and performance monitoring
- [x] **Enhanced security features** - Input validation, sanitization, and audit logging
- [x] **API rate limiting** - Configurable rate limits for sessions and global operations
- [x] **External data integration** - Fetch and attach data from external sources (REST/JSON)
- [x] **Multi-language support** - i18n service for international users
- [x] **Advanced visualization tools** - Generate Mermaid diagrams for sessions and decisions
- [x] **Advanced NLP integration** - Keyword extraction, summarization, sentiment analysis
- [x] **ML-ready bias detection** - Baseline models and feature extraction for advanced bias analysis
- [x] **Collaborative decision making** - Multi-user decision-making with real-time sync
- [x] **Code quality improvements** - 100% TypeScript compliance, zero ESLint warnings
- [x] **Production readiness** - Comprehensive testing, error handling, and professional code standards

### 🚧 In Progress
- None

### 🔮 Future Releases
- None - Project is feature complete

## Changelog

### v2.2.0 (2025-09-26) - Ultra-Optimized 5-Tool Architecture

#### 🚀 **Revolutionary Tool Consolidation**
- **76% Tool Reduction**: Consolidated 21 individual tools into just 5 powerful, streamlined tools
- **Zero Feature Loss**: All original functionality preserved while dramatically improving user experience
- **Ultra-Simple Workflows**: Complete decision-making and thinking processes in single tool calls

#### 🎯 **New Ultra-Optimized Tools**
- **`make_decision`**: Complete decision workflow (8 tools → 1) - Create, evaluate, analyze, and recommend in one call
- **`analyze_decision`**: Deep analysis suite (5 tools → 1) - Bias detection, logic validation, risk assessment, alternatives
- **`structured_thinking`**: Complete thinking workflow (8 tools → 1) - Start, add thoughts, analyze, conclude
- **`manage_sessions`**: Universal session management (4 tools → 1) - Get, list, manage all session types
- **`validate_logic`**: Quick logic validation (1 tool → 1) - Instant consistency checking

#### ⚡ **Performance & UX Improvements**
- **Faster Workflows**: 1-2 tool calls instead of 8-10 for complete processes
- **Reduced Cognitive Load**: Minimal tool selection and configuration
- **Enterprise-Ready**: Professional, streamlined interface for production use
- **100% Backward Compatible**: All existing functionality accessible through new tools

#### 🔧 **Technical Excellence**
- **Database Integration**: Full session persistence across all tools
- **Async Operations**: Proper async/await implementation for all database operations
- **Error Handling**: Robust error handling and session recovery
- **Type Safety**: Complete TypeScript implementation with zero compilation errors

#### 📊 **Impact Metrics**
- **Tool Count**: 21 → 5 tools (76% reduction)
- **Success Rate**: 100% functionality preservation
- **Performance**: Faster execution through consolidated workflows
- **User Experience**: Dramatically simplified interface

### v2.1.2 (2025-09-26) - MCP Configuration Fix

#### 🐛 **Critical Bug Fixes**
- **Fixed Red Dot Error**: Resolved version mismatch between server.ts (1.0.0) and package.json (2.1.0)
- **Updated MCP Configuration**: Changed from global `decision-mcp` to `npx buildworks-ai-decision-mcp` approach
- **Improved Installation Process**: Emphasized npx as recommended approach to avoid global installation issues

#### 📚 **Documentation Updates**
- Updated MCP configuration examples in README.md
- Added installation section emphasizing npx approach
- Added note explaining benefits of npx (always latest version, no global install issues)

### v2.1.1 (2025-09-26) - Server Version Fix

#### 🐛 **Bug Fixes**
- Fixed server version mismatch that was causing MCP client connection issues

### v2.1.0 (2025-09-26) - Professional Code Quality Release

#### 🎯 **Major Improvements**
- **100% Code Quality Achievement**: Eliminated all 45 ESLint warnings and achieved zero TypeScript compilation errors
- **Professional Code Standards**: Complete transition from `any` types to proper TypeScript typing
- **Production-Ready Quality**: Comprehensive testing and validation across all components

#### ✨ **New Features**
- **External Data Integration**: Fetch and attach data from external REST/JSON APIs
- **Multi-language Support**: Complete i18n implementation with English, Spanish, and French translations
- **Advanced Visualization**: Generate Mermaid diagrams and export sessions in multiple formats
- **Advanced NLP Integration**: Keyword extraction, text summarization, and sentiment analysis
- **ML-Ready Bias Detection**: Baseline machine learning models for advanced bias identification
- **Collaborative Decision Making**: Multi-user sessions with real-time synchronization

#### 🔧 **Technical Enhancements**
- **Type Safety**: Replaced all `any` types with proper TypeScript interfaces and types
- **Error Handling**: Robust error handling and recovery mechanisms
- **Performance Optimization**: Multi-layer caching system with performance monitoring
- **Security Hardening**: Input validation, sanitization, and comprehensive audit logging
- **Rate Limiting**: Configurable rate limits for sessions, global operations, and analysis
- **Database Integration**: SQLite-based persistent storage with automatic session recovery

#### 🐛 **Bug Fixes**
- Fixed TypeScript compilation errors across all modules
- Resolved ESLint rule violations for consistent code quality
- Corrected type compatibility issues with external dependencies
- Fixed node-fetch RequestInit type conflicts

#### 🏗️ **Infrastructure**
- Enhanced Docker configuration with proper labeling
- Updated GitHub Actions for automated publishing
- Improved build process with zero-warning compilation
- Comprehensive testing suite for all features

### v2.0.4 (2025-09-25) - Feature Complete Release

#### ✨ **Features Added**
- All roadmap features implemented and functional
- Enhanced decision analysis tools
- Improved sequential thinking capabilities

#### 🔧 **Technical Improvements**
- Basic TypeScript implementation
- Core MCP server functionality
- Essential security features

### v2.0.0 (2025-09-24) - Initial Production Release

#### 🎉 **Initial Release**
- Core sequential thinking tools
- Basic decision-making capabilities
- MCP server implementation
- npm package distribution

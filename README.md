# Decision MCP - Sequential Thinking and Decision Making Tools

A comprehensive Model Context Protocol (MCP) server that provides tools for sequential thinking, structured decision making, and decision analysis. This server enables AI assistants to guide users through complex problem-solving and decision-making processes.

## Features

### 🧠 Sequential Thinking Tools
- **Structured Problem Solving**: Break down complex problems into manageable, sequential steps
- **Thought Tracking**: Record, revise, and branch thoughts as understanding evolves
- **Progress Analysis**: Monitor thinking progress and identify key insights
- **Branching Logic**: Explore alternative approaches and perspectives

### 🎯 Decision Making Tools
- **Criteria-Based Evaluation**: Define and weight decision criteria
- **Option Analysis**: Add and evaluate multiple options systematically
- **Scoring System**: Rate options against criteria with detailed reasoning
- **Recommendation Engine**: Generate data-driven recommendations with confidence levels

### 🔍 Decision Analysis Tools
- **Bias Detection**: Identify cognitive biases in decision-making processes
- **Logic Validation**: Ensure logical consistency and completeness
- **Risk Assessment**: Evaluate and categorize decision risks
- **Alternative Generation**: Create innovative alternatives and hybrid approaches

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd decision-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

## Usage

### Starting the MCP Server

The server runs on stdio and can be integrated with MCP-compatible AI assistants:

```bash
node dist/server.js
```

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

- [ ] Persistent session storage
- [ ] Advanced NLP integration
- [ ] Machine learning bias detection
- [ ] Collaborative decision making
- [ ] Integration with external data sources
- [ ] Advanced visualization tools
- [ ] Multi-language support
- [ ] Performance optimization
- [ ] Enhanced security features
- [ ] API rate limiting

# Sequential Thinking Example

This example demonstrates how to use the Sequential Thinking tools to work through a complex problem step by step.

## Problem: Improving Customer Satisfaction

Let's work through the problem: "How can we improve customer satisfaction in our e-commerce platform?"

### Step 1: Start Thinking Session

```json
{
  "tool": "start_thinking",
  "arguments": {
    "problem": "How can we improve customer satisfaction in our e-commerce platform?",
    "context": "We've seen a 15% drop in customer satisfaction scores over the past quarter. Our current score is 3.2/5.0, down from 3.8/5.0. We need to identify root causes and implement solutions.",
    "maxThoughts": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "thinking-session-001",
    "problem": "How can we improve customer satisfaction in our e-commerce platform?",
    "thoughts": [],
    "branches": [],
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "message": "Thinking session started successfully",
    "maxThoughts": 20
  }
}
```

### Step 2: Add Initial Thoughts

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "thought": "First, I need to understand what's causing the drop in satisfaction. The 15% decrease is significant and suggests a systematic issue rather than random variation."
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "thought": "I should analyze the customer feedback data to identify common complaints and pain points. This will help me understand the root causes."
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "thought": "The timing of the drop (past quarter) suggests it might be related to recent changes - perhaps a new feature, policy change, or external factor like increased competition."
  }
}
```

### Step 3: Branch into Specific Areas

```json
{
  "tool": "branch_from_thought",
  "arguments": {
    "thoughtId": "thought-002",
    "newDirection": "Analyze customer feedback data systematically",
    "description": "Deep dive into feedback analysis"
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "branchId": "branch-001",
    "thought": "Looking at the feedback data, I notice three main categories of complaints: 1) Slow website performance, 2) Difficult checkout process, 3) Poor customer service response times."
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "branchId": "branch-001",
    "thought": "The website performance issues seem to be the most frequent complaint (45% of negative feedback). This could be due to increased traffic or recent code changes that weren't properly optimized."
  }
}
```

### Step 4: Create Another Branch

```json
{
  "tool": "branch_from_thought",
  "arguments": {
    "thoughtId": "thought-003",
    "newDirection": "Investigate recent changes and external factors",
    "description": "Explore timing and external influences"
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "branchId": "branch-002",
    "thought": "Reviewing our change log, I see we deployed a new checkout flow 2 months ago. This aligns with the timing of the satisfaction drop. The new flow might be causing confusion or technical issues."
  }
}
```

### Step 5: Analyze Progress

```json
{
  "tool": "analyze_thinking_progress",
  "arguments": {
    "sessionId": "thinking-session-001",
    "includeBranches": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "thinking-session-001",
    "totalThoughts": 6,
    "activeBranches": 2,
    "averageThoughtLength": 156,
    "keyInsights": [
      "Website performance issues are the most frequent complaint (45% of negative feedback)",
      "New checkout flow deployment aligns with satisfaction drop timing",
      "Three main complaint categories identified: performance, checkout, customer service"
    ],
    "nextSteps": [
      "Continue exploring the problem with more detailed thoughts",
      "Review and develop the existing branches further",
      "Begin synthesizing insights into a conclusion"
    ],
    "confidence": 0.7
  }
}
```

### Step 6: Continue Developing Insights

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "thought": "Based on my analysis, I can see a clear pattern: the satisfaction drop is primarily driven by technical issues (website performance and checkout problems) rather than product or service quality issues."
  }
}
```

```json
{
  "tool": "add_thought",
  "arguments": {
    "sessionId": "thinking-session-001",
    "thought": "The solution approach should focus on: 1) Immediate fixes for website performance, 2) Rollback or fix the new checkout flow, 3) Improve customer service response times, 4) Implement better testing and monitoring."
  }
}
```

### Step 7: Conclude the Thinking Session

```json
{
  "tool": "conclude_thinking",
  "arguments": {
    "sessionId": "thinking-session-001",
    "conclusion": "The customer satisfaction drop is primarily caused by technical issues introduced in the past quarter. The main culprits are website performance problems (45% of complaints) and a problematic new checkout flow. The solution requires immediate technical fixes, better testing processes, and improved customer service response times. Priority should be given to website performance optimization and checkout flow improvements.",
    "confidence": 0.85
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "thinking-session-001",
    "problem": "How can we improve customer satisfaction in our e-commerce platform?",
    "thoughts": [...],
    "branches": [...],
    "status": "completed",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:15:00Z",
    "conclusion": "The customer satisfaction drop is primarily caused by technical issues introduced in the past quarter..."
  },
  "metadata": {
    "message": "Thinking session concluded successfully",
    "confidence": 0.85,
    "totalThoughts": 8
  }
}
```

## Key Benefits of This Approach

1. **Structured Problem Solving**: The sequential approach ensures we don't miss important aspects of the problem
2. **Branching Logic**: Allows exploration of different angles and perspectives
3. **Progress Tracking**: Regular analysis helps identify when we have enough information
4. **Documentation**: All thoughts and reasoning are preserved for future reference
5. **Confidence Assessment**: The system helps gauge how confident we are in our conclusions

## Best Practices

1. **Start Broad**: Begin with general thoughts about the problem
2. **Branch Strategically**: Create branches when you want to explore specific areas in detail
3. **Analyze Progress**: Regularly check your progress to ensure you're on track
4. **Revise When Needed**: Don't hesitate to revise thoughts as new information emerges
5. **Conclude Thoughtfully**: Take time to synthesize insights into a clear conclusion

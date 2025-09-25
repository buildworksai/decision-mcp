# Decision Analysis Example

This example demonstrates how to use the Decision Analysis tools to evaluate and improve a decision-making process.

## Scenario: Analyzing a Previous Decision

Let's analyze the CRM vendor decision we made in the previous example to identify potential biases, validate logic, and assess risks.

### Step 1: Analyze Bias in the Decision

```json
{
  "tool": "analyze_bias",
  "arguments": {
    "sessionId": "decision-session-001",
    "includeMitigation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "decision-session-001",
    "detectedBiases": [
      {
        "type": "availability",
        "severity": 0.5,
        "description": "Recent or easily recalled information may be overemphasized",
        "evidence": [
          "Limited option exploration",
          "Recent events heavily weighted"
        ],
        "mitigation": "Systematically explore all relevant options and historical data"
      },
      {
        "type": "anchoring",
        "severity": 0.6,
        "description": "First information received may be unduly influencing the decision",
        "evidence": [
          "Early criteria given higher weights",
          "First option evaluated differently"
        ],
        "mitigation": "Re-evaluate criteria weights and option scores independently"
      }
    ],
    "overallBiasScore": 0.55,
    "recommendations": [
      "Systematically explore all relevant options and historical data",
      "Re-evaluate criteria weights and option scores independently",
      "Consider involving external stakeholders for objective perspective",
      "Document decision rationale for future reference"
    ],
    "confidence": 0.67
  }
}
```

### Step 2: Validate Logic

```json
{
  "tool": "validate_logic",
  "arguments": {
    "sessionId": "decision-session-001",
    "strictMode": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Score for criteria Cost lacks detailed reasoning",
      "Score for criteria Integration lacks detailed reasoning"
    ],
    "suggestions": [
      "Consider if all options are viable - average score is very low",
      "Review criteria weights to ensure they reflect true priorities"
    ],
    "consistency": 0.85
  }
}
```

### Step 3: Assess Risks

```json
{
  "tool": "assess_risks",
  "arguments": {
    "sessionId": "decision-session-001",
    "includeMitigation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "level": "medium",
      "probability": 0.6,
      "impact": 0.5,
      "description": "Incomplete evaluation of all options",
      "mitigation": [
        "Complete evaluation of remaining options"
      ],
      "monitoring": [
        "Ensure all options are properly assessed"
      ]
    },
    {
      "level": "low",
      "probability": 0.4,
      "impact": 0.3,
      "description": "Criteria weights may not reflect true priorities",
      "mitigation": [
        "Review and adjust criteria weights"
      ],
      "monitoring": [
        "Validate criteria importance with stakeholders"
      ]
    }
  ]
}
```

### Step 4: Generate Alternatives

```json
{
  "tool": "generate_alternatives",
  "arguments": {
    "sessionId": "decision-session-001",
    "maxAlternatives": 3,
    "focusAreas": ["innovation", "feasibility"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alt-001",
      "name": "Hybrid Approach",
      "description": "Combination of best elements from multiple options",
      "pros": [
        "Leverages strengths of multiple options",
        "Reduces individual option weaknesses"
      ],
      "cons": [
        "More complex to implement",
        "Potential for conflicting approaches"
      ],
      "feasibility": 0.6,
      "innovation": 0.8
    },
    {
      "id": "alt-002",
      "name": "Phased Implementation",
      "description": "Implement solution in stages with learning and adjustment",
      "pros": [
        "Lower initial risk",
        "Opportunity to learn and improve"
      ],
      "cons": [
        "Longer timeline",
        "May miss time-sensitive opportunities"
      ],
      "feasibility": 0.8,
      "innovation": 0.4
    },
    {
      "id": "alt-003",
      "name": "Innovative Solution",
      "description": "Explore novel approaches not yet considered",
      "pros": [
        "Potential for breakthrough results",
        "Competitive advantage"
      ],
      "cons": [
        "Higher uncertainty",
        "May require significant research"
      ],
      "feasibility": 0.3,
      "innovation": 0.9
    }
  ]
}
```

### Step 5: Comprehensive Analysis

```json
{
  "tool": "comprehensive_analysis",
  "arguments": {
    "sessionId": "decision-session-001",
    "includeAll": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "decision-session-001",
    "biasAnalysis": {
      "sessionId": "decision-session-001",
      "detectedBiases": [
        {
          "type": "availability",
          "severity": 0.5,
          "description": "Recent or easily recalled information may be overemphasized",
          "evidence": [
            "Limited option exploration",
            "Recent events heavily weighted"
          ],
          "mitigation": "Systematically explore all relevant options and historical data"
        },
        {
          "type": "anchoring",
          "severity": 0.6,
          "description": "First information received may be unduly influencing the decision",
          "evidence": [
            "Early criteria given higher weights",
            "First option evaluated differently"
          ],
          "mitigation": "Re-evaluate criteria weights and option scores independently"
        }
      ],
      "overallBiasScore": 0.55,
      "recommendations": [
        "Systematically explore all relevant options and historical data",
        "Re-evaluate criteria weights and option scores independently",
        "Consider involving external stakeholders for objective perspective",
        "Document decision rationale for future reference"
      ],
      "confidence": 0.67
    },
    "logicValidation": {
      "isValid": true,
      "errors": [],
      "warnings": [
        "Score for criteria Cost lacks detailed reasoning",
        "Score for criteria Integration lacks detailed reasoning"
      ],
      "suggestions": [
        "Consider if all options are viable - average score is very low",
        "Review criteria weights to ensure they reflect true priorities"
      ],
      "consistency": 0.85
    },
    "riskAssessment": [
      {
        "level": "medium",
        "probability": 0.6,
        "impact": 0.5,
        "description": "Incomplete evaluation of all options",
        "mitigation": [
          "Complete evaluation of remaining options"
        ],
        "monitoring": [
          "Ensure all options are properly assessed"
        ]
      },
      {
        "level": "low",
        "probability": 0.4,
        "impact": 0.3,
        "description": "Criteria weights may not reflect true priorities",
        "mitigation": [
          "Review and adjust criteria weights"
        ],
        "monitoring": [
          "Validate criteria importance with stakeholders"
        ]
      }
    ],
    "alternatives": [
      {
        "id": "alt-001",
        "name": "Hybrid Approach",
        "description": "Combination of best elements from multiple options",
        "pros": [
          "Leverages strengths of multiple options",
          "Reduces individual option weaknesses"
        ],
        "cons": [
          "More complex to implement",
          "Potential for conflicting approaches"
        ],
        "feasibility": 0.6,
        "innovation": 0.8
      },
      {
        "id": "alt-002",
        "name": "Phased Implementation",
        "description": "Implement solution in stages with learning and adjustment",
        "pros": [
          "Lower initial risk",
          "Opportunity to learn and improve"
        ],
        "cons": [
          "Longer timeline",
          "May miss time-sensitive opportunities"
        ],
        "feasibility": 0.8,
        "innovation": 0.4
      }
    ],
    "overallQuality": 0.72,
    "recommendations": [
      "Address identified biases before finalizing decision",
      "Resolve logic validation errors",
      "Develop mitigation strategies for critical risks",
      "Consider generated alternatives",
      "Document decision rationale for future reference",
      "Establish monitoring and review processes"
    ]
  }
}
```

## Analysis Summary

### Bias Analysis Results

**Overall Bias Score: 0.55 (Medium)**

**Detected Biases:**
1. **Availability Bias (0.5 severity)**: Limited option exploration, recent events heavily weighted
2. **Anchoring Bias (0.6 severity)**: Early criteria given higher weights, first option evaluated differently

**Mitigation Strategies:**
- Systematically explore all relevant options and historical data
- Re-evaluate criteria weights and option scores independently
- Consider involving external stakeholders for objective perspective

### Logic Validation Results

**Overall Consistency: 0.85 (Good)**

**Issues Found:**
- Some scores lack detailed reasoning
- Average scores are low, suggesting all options may have issues
- Criteria weights may not reflect true priorities

**Recommendations:**
- Provide more detailed reasoning for all scores
- Review criteria weights with stakeholders
- Consider if additional options should be explored

### Risk Assessment Results

**Risk Level: Medium-Low**

**Identified Risks:**
1. **Medium Risk**: Incomplete evaluation of all options
2. **Low Risk**: Criteria weights may not reflect true priorities

**Mitigation Strategies:**
- Complete evaluation of remaining options
- Review and adjust criteria weights
- Validate criteria importance with stakeholders

### Alternative Options Generated

1. **Hybrid Approach**: Combine best elements from multiple options
2. **Phased Implementation**: Implement in stages with learning
3. **Innovative Solution**: Explore novel approaches

### Overall Quality Assessment

**Quality Score: 0.72 (Good)**

The decision process shows good structure and logic, but there are opportunities for improvement in bias mitigation and comprehensive evaluation.

## Key Insights

1. **Bias Awareness**: The analysis revealed potential biases that could affect decision quality
2. **Logic Validation**: The decision logic is sound but could benefit from more detailed reasoning
3. **Risk Management**: Identified risks are manageable with proper mitigation strategies
4. **Alternative Thinking**: Generated alternatives provide additional options to consider
5. **Quality Improvement**: The analysis provides specific recommendations for improving future decisions

## Best Practices for Decision Analysis

1. **Regular Analysis**: Analyze decisions after they're made to learn and improve
2. **Bias Awareness**: Be aware of common cognitive biases and their impact
3. **Logic Validation**: Ensure decision logic is sound and well-documented
4. **Risk Assessment**: Identify and mitigate potential risks
5. **Alternative Generation**: Consider alternative approaches and solutions
6. **Continuous Improvement**: Use analysis results to improve future decision processes

import type { ThinkingSession } from '../types/thinking-types.js';
import type { DecisionSession } from '../types/decision-types.js';

export interface VisualizationOptions {
  format: 'mermaid' | 'json' | 'markdown';
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  maxDepth?: number;
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

export interface VisualizationResult {
  id: string;
  sessionId: string;
  sessionType: 'thinking' | 'decision';
  format: string;
  content: string;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    depth: number;
    generatedAt: Date;
  };
}

export class VisualizationService {
  /**
   * Generate Mermaid diagram for thinking session
   */
  generateThinkingDiagram(session: ThinkingSession, options: VisualizationOptions = { format: 'mermaid' }): VisualizationResult {
    const { includeMetadata = false, includeTimestamps = false, maxDepth = 10 } = options;
    
    let mermaidContent = 'graph TD\n';
    let nodeCount = 0;
    let edgeCount = 0;
    let maxDepthReached = 0;

    // Add session node
    const sessionNodeId = 'S' + session.id.substring(0, 8);
    mermaidContent += `    ${sessionNodeId}["🧠 ${this.escapeText(session.problem.substring(0, 50))}..."]\n`;
    nodeCount++;

    // Add thoughts
    const thoughtNodes = new Map<string, string>();
    session.thoughts.forEach((thought, index) => {
      if (index >= maxDepth) return;
      
      const thoughtNodeId = 'T' + thought.id.substring(0, 8);
      const thoughtText = this.escapeText(thought.content.substring(0, 100));
      const timestamp = includeTimestamps ? ` (${thought.timestamp.toLocaleTimeString()})` : '';
      
      mermaidContent += `    ${thoughtNodeId}["💭 ${thoughtText}${timestamp}"]\n`;
      thoughtNodes.set(thought.id, thoughtNodeId);
      nodeCount++;
      maxDepthReached = Math.max(maxDepthReached, index + 1);

      // Connect to parent or session
      if (thought.parentId && thoughtNodes.has(thought.parentId)) {
        mermaidContent += `    ${thoughtNodes.get(thought.parentId)} --> ${thoughtNodeId}\n`;
        edgeCount++;
      } else {
        mermaidContent += `    ${sessionNodeId} --> ${thoughtNodeId}\n`;
        edgeCount++;
      }
    });

    // Add branches
    session.branches.forEach(branchId => {
      const branchNodeId = 'B' + branchId.substring(0, 8);
      mermaidContent += `    ${branchNodeId}["🌿 Branch: ${branchId.substring(0, 20)}..."]\n`;
      nodeCount++;
    });

    // Add conclusion if exists
    if (session.conclusion) {
      const conclusionNodeId = 'C' + session.id.substring(0, 8);
      const conclusionText = this.escapeText(session.conclusion.substring(0, 100));
      mermaidContent += `    ${conclusionNodeId}["✅ ${conclusionText}"]\n`;
      mermaidContent += `    ${sessionNodeId} --> ${conclusionNodeId}\n`;
      nodeCount++;
      edgeCount++;
    }

    // Add metadata if requested
    if (includeMetadata) {
      mermaidContent += `    META["📊 Thoughts: ${session.thoughts.length}<br/>Branches: ${session.branches.length}<br/>Status: ${session.status}"]\n`;
      mermaidContent += `    ${sessionNodeId} -.-> META\n`;
      nodeCount++;
      edgeCount++;
    }

    return {
      id: `thinking_${session.id}_${Date.now()}`,
      sessionId: session.id,
      sessionType: 'thinking',
      format: 'mermaid',
      content: mermaidContent,
      metadata: {
        nodeCount,
        edgeCount,
        depth: maxDepthReached,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mermaid diagram for decision session
   */
  generateDecisionDiagram(session: DecisionSession, options: VisualizationOptions = { format: 'mermaid' }): VisualizationResult {
    const { includeMetadata = false } = options;
    
    let mermaidContent = 'graph TD\n';
    let nodeCount = 0;
    let edgeCount = 0;

    // Add session node
    const sessionNodeId = 'D' + session.id.substring(0, 8);
    mermaidContent += `    ${sessionNodeId}["🎯 ${this.escapeText(session.context.substring(0, 50))}..."]\n`;
    nodeCount++;

    // Add criteria
    const criteriaNodes = new Map<string, string>();
    session.criteria.forEach((criteria) => {
      const criteriaNodeId = 'C' + criteria.id.substring(0, 8);
      const criteriaText = this.escapeText(`${criteria.name} (${criteria.weight})`);
      mermaidContent += `    ${criteriaNodeId}["📏 ${criteriaText}"]\n`;
      criteriaNodes.set(criteria.id, criteriaNodeId);
      nodeCount++;

      mermaidContent += `    ${sessionNodeId} --> ${criteriaNodeId}\n`;
      edgeCount++;
    });

    // Add options
    const optionNodes = new Map<string, string>();
    session.options.forEach((option) => {
      const optionNodeId = 'O' + option.id.substring(0, 8);
      const optionText = this.escapeText(option.name.substring(0, 30));
      mermaidContent += `    ${optionNodeId}["📋 ${optionText}"]\n`;
      optionNodes.set(option.id, optionNodeId);
      nodeCount++;

      mermaidContent += `    ${sessionNodeId} --> ${optionNodeId}\n`;
      edgeCount++;
    });

    // Add evaluations
    session.evaluations.forEach(evaluation => {
      const optionNodeId = optionNodes.get(evaluation.optionId);
      
      if (optionNodeId) {
        evaluation.scores.forEach(score => {
          const criteriaNodeId = criteriaNodes.get(score.criteriaId);
          if (criteriaNodeId) {
            const scoreText = `${score.score}/10`;
            mermaidContent += `    ${optionNodeId} -->|${scoreText}| ${criteriaNodeId}\n`;
            edgeCount++;
          }
        });
      }
    });

    // Add recommendation if exists
    if (session.recommendation) {
      const recNodeId = 'R' + session.id.substring(0, 8);
      const recText = this.escapeText(session.recommendation.substring(0, 50));
      mermaidContent += `    ${recNodeId}["🏆 ${recText}"]\n`;
      mermaidContent += `    ${sessionNodeId} --> ${recNodeId}\n`;
      nodeCount++;
      edgeCount++;
    }

    // Add metadata if requested
    if (includeMetadata) {
      mermaidContent += `    META["📊 Criteria: ${session.criteria.length}<br/>Options: ${session.options.length}<br/>Evaluations: ${session.evaluations.length}"]\n`;
      mermaidContent += `    ${sessionNodeId} -.-> META\n`;
      nodeCount++;
      edgeCount++;
    }

    return {
      id: `decision_${session.id}_${Date.now()}`,
      sessionId: session.id,
      sessionType: 'decision',
      format: 'mermaid',
      content: mermaidContent,
      metadata: {
        nodeCount,
        edgeCount,
        depth: 3, // Session -> Criteria/Options -> Evaluations
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate JSON export
   */
  generateJsonExport(session: ThinkingSession | DecisionSession, options: VisualizationOptions = { format: 'json' }): VisualizationResult {
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    const exportData: Record<string, unknown> = {
      id: session.id,
      type: 'criteria' in session ? 'decision' : 'thinking',
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status
    };

    if (includeTimestamps) {
      exportData.timestamps = {
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      };
    }

    if ('criteria' in session) {
      // Decision session
      exportData.context = session.context;
      exportData.criteria = session.criteria.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        weight: c.weight,
        type: c.type
      }));
      exportData.options = session.options.map(o => ({
        id: o.id,
        name: o.name,
        description: o.description,
        pros: o.pros,
        cons: o.cons,
        risks: o.risks
      }));
      exportData.evaluations = session.evaluations;
      if (session.recommendation) {
        exportData.recommendation = session.recommendation;
      }
    } else {
      // Thinking session
      exportData.problem = session.problem;
      exportData.thoughts = session.thoughts.map(t => ({
        id: t.id,
        content: t.content,
        timestamp: includeTimestamps ? t.timestamp.toISOString() : undefined,
        parentId: t.parentId,
        branchId: t.branchId
      }));
      exportData.branches = session.branches;
      if (session.conclusion) {
        exportData.conclusion = session.conclusion;
      }
    }

    if (includeMetadata) {
      exportData.metadata = {
        nodeCount: 'criteria' in session ? session.criteria.length + session.options.length : session.thoughts.length,
        generatedAt: new Date().toISOString(),
        version: '2.4.0'
      };
    }

    return {
      id: `${exportData.type}_${session.id}_${Date.now()}`,
      sessionId: session.id,
      sessionType: exportData.type as ('thinking' | 'decision'),
      format: 'json',
      content: JSON.stringify(exportData, null, 2),
      metadata: {
        nodeCount: (exportData.metadata as { nodeCount?: number })?.nodeCount || 0,
        edgeCount: 0,
        depth: 0,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Markdown export
   */
  generateMarkdownExport(session: ThinkingSession | DecisionSession, options: VisualizationOptions = { format: 'markdown' }): VisualizationResult {
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    let markdown = '';
    let nodeCount = 0;

    if ('criteria' in session) {
      // Decision session
      markdown += `# Decision Session: ${session.context}\n\n`;
      markdown += `**Status:** ${session.status}\n`;
      markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
      markdown += `**Updated:** ${session.updatedAt.toLocaleString()}\n\n`;

      markdown += `## Criteria\n\n`;
      session.criteria.forEach(criteria => {
        markdown += `### ${criteria.name}\n`;
        markdown += `- **Weight:** ${criteria.weight}\n`;
        markdown += `- **Type:** ${criteria.type}\n`;
        markdown += `- **Description:** ${criteria.description}\n\n`;
        nodeCount++;
      });

      markdown += `## Options\n\n`;
      session.options.forEach(option => {
        markdown += `### ${option.name}\n`;
        markdown += `- **Description:** ${option.description}\n`;
        markdown += `- **Pros:** ${option.pros.join(', ')}\n`;
        markdown += `- **Cons:** ${option.cons.join(', ')}\n`;
        markdown += `- **Risks:** ${option.risks.join(', ')}\n\n`;
        nodeCount++;
      });

      if (session.recommendation) {
        markdown += `## Recommendation\n\n`;
        markdown += `**Recommendation:** ${session.recommendation}\n\n`;
      }
    } else {
      // Thinking session
      markdown += `# Thinking Session: ${session.problem}\n\n`;
      markdown += `**Status:** ${session.status}\n`;
      markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
      markdown += `**Updated:** ${session.updatedAt.toLocaleString()}\n\n`;

      markdown += `## Thoughts\n\n`;
      session.thoughts.forEach((thought, index) => {
        markdown += `### Thought ${index + 1}\n`;
        markdown += `${thought.content}\n\n`;
        if (includeTimestamps) {
          markdown += `*Added: ${thought.timestamp.toLocaleString()}*\n\n`;
        }
        nodeCount++;
      });

      if (session.conclusion) {
        markdown += `## Conclusion\n\n`;
        markdown += `${session.conclusion}\n\n`;
      }
    }

    if (includeMetadata) {
      markdown += `---\n\n`;
      markdown += `*Generated by Decision MCP by BuildWorks.AI v2.4.0*\n`;
      markdown += `*Total items: ${nodeCount}*\n`;
    }

    return {
      id: `${'criteria' in session ? 'decision' : 'thinking'}_${session.id}_${Date.now()}`,
      sessionId: session.id,
      sessionType: 'criteria' in session ? 'decision' : 'thinking',
      format: 'markdown',
      content: markdown,
      metadata: {
        nodeCount,
        edgeCount: 0,
        depth: 0,
        generatedAt: new Date()
      }
    };
  }

  private escapeText(text: string): string {
    return text
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }
}

// Singleton instance
export const visualizationService = new VisualizationService();

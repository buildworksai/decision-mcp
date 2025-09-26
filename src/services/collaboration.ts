import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Collaboration schemas
const CollaboratorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  role: z.enum(['owner', 'editor', 'viewer']),
  joinedAt: z.date(),
  lastActive: z.date()
});

const CollaborationSessionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sessionType: z.enum(['thinking', 'decision']),
  ownerId: z.string(),
  collaborators: z.array(CollaboratorSchema),
  permissions: z.object({
    allowEdit: z.boolean(),
    allowInvite: z.boolean(),
    allowExport: z.boolean()
  }),
  status: z.enum(['active', 'paused', 'locked', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date()
});

const CollaborationEventSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  action: z.enum(['join', 'leave', 'edit', 'comment', 'lock', 'unlock', 'invite']),
  details: z.record(z.unknown()),
  timestamp: z.date()
});

// Type exports
type CollaborationAction = 'join' | 'leave' | 'edit' | 'comment' | 'lock' | 'unlock' | 'invite';

const ConflictResolutionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  conflictType: z.enum(['concurrent_edit', 'permission_denied', 'data_inconsistency']),
  description: z.string(),
  resolution: z.enum(['automatic', 'manual', 'owner_decision']),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  status: z.enum(['pending', 'resolved', 'escalated'])
});

export type Collaborator = z.infer<typeof CollaboratorSchema>;
export type CollaborationSession = z.infer<typeof CollaborationSessionSchema>;
export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

export class CollaborationService {
  private sessions = new Map<string, CollaborationSession>();
  private events: CollaborationEvent[] = [];
  private conflicts: ConflictResolution[] = [];
  private locks = new Map<string, { userId: string; timestamp: Date; resource: string }>();

  /**
   * Create a collaborative session
   */
  createCollaborativeSession(
    sessionId: string,
    sessionType: 'thinking' | 'decision',
    ownerId: string,
    ownerName: string
  ): CollaborationSession {
    const collaborator: Collaborator = {
      id: ownerId,
      name: ownerName,
      role: 'owner',
      joinedAt: new Date(),
      lastActive: new Date()
    };

    const collaborationSession: CollaborationSession = {
      id: uuidv4(),
      sessionId,
      sessionType,
      ownerId,
      collaborators: [collaborator],
      permissions: {
        allowEdit: true,
        allowInvite: true,
        allowExport: true
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, collaborationSession);
    this.logEvent(sessionId, ownerId, 'join', { role: 'owner' });

    return collaborationSession;
  }

  /**
   * Add a collaborator to a session
   */
  addCollaborator(
    sessionId: string,
    userId: string,
    userName: string,
    role: 'editor' | 'viewer' = 'editor',
    invitedBy: string
  ): { success: boolean; error?: string; collaborator?: Collaborator } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Collaboration session not found' };
    }

    // Check if user is already a collaborator
    const existingCollaborator = session.collaborators.find(c => c.id === userId);
    if (existingCollaborator) {
      return { success: false, error: 'User is already a collaborator' };
    }

    // Check permissions
    const inviter = session.collaborators.find(c => c.id === invitedBy);
    if (!inviter || (inviter.role !== 'owner' && !session.permissions.allowInvite)) {
      return { success: false, error: 'Insufficient permissions to invite collaborators' };
    }

    const collaborator: Collaborator = {
      id: userId,
      name: userName,
      role,
      joinedAt: new Date(),
      lastActive: new Date()
    };

    session.collaborators.push(collaborator);
    session.updatedAt = new Date();

    this.logEvent(sessionId, userId, 'join', { role, invitedBy });

    return { success: true, collaborator };
  }

  /**
   * Remove a collaborator from a session
   */
  removeCollaborator(sessionId: string, userId: string, removedBy: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Collaboration session not found' };
    }

    // Check permissions
    const remover = session.collaborators.find(c => c.id === removedBy);
    if (!remover || (remover.role !== 'owner' && removedBy !== userId)) {
      return { success: false, error: 'Insufficient permissions to remove collaborators' };
    }

    // Cannot remove the owner
    if (userId === session.ownerId) {
      return { success: false, error: 'Cannot remove the session owner' };
    }

    const collaboratorIndex = session.collaborators.findIndex(c => c.id === userId);
    if (collaboratorIndex === -1) {
      return { success: false, error: 'Collaborator not found' };
    }

    session.collaborators.splice(collaboratorIndex, 1);
    session.updatedAt = new Date();

    this.logEvent(sessionId, userId, 'leave', { removedBy });

    return { success: true };
  }

  /**
   * Update collaborator role
   */
  updateCollaboratorRole(
    sessionId: string,
    userId: string,
    newRole: 'editor' | 'viewer',
    updatedBy: string
  ): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Collaboration session not found' };
    }

    // Only owner can update roles
    const updater = session.collaborators.find(c => c.id === updatedBy);
    if (!updater || updater.role !== 'owner') {
      return { success: false, error: 'Only the session owner can update roles' };
    }

    // Cannot change owner role
    if (userId === session.ownerId) {
      return { success: false, error: 'Cannot change the owner role' };
    }

    const collaborator = session.collaborators.find(c => c.id === userId);
    if (!collaborator) {
      return { success: false, error: 'Collaborator not found' };
    }

    collaborator.role = newRole;
    session.updatedAt = new Date();

    this.logEvent(sessionId, userId, 'edit', { action: 'role_update', newRole, updatedBy });

    return { success: true };
  }

  /**
   * Lock a resource for editing
   */
  lockResource(sessionId: string, resource: string, userId: string): { success: boolean; error?: string } {
    const lockKey = `${sessionId}:${resource}`;
    const existingLock = this.locks.get(lockKey);

    if (existingLock) {
      const lockAge = Date.now() - existingLock.timestamp.getTime();
      // Auto-unlock after 5 minutes
      if (lockAge < 300000 && existingLock.userId !== userId) {
        return { success: false, error: 'Resource is locked by another user' };
      }
    }

    this.locks.set(lockKey, {
      userId,
      timestamp: new Date(),
      resource
    });

    this.logEvent(sessionId, userId, 'lock', { resource });

    return { success: true };
  }

  /**
   * Unlock a resource
   */
  unlockResource(sessionId: string, resource: string, userId: string): { success: boolean; error?: string } {
    const lockKey = `${sessionId}:${resource}`;
    const existingLock = this.locks.get(lockKey);

    if (!existingLock) {
      return { success: false, error: 'Resource is not locked' };
    }

    if (existingLock.userId !== userId) {
      return { success: false, error: 'Only the user who locked the resource can unlock it' };
    }

    this.locks.delete(lockKey);
    this.logEvent(sessionId, userId, 'unlock', { resource });

    return { success: true };
  }

  /**
   * Check if a resource is locked
   */
  isResourceLocked(sessionId: string, resource: string): { locked: boolean; lockedBy?: string; lockedAt?: Date } {
    const lockKey = `${sessionId}:${resource}`;
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return { locked: false };
    }

    const lockAge = Date.now() - lock.timestamp.getTime();
    if (lockAge > 300000) { // Auto-unlock after 5 minutes
      this.locks.delete(lockKey);
      return { locked: false };
    }

    return {
      locked: true,
      lockedBy: lock.userId,
      lockedAt: lock.timestamp
    };
  }

  /**
   * Get collaboration session
   */
  getCollaborationSession(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get collaborators for a session
   */
  getCollaborators(sessionId: string): Collaborator[] {
    const session = this.sessions.get(sessionId);
    return session ? session.collaborators : [];
  }

  /**
   * Get collaboration events
   */
  getCollaborationEvents(sessionId: string, limit: number = 50): CollaborationEvent[] {
    return this.events
      .filter(event => event.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Update collaborator activity
   */
  updateCollaboratorActivity(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const collaborator = session.collaborators.find(c => c.id === userId);
      if (collaborator) {
        collaborator.lastActive = new Date();
        session.updatedAt = new Date();
      }
    }
  }

  /**
   * Resolve conflicts
   */
  resolveConflict(
    conflictId: string,
    resolution: 'automatic' | 'manual' | 'owner_decision',
    resolvedBy: string,
    details?: Record<string, unknown>
  ): { success: boolean; error?: string } {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    if (conflict.status !== 'pending') {
      return { success: false, error: 'Conflict is already resolved' };
    }

    conflict.resolution = resolution;
    conflict.resolvedBy = resolvedBy;
    conflict.resolvedAt = new Date();
    conflict.status = 'resolved';

    this.logEvent(conflict.sessionId, resolvedBy, 'edit', {
      action: 'conflict_resolution',
      conflictId,
      resolution,
      details
    });

    return { success: true };
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(sessionId?: string): ConflictResolution[] {
    return this.conflicts.filter(conflict => {
      if (conflict.status !== 'pending') return false;
      if (sessionId && conflict.sessionId !== sessionId) return false;
      return true;
    });
  }

  // Private helper methods
  private logEvent(sessionId: string, userId: string, action: string, details: Record<string, unknown>): void {
    const event: CollaborationEvent = {
      id: uuidv4(),
      sessionId,
      userId,
      action: action as CollaborationAction,
      details,
      timestamp: new Date()
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();

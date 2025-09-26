import Database from 'sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface SessionData {
  id: string;
  type: 'thinking' | 'decision';
  data: string; // JSON stringified session data
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
}

export class DatabaseService {
  private db: Database.Database;
  private dbPath: string;
  private initializationPromise: Promise<void>;

  constructor(dbPath?: string) {
    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = dbPath || join(dataDir, 'sessions.db');
    this.db = new Database.Database(this.dbPath);
    this.initializationPromise = this.initializeDatabase();
  }

  async waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK (type IN ('thinking', 'decision')),
            data TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'archived'))
          )
        `, (err) => {
          if (err) {
            console.error('Failed to create sessions table:', err);
            reject(err);
            return;
          }

          this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type)
          `, (err) => {
            if (err) {
              console.error('Failed to create type index:', err);
              reject(err);
              return;
            }

            this.db.run(`
              CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)
            `, (err) => {
              if (err) {
                console.error('Failed to create status index:', err);
                reject(err);
                return;
              }

              this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updatedAt)
              `, (err) => {
                if (err) {
                  console.error('Failed to create updated index:', err);
                  reject(err);
                  return;
                }

                console.log('Database initialized successfully');
                resolve();
              });
            });
          });
        });
      });
    });
  }

  async saveSession(sessionData: SessionData): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO sessions (id, type, data, createdAt, updatedAt, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        sessionData.id,
        sessionData.type,
        sessionData.data,
        sessionData.createdAt,
        sessionData.updatedAt,
        sessionData.status
      ], (err) => {
        if (err) {
          console.error('Failed to save session:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
        if (err) {
          console.error('Failed to get session:', err);
          reject(err);
        } else {
          resolve((row as SessionData) || null);
        }
      });
    });
  }

  async getAllSessions(type?: 'thinking' | 'decision', status?: 'active' | 'paused' | 'completed' | 'archived'): Promise<SessionData[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM sessions';
      const params: string[] = [];
      const conditions: string[] = [];

      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY updatedAt DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Failed to get sessions:', err);
          reject(err);
        } else {
          resolve(rows as SessionData[]);
        }
      });
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM sessions WHERE id = ?', [sessionId], (err) => {
        if (err) {
          console.error('Failed to delete session:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async updateSessionStatus(sessionId: string, status: 'active' | 'paused' | 'completed' | 'archived'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE sessions SET status = ?, updatedAt = ? WHERE id = ?',
        [status, new Date().toISOString(), sessionId],
        (err) => {
          if (err) {
            console.error('Failed to update session status:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      this.db.run(
        'DELETE FROM sessions WHERE status = ? AND updatedAt < ?',
        ['archived', cutoffDate.toISOString()],
        function(err) {
          if (err) {
            console.error('Failed to cleanup old sessions:', err);
            reject(err);
          } else {
            resolve(this.changes || 0);
          }
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

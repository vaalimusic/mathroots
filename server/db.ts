import { Pool, QueryResult } from 'pg';
import crypto from 'crypto';

export interface DbUser {
  id: string;
  email: string | null;
  password_hash: string | null;
  display_name: string;
  role: string;
  is_anonymous: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DbCustomTree {
  id: string;
  user_id: string;
  title: string;
  goal_formula: string;
  category: string;
  description: string;
  tree_data: any;
  is_public: boolean;
  share_slug: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbNodeMastery {
  id: string;
  user_id: string;
  node_id: string;
  tree_id: string;
  score: number;
  attempts_count: number;
  correct_count: number;
  last_tested_at: Date;
}

let pool: Pool | null = null;
let isConnected = false;

// In-memory fallback if PostgreSQL is not configured or temporarily unreachable
const inMemoryStore = {
  users: new Map<string, DbUser>(),
  sessions: new Map<string, { userId: string; expiresAt: number }>(),
  customTrees: new Map<string, DbCustomTree>(),
  masteries: new Map<string, DbNodeMastery>(),
  workoutAttempts: [] as any[],
  cognitiveGaps: new Map<string, any>(),
  canvasLayouts: new Map<string, any>(),
};

export async function initDb(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[DB] DATABASE_URL not set. Running in resilient In-Memory store mode.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    console.log('[DB] Successfully connected to PostgreSQL database.');

    // Run schema migrations/initialization
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        display_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        is_anonymous BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_trees (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        goal_formula TEXT,
        category VARCHAR(100),
        description TEXT,
        tree_data JSONB NOT NULL,
        is_public BOOLEAN DEFAULT false,
        share_slug VARCHAR(64) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS node_masteries (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        node_id VARCHAR(100) NOT NULL,
        tree_id VARCHAR(100) NOT NULL,
        score REAL DEFAULT 1.0,
        attempts_count INT DEFAULT 1,
        correct_count INT DEFAULT 1,
        last_tested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_node UNIQUE (user_id, node_id)
      );

      CREATE TABLE IF NOT EXISTS workout_attempts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        problem_id VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        selected_option INT,
        is_correct BOOLEAN NOT NULL,
        time_spent_sec INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cognitive_gaps (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        root_node_id VARCHAR(100),
        target_node_id VARCHAR(100),
        gap_concept VARCHAR(255),
        root_cause TEXT,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS canvas_layouts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        tree_id VARCHAR(100) NOT NULL,
        positions JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_tree_layout UNIQUE (user_id, tree_id)
      );

      CREATE INDEX IF NOT EXISTS idx_node_masteries_user ON node_masteries(user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_trees_user ON custom_trees(user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_trees_slug ON custom_trees(share_slug);
    `);

    client.release();
    isConnected = true;
    return true;
  } catch (err) {
    console.warn('[DB] PostgreSQL connection/migration warning:', err);
    console.log('[DB] Switching to resilient In-Memory store mode.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T> | null> {
  if (pool && isConnected) {
    return pool.query<T>(text, params);
  }
  return null;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    isConnected = false;
    console.log('[DB] PostgreSQL pool disconnected.');
  }
}

// -------------------------------------------------------------
// Database Operations (with dual PostgreSQL + In-Memory support)
// -------------------------------------------------------------

export const db = {
  // Users
  async createGuestUser(displayName = 'Ученик'): Promise<DbUser> {
    const id = crypto.randomUUID();
    const now = new Date();
    const user: DbUser = {
      id,
      email: null,
      password_hash: null,
      display_name: displayName,
      role: 'student',
      is_anonymous: true,
      created_at: now,
      updated_at: now,
    };

    if (isConnected && pool) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, role, is_anonymous)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, user.password_hash, user.display_name, user.role, user.is_anonymous]
      );
    } else {
      inMemoryStore.users.set(id, user);
    }
    return user;
  },

  async findUserById(id: string): Promise<DbUser | null> {
    if (isConnected && pool) {
      const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
      return res.rows[0] || null;
    }
    return inMemoryStore.users.get(id) || null;
  },

  async findUserByEmail(email: string): Promise<DbUser | null> {
    if (isConnected && pool) {
      const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
      return res.rows[0] || null;
    }
    for (const u of inMemoryStore.users.values()) {
      if (u.email?.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  },

  async createUser(email: string, passwordHash: string, displayName: string, role = 'student'): Promise<DbUser> {
    const id = crypto.randomUUID();
    const now = new Date();
    const user: DbUser = {
      id,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName,
      role,
      is_anonymous: false,
      created_at: now,
      updated_at: now,
    };

    if (isConnected && pool) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, role, is_anonymous)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, user.password_hash, user.display_name, user.role, user.is_anonymous]
      );
    } else {
      inMemoryStore.users.set(id, user);
    }
    return user;
  },

  // Node Masteries
  async getMasteredNodes(userId: string): Promise<{ nodeIds: string[]; masteries: DbNodeMastery[] }> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM node_masteries WHERE user_id = $1 AND score >= 0.7 ORDER BY last_tested_at DESC`,
        [userId]
      );
      const masteries = res.rows;
      return {
        nodeIds: masteries.map((m) => m.node_id),
        masteries,
      };
    }
    const masteries: DbNodeMastery[] = [];
    for (const m of inMemoryStore.masteries.values()) {
      if (m.user_id === userId && m.score >= 0.7) {
        masteries.push(m);
      }
    }
    return {
      nodeIds: masteries.map((m) => m.node_id),
      masteries,
    };
  },

  async upsertNodeMastery(
    userId: string,
    nodeId: string,
    treeId: string,
    score = 1.0,
    isCorrect = true
  ): Promise<DbNodeMastery> {
    const id = crypto.randomUUID();
    const now = new Date();

    if (isConnected && pool) {
      const res = await pool.query(
        `INSERT INTO node_masteries (id, user_id, node_id, tree_id, score, attempts_count, correct_count, last_tested_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $7)
         ON CONFLICT (user_id, node_id) DO UPDATE SET
           score = $5,
           attempts_count = node_masteries.attempts_count + 1,
           correct_count = node_masteries.correct_count + $6,
           last_tested_at = $7,
           updated_at = $7
         RETURNING *`,
        [id, userId, nodeId, treeId, score, isCorrect ? 1 : 0, now]
      );
      return res.rows[0];
    }

    const key = `${userId}:${nodeId}`;
    const existing = inMemoryStore.masteries.get(key);
    const updated: DbNodeMastery = {
      id: existing?.id || id,
      user_id: userId,
      node_id: nodeId,
      tree_id: treeId,
      score,
      attempts_count: (existing?.attempts_count || 0) + 1,
      correct_count: (existing?.correct_count || 0) + (isCorrect ? 1 : 0),
      last_tested_at: now,
    };
    inMemoryStore.masteries.set(key, updated);
    return updated;
  },

  // Workouts
  async recordWorkoutAttempt(
    userId: string,
    problemId: string,
    category: string,
    selectedOption: number,
    isCorrect: boolean,
    timeSpentSec = 0
  ): Promise<any> {
    const id = crypto.randomUUID();
    const now = new Date();

    if (isConnected && pool) {
      const res = await pool.query(
        `INSERT INTO workout_attempts (id, user_id, problem_id, category, selected_option, is_correct, time_spent_sec, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [id, userId, problemId, category, selectedOption, isCorrect, timeSpentSec, now]
      );
      return res.rows[0];
    }

    const item = { id, user_id: userId, problem_id: problemId, category, selected_option: selectedOption, is_correct: isCorrect, time_spent_sec: timeSpentSec, created_at: now };
    inMemoryStore.workoutAttempts.push(item);
    return item;
  },

  async getUserWorkoutStats(userId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    totalTimeSec: number;
    byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
    recentAttempts: any[];
  }> {
    let rows: any[] = [];
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM workout_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      );
      rows = res.rows;
    } else {
      rows = inMemoryStore.workoutAttempts
        .filter((a) => a.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
    }

    const totalAttempts = rows.length;
    const correctAttempts = rows.filter((r) => r.is_correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const totalTimeSec = rows.reduce((acc, r) => acc + (Number(r.time_spent_sec) || 0), 0);

    const byCategory: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const r of rows) {
      const cat = r.category || 'Общие';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, correct: 0, accuracy: 0 };
      }
      byCategory[cat].total++;
      if (r.is_correct) byCategory[cat].correct++;
    }

    for (const cat in byCategory) {
      const item = byCategory[cat];
      item.accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    }

    return {
      totalAttempts,
      correctAttempts,
      accuracy,
      totalTimeSec,
      byCategory,
      recentAttempts: rows.slice(0, 15),
    };
  },

  // Custom Trees
  async getCustomTrees(userId: string): Promise<DbCustomTree[]> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM custom_trees WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return res.rows;
    }
    const trees: DbCustomTree[] = [];
    for (const t of inMemoryStore.customTrees.values()) {
      if (t.user_id === userId) trees.push(t);
    }
    return trees;
  },

  async saveCustomTree(
    userId: string,
    treeData: any,
    isPublic = false
  ): Promise<DbCustomTree> {
    const id = treeData.id || crypto.randomUUID();
    const shareSlug = crypto.randomBytes(6).toString('hex');
    const now = new Date();
    const customTree: DbCustomTree = {
      id,
      user_id: userId,
      title: treeData.title || 'Пользовательская задача',
      goal_formula: treeData.goalFormula || '',
      category: treeData.category || 'Пользовательские',
      description: treeData.description || '',
      tree_data: treeData,
      is_public: isPublic,
      share_slug: shareSlug,
      created_at: now,
      updated_at: now,
    };

    if (isConnected && pool) {
      await pool.query(
        `INSERT INTO custom_trees (id, user_id, title, goal_formula, category, description, tree_data, is_public, share_slug, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = $3,
           goal_formula = $4,
           category = $5,
           description = $6,
           tree_data = $7,
           is_public = $8,
           updated_at = $10`,
        [id, userId, customTree.title, customTree.goal_formula, customTree.category, customTree.description, JSON.stringify(treeData), isPublic, shareSlug, now]
      );
    } else {
      inMemoryStore.customTrees.set(id, customTree);
    }
    return customTree;
  },

  async getSharedTree(shareSlug: string): Promise<DbCustomTree | null> {
    if (isConnected && pool) {
      const res = await pool.query(`SELECT * FROM custom_trees WHERE share_slug = $1`, [shareSlug]);
      return res.rows[0] || null;
    }
    for (const t of inMemoryStore.customTrees.values()) {
      if (t.share_slug === shareSlug) return t;
    }
    return null;
  },

  // Cognitive Gaps
  async recordCognitiveGap(
    userId: string,
    rootNodeId: string,
    targetNodeId: string,
    gapConcept: string,
    rootCause: string
  ): Promise<any> {
    const id = crypto.randomUUID();
    const now = new Date();
    const gap = { id, user_id: userId, root_node_id: rootNodeId, target_node_id: targetNodeId, gap_concept: gapConcept, root_cause: rootCause, is_resolved: false, created_at: now };

    if (isConnected && pool) {
      const res = await pool.query(
        `INSERT INTO cognitive_gaps (id, user_id, root_node_id, target_node_id, gap_concept, root_cause, is_resolved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7) RETURNING *`,
        [id, userId, rootNodeId, targetNodeId, gapConcept, rootCause, now]
      );
      return res.rows[0];
    }
    inMemoryStore.cognitiveGaps.set(id, gap);
    return gap;
  },

  async getUserGaps(userId: string): Promise<any[]> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM cognitive_gaps WHERE user_id = $1 AND is_resolved = false ORDER BY created_at DESC`,
        [userId]
      );
      return res.rows;
    }
    const gaps: any[] = [];
    for (const g of inMemoryStore.cognitiveGaps.values()) {
      if (g.user_id === userId && !g.is_resolved) gaps.push(g);
    }
    return gaps;
  },

  // Canvas Layouts
  async saveCanvasLayout(userId: string, treeId: string, positions: any): Promise<void> {
    const now = new Date();
    if (isConnected && pool) {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO canvas_layouts (id, user_id, tree_id, positions, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, tree_id) DO UPDATE SET
           positions = $4,
           updated_at = $5`,
        [id, userId, treeId, JSON.stringify(positions), now]
      );
    } else {
      inMemoryStore.canvasLayouts.set(`${userId}:${treeId}`, positions);
    }
  },

  async getCanvasLayout(userId: string, treeId: string): Promise<any | null> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT positions FROM canvas_layouts WHERE user_id = $1 AND tree_id = $2`,
        [userId, treeId]
      );
      return res.rows[0]?.positions || null;
    }
    return inMemoryStore.canvasLayouts.get(`${userId}:${treeId}`) || null;
  },
};

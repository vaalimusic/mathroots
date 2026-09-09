import { Pool, QueryResult } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

export interface DbAiConfig {
  id: string;
  provider: 'openrouter' | 'deepseek' | 'yandex' | 'gemini' | 'openai';
  model: string;
  api_key: string | null;
  base_url: string | null;
  folder_id: string | null;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DbAiCache {
  id: string;
  cache_key: string;
  prompt_type: string;
  provider: string;
  model: string;
  input_summary: string;
  response_json: any;
  hit_count: number;
  saved_tokens_estimate: number;
  created_at: Date;
  last_accessed_at: Date;
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

export interface DbLicenseKey {
  id: string;
  key_code: string;
  plan: 'pro_month' | 'pro_year' | 'pro_lifetime' | 'tutor_school';
  status: 'active' | 'revoked' | 'expired';
  max_activations: number;
  activations_count: number;
  activated_by: Array<{ userId?: string; activatedAt: string; ip?: string }>;
  expires_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
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
  aiConfigs: new Map<string, DbAiConfig>(),
  aiResponseCache: new Map<string, DbAiCache>(),
  licenseKeys: new Map<string, DbLicenseKey>(),
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

      CREATE TABLE IF NOT EXISTS ai_provider_configs (
        id VARCHAR(64) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        api_key TEXT,
        base_url TEXT,
        folder_id TEXT,
        temperature REAL DEFAULT 0.7,
        max_tokens INT DEFAULT 4000,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_response_cache (
        id VARCHAR(64) PRIMARY KEY,
        cache_key VARCHAR(128) UNIQUE NOT NULL,
        prompt_type VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        input_summary TEXT,
        response_json JSONB NOT NULL,
        hit_count INT DEFAULT 1,
        saved_tokens_estimate INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS license_keys (
        id VARCHAR(64) PRIMARY KEY,
        key_code VARCHAR(100) UNIQUE NOT NULL,
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        max_activations INT DEFAULT 1,
        activations_count INT DEFAULT 0,
        activated_by JSONB DEFAULT '[]'::jsonb,
        expires_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_node_masteries_user ON node_masteries(user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_trees_user ON custom_trees(user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_trees_slug ON custom_trees(share_slug);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_response_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_response_cache(prompt_type);
      CREATE INDEX IF NOT EXISTS idx_license_keys_code ON license_keys(key_code);
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
    const term = email.toLowerCase().trim();
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM users WHERE LOWER(email) = $1 OR (LOWER(display_name) = $1 AND role = 'admin') OR ($1 = 'admin' AND email = 'admin@mathroots.local')`,
        [term]
      );
      return res.rows[0] || null;
    }
    for (const u of inMemoryStore.users.values()) {
      if (
        u.email?.toLowerCase() === term ||
        (u.display_name?.toLowerCase() === term && u.role === 'admin') ||
        (term === 'admin' && u.email?.toLowerCase() === 'admin@mathroots.local')
      ) {
        return u;
      }
    }
    return null;
  },

  async isSetupRequired(): Promise<boolean> {
    if (isConnected && pool) {
      try {
        const res = await pool.query(
          `SELECT id FROM users WHERE role = 'admin' AND password_hash IS NOT NULL AND password_hash != '' LIMIT 1`
        );
        return res.rows.length === 0;
      } catch (err) {
        console.warn('[DB] Error checking setup requirement:', err);
      }
    }
    for (const u of inMemoryStore.users.values()) {
      if (u.role === 'admin' && u.password_hash) {
        return false;
      }
    }
    return true;
  },

  async setupAdmin(login = 'admin', plainPassword: string): Promise<DbUser> {
    const adminEmail = login.includes('@') ? login.toLowerCase() : `${login.toLowerCase()}@mathroots.local`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const now = new Date();

    if (isConnected && pool) {
      const checkRes = await pool.query(
        `SELECT * FROM users WHERE role = 'admin' OR email = $1 OR display_name = $2 LIMIT 1`,
        [adminEmail, login]
      );

      if (checkRes.rows.length > 0) {
        const existing = checkRes.rows[0];
        await pool.query(
          `UPDATE users SET email = $1, display_name = $2, password_hash = $3, role = 'admin', is_anonymous = false, updated_at = $4 WHERE id = $5`,
          [adminEmail, login, passwordHash, now, existing.id]
        );
        existing.email = adminEmail;
        existing.display_name = login;
        existing.password_hash = passwordHash;
        existing.role = 'admin';
        console.log(`[DB] Master Admin account configured (login: ${login})`);
        return existing;
      } else {
        const id = 'admin-user-root';
        const user: DbUser = {
          id,
          email: adminEmail,
          password_hash: passwordHash,
          display_name: login,
          role: 'admin',
          is_anonymous: false,
          created_at: now,
          updated_at: now,
        };
        await pool.query(
          `INSERT INTO users (id, email, password_hash, display_name, role, is_anonymous, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET email = $2, display_name = $4, password_hash = $3, role = 'admin'`,
          [user.id, user.email, user.password_hash, user.display_name, user.role, user.is_anonymous, now, now]
        );
        console.log(`[DB] Master Admin account created (login: ${login})`);
        return user;
      }
    }

    // In-Memory store
    for (const u of inMemoryStore.users.values()) {
      if (u.role === 'admin' || u.email?.toLowerCase() === adminEmail) {
        u.email = adminEmail;
        u.display_name = login;
        u.password_hash = passwordHash;
        u.role = 'admin';
        console.log(`[DB] Master Admin account configured in memory (login: ${login})`);
        return u;
      }
    }

    const adminUser: DbUser = {
      id: 'admin-user-root',
      email: adminEmail,
      password_hash: passwordHash,
      display_name: login,
      role: 'admin',
      is_anonymous: false,
      created_at: now,
      updated_at: now,
    };
    inMemoryStore.users.set(adminUser.id, adminUser);
    console.log(`[DB] Master Admin account created in memory (login: ${login})`);
    return adminUser;
  },

  async ensureAdminUser(login = 'admin', plainPassword?: string): Promise<DbUser | null> {
    if (plainPassword) {
      return await this.setupAdmin(login, plainPassword);
    }

    // Verify if an existing admin exists
    const adminEmail = login.includes('@') ? login.toLowerCase() : `${login.toLowerCase()}@mathroots.local`;
    if (isConnected && pool) {
      const checkRes = await pool.query(
        `SELECT * FROM users WHERE role = 'admin' OR email = $1 LIMIT 1`,
        [adminEmail]
      );
      if (checkRes.rows.length > 0) {
        return checkRes.rows[0];
      }
    } else {
      for (const u of inMemoryStore.users.values()) {
        if (u.role === 'admin') return u;
      }
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

  // -------------------------------------------------------------
  // AI Config Operations
  // -------------------------------------------------------------
  async getActiveAiConfig(): Promise<DbAiConfig | null> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM ai_provider_configs WHERE is_active = true ORDER BY updated_at DESC LIMIT 1`
      );
      return res.rows[0] || null;
    }
    for (const c of inMemoryStore.aiConfigs.values()) {
      if (c.is_active) return c;
    }
    return null;
  },

  async getAllAiConfigs(): Promise<DbAiConfig[]> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM ai_provider_configs ORDER BY is_active DESC, updated_at DESC`
      );
      return res.rows;
    }
    return Array.from(inMemoryStore.aiConfigs.values()).sort(
      (a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
    );
  },

  async saveAiConfig(config: Partial<DbAiConfig> & { provider: DbAiConfig['provider']; model: string }): Promise<DbAiConfig> {
    const id = config.id || `cfg-${config.provider}`;
    const now = new Date();
    const isAct = config.is_active ?? true;

    const fullConfig: DbAiConfig = {
      id,
      provider: config.provider,
      model: config.model,
      api_key: config.api_key ?? null,
      base_url: config.base_url ?? null,
      folder_id: config.folder_id ?? null,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 4000,
      is_active: isAct,
      created_at: now,
      updated_at: now,
    };

    if (isConnected && pool) {
      if (isAct) {
        await pool.query(`UPDATE ai_provider_configs SET is_active = false WHERE id != $1`, [id]);
      }
      await pool.query(
        `INSERT INTO ai_provider_configs (id, provider, model, api_key, base_url, folder_id, temperature, max_tokens, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
         ON CONFLICT (id) DO UPDATE SET
           provider = $2,
           model = $3,
           api_key = COALESCE($4, ai_provider_configs.api_key),
           base_url = $5,
           folder_id = $6,
           temperature = $7,
           max_tokens = $8,
           is_active = $9,
           updated_at = $10`,
        [id, fullConfig.provider, fullConfig.model, fullConfig.api_key, fullConfig.base_url, fullConfig.folder_id, fullConfig.temperature, fullConfig.max_tokens, fullConfig.is_active, now]
      );
    } else {
      if (isAct) {
        for (const c of inMemoryStore.aiConfigs.values()) {
          c.is_active = false;
        }
      }
      inMemoryStore.aiConfigs.set(id, fullConfig);
    }
    return fullConfig;
  },

  // -------------------------------------------------------------
  // AI Response Cache Operations
  // -------------------------------------------------------------
  async getCachedAiResponse(cacheKey: string): Promise<DbAiCache | null> {
    const now = new Date();
    if (isConnected && pool) {
      const res = await pool.query(
        `UPDATE ai_response_cache
         SET hit_count = hit_count + 1, last_accessed_at = $2
         WHERE cache_key = $1
         RETURNING *`,
        [cacheKey, now]
      );
      return res.rows[0] || null;
    }
    const cached = inMemoryStore.aiResponseCache.get(cacheKey);
    if (cached) {
      cached.hit_count++;
      cached.last_accessed_at = now;
      return cached;
    }
    return null;
  },

  async saveCachedAiResponse(item: {
    cacheKey: string;
    promptType: string;
    provider: string;
    model: string;
    inputSummary: string;
    responseJson: any;
    savedTokensEstimate?: number;
  }): Promise<DbAiCache> {
    const id = crypto.randomUUID();
    const now = new Date();
    const tokens = item.savedTokensEstimate || Math.round(JSON.stringify(item.responseJson).length / 3.5);

    const cacheEntry: DbAiCache = {
      id,
      cache_key: item.cacheKey,
      prompt_type: item.promptType,
      provider: item.provider,
      model: item.model,
      input_summary: item.inputSummary,
      response_json: item.responseJson,
      hit_count: 1,
      saved_tokens_estimate: tokens,
      created_at: now,
      last_accessed_at: now,
    };

    if (isConnected && pool) {
      await pool.query(
        `INSERT INTO ai_response_cache (id, cache_key, prompt_type, provider, model, input_summary, response_json, hit_count, saved_tokens_estimate, created_at, last_accessed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $9)
         ON CONFLICT (cache_key) DO UPDATE SET
           response_json = $7,
           saved_tokens_estimate = $8,
           last_accessed_at = $9`,
        [id, item.cacheKey, item.promptType, item.provider, item.model, item.inputSummary, JSON.stringify(item.responseJson), tokens, now]
      );
    } else {
      inMemoryStore.aiResponseCache.set(item.cacheKey, cacheEntry);
    }
    return cacheEntry;
  },

  async getAiCacheStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    totalTokensSaved: number;
    byPromptType: Record<string, number>;
  }> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT
           COUNT(*)::int as total_entries,
           COALESCE(SUM(hit_count), 0)::int as total_hits,
           COALESCE(SUM(saved_tokens_estimate * hit_count), 0)::int as total_tokens_saved
         FROM ai_response_cache`
      );
      const typesRes = await pool.query(
        `SELECT prompt_type, COUNT(*)::int as cnt FROM ai_response_cache GROUP BY prompt_type`
      );
      const byPromptType: Record<string, number> = {};
      for (const r of typesRes.rows) {
        byPromptType[r.prompt_type] = r.cnt;
      }
      return {
        totalEntries: res.rows[0]?.total_entries || 0,
        totalHits: res.rows[0]?.total_hits || 0,
        totalTokensSaved: res.rows[0]?.total_tokens_saved || 0,
        byPromptType,
      };
    }

    const items = Array.from(inMemoryStore.aiResponseCache.values());
    const totalEntries = items.length;
    const totalHits = items.reduce((acc, i) => acc + i.hit_count, 0);
    const totalTokensSaved = items.reduce((acc, i) => acc + (i.saved_tokens_estimate * i.hit_count), 0);
    const byPromptType: Record<string, number> = {};
    for (const i of items) {
      byPromptType[i.prompt_type] = (byPromptType[i.prompt_type] || 0) + 1;
    }

    return { totalEntries, totalHits, totalTokensSaved, byPromptType };
  },

  async getRecentCacheEntries(limit = 25): Promise<DbAiCache[]> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT id, cache_key, prompt_type, provider, model, input_summary, hit_count, saved_tokens_estimate, created_at, last_accessed_at
         FROM ai_response_cache ORDER BY last_accessed_at DESC LIMIT $1`,
        [limit]
      );
      return res.rows;
    }
    return Array.from(inMemoryStore.aiResponseCache.values())
      .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
      .slice(0, limit);
  },

  async clearAiCache(): Promise<void> {
    if (isConnected && pool) {
      await pool.query(`TRUNCATE TABLE ai_response_cache`);
    } else {
      inMemoryStore.aiResponseCache.clear();
    }
  },

  // -------------------------------------------------------------
  // License Keys & Monetization Operations
  // -------------------------------------------------------------
  async createLicenseKey(data: {
    keyCode: string;
    plan: 'pro_month' | 'pro_year' | 'pro_lifetime' | 'tutor_school';
    maxActivations?: number;
    expiresAt?: Date | null;
    notes?: string | null;
  }): Promise<DbLicenseKey> {
    const id = crypto.randomUUID();
    const now = new Date();
    const keyEntry: DbLicenseKey = {
      id,
      key_code: data.keyCode.trim().toUpperCase(),
      plan: data.plan,
      status: 'active',
      max_activations: data.maxActivations ?? 1,
      activations_count: 0,
      activated_by: [],
      expires_at: data.expiresAt ?? null,
      notes: data.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    if (isConnected && pool) {
      await pool.query(
        `INSERT INTO license_keys (id, key_code, plan, status, max_activations, activations_count, activated_by, expires_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          keyEntry.id,
          keyEntry.key_code,
          keyEntry.plan,
          keyEntry.status,
          keyEntry.max_activations,
          keyEntry.activations_count,
          JSON.stringify(keyEntry.activated_by),
          keyEntry.expires_at,
          keyEntry.notes,
          keyEntry.created_at,
          keyEntry.updated_at,
        ]
      );
    } else {
      inMemoryStore.licenseKeys.set(keyEntry.key_code, keyEntry);
    }
    return keyEntry;
  },

  async getLicenseKeyByCode(rawCode: string): Promise<DbLicenseKey | null> {
    const code = rawCode.trim().toUpperCase();
    if (isConnected && pool) {
      const res = await pool.query(`SELECT * FROM license_keys WHERE key_code = $1`, [code]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        activated_by: typeof row.activated_by === 'string' ? JSON.parse(row.activated_by) : row.activated_by || [],
      };
    }
    return inMemoryStore.licenseKeys.get(code) || null;
  },

  async listLicenseKeys(limit = 100): Promise<DbLicenseKey[]> {
    if (isConnected && pool) {
      const res = await pool.query(
        `SELECT * FROM license_keys ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return res.rows.map(row => ({
        ...row,
        activated_by: typeof row.activated_by === 'string' ? JSON.parse(row.activated_by) : row.activated_by || [],
      }));
    }
    return Array.from(inMemoryStore.licenseKeys.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  async updateLicenseKeyStatus(code: string, status: 'active' | 'revoked' | 'expired'): Promise<boolean> {
    const norm = code.trim().toUpperCase();
    const now = new Date();
    if (isConnected && pool) {
      const res = await pool.query(
        `UPDATE license_keys SET status = $1, updated_at = $2 WHERE key_code = $3`,
        [status, now, norm]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const item = inMemoryStore.licenseKeys.get(norm);
    if (!item) return false;
    item.status = status;
    item.updated_at = now;
    return true;
  },

  async deleteLicenseKey(code: string): Promise<boolean> {
    const norm = code.trim().toUpperCase();
    if (isConnected && pool) {
      const res = await pool.query(`DELETE FROM license_keys WHERE key_code = $1`, [norm]);
      return (res.rowCount ?? 0) > 0;
    }
    return inMemoryStore.licenseKeys.delete(norm);
  },

  async activateLicenseKey(
    rawCode: string,
    meta: { userId?: string; ip?: string } = {}
  ): Promise<{ success: boolean; error?: string; key?: DbLicenseKey }> {
    const norm = rawCode.trim().toUpperCase();
    const key = await this.getLicenseKeyByCode(norm);
    if (!key) {
      return { success: false, error: 'Лицензионный ключ не найден. Проверьте правильность ввода.' };
    }

    if (key.status !== 'active') {
      return {
        success: false,
        error: key.status === 'revoked' ? 'Этот лицензионный ключ был аннулирован администратором.' : 'Срок действия ключа истек.',
      };
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      await this.updateLicenseKeyStatus(norm, 'expired');
      return { success: false, error: 'Срок действия этой лицензии уже истек.' };
    }

    if (key.activations_count >= key.max_activations) {
      return {
        success: false,
        error: `Лимит активаций для этого ключа исчерпан (${key.activations_count}/${key.max_activations}).`,
      };
    }

    const now = new Date();
    key.activations_count += 1;
    const activationRecord = {
      userId: meta.userId,
      ip: meta.ip,
      activatedAt: now.toISOString(),
    };
    key.activated_by = Array.isArray(key.activated_by) ? [...key.activated_by, activationRecord] : [activationRecord];
    key.updated_at = now;

    if (isConnected && pool) {
      await pool.query(
        `UPDATE license_keys
         SET activations_count = $1, activated_by = $2, updated_at = $3
         WHERE key_code = $4`,
        [key.activations_count, JSON.stringify(key.activated_by), now, norm]
      );
    } else {
      inMemoryStore.licenseKeys.set(norm, key);
    }

    return { success: true, key };
  },

  async getLicenseStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    revokedKeys: number;
    totalActivations: number;
    byPlan: Record<string, number>;
  }> {
    const keys = await this.listLicenseKeys(1000);
    let activeKeys = 0;
    let revokedKeys = 0;
    let totalActivations = 0;
    const byPlan: Record<string, number> = {};

    for (const k of keys) {
      if (k.status === 'active') activeKeys++;
      if (k.status === 'revoked') revokedKeys++;
      totalActivations += k.activations_count;
      byPlan[k.plan] = (byPlan[k.plan] || 0) + 1;
    }

    return {
      totalKeys: keys.length,
      activeKeys,
      revokedKeys,
      totalActivations,
      byPlan,
    };
  },
};

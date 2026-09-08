/**
 * MathRoots Production API Client
 * Automatically manages guest tokens, offline localStorage synchronization,
 * and calls backend REST endpoints.
 */

const TOKEN_KEY = 'mathroots_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Session / Auth
  async initSession(): Promise<{ token: string; user: any } | null> {
    try {
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const profile = await apiRequest('/api/auth/me');
          if (profile?.user) return { token: existingToken, user: profile.user };
        } catch {
          // Token expired or invalid, fallback to new guest session
        }
      }

      const res = await apiRequest('/api/auth/guest', { method: 'POST' });
      if (res?.token) {
        setAuthToken(res.token);
        return { token: res.token, user: res.user };
      }
      return null;
    } catch (err) {
      console.warn('[API] Could not init session, working in local offline mode:', err);
      return null;
    }
  },

  async login(email: string, password: string) {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async register(email: string, password: string, displayName: string) {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res?.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  // Mastery
  async fetchMastery(): Promise<string[]> {
    try {
      const res = await apiRequest('/api/user/mastery');
      return res.nodeIds || [];
    } catch {
      return [];
    }
  },

  async saveMastery(nodeId: string, treeId: string, score = 1.0, isCorrect = true) {
    try {
      return await apiRequest('/api/user/mastery', {
        method: 'POST',
        body: JSON.stringify({ nodeId, treeId, score, isCorrect }),
      });
    } catch (err) {
      console.warn('[API] saveMastery offline fallback:', err);
      return null;
    }
  },

  // Workout attempt
  async recordWorkout(problemId: string, category: string, selectedOption: number, isCorrect: boolean, timeSpentSec = 0) {
    try {
      return await apiRequest('/api/user/workout', {
        method: 'POST',
        body: JSON.stringify({ problemId, category, selectedOption, isCorrect, timeSpentSec }),
      });
    } catch {
      return null;
    }
  },

  async fetchWorkoutStats(): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    totalTimeSec: number;
    byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
    recentAttempts: any[];
  } | null> {
    try {
      const res = await apiRequest('/api/user/workout-stats');
      return res.stats || null;
    } catch {
      return null;
    }
  },

  // Custom Trees
  async fetchCustomTrees(): Promise<any[]> {
    try {
      const res = await apiRequest('/api/trees/custom');
      return res.trees || [];
    } catch {
      return [];
    }
  },

  async saveCustomTree(tree: any, isPublic = false) {
    try {
      return await apiRequest('/api/trees/custom', {
        method: 'POST',
        body: JSON.stringify({ tree, isPublic }),
      });
    } catch {
      return null;
    }
  },

  async fetchSharedTree(shareSlug: string) {
    return await apiRequest(`/api/trees/shared/${shareSlug}`);
  },

  // Cognitive Gaps
  async recordCognitiveGap(rootNodeId: string, targetNodeId: string, gapConcept: string, rootCause: string) {
    try {
      return await apiRequest('/api/user/gaps', {
        method: 'POST',
        body: JSON.stringify({ rootNodeId, targetNodeId, gapConcept, rootCause }),
      });
    } catch {
      return null;
    }
  },

  async fetchCognitiveGaps() {
    try {
      const res = await apiRequest('/api/user/gaps');
      return res.gaps || [];
    } catch {
      return [];
    }
  },

  // Canvas Layout
  async fetchCanvasLayout(treeId: string) {
    try {
      const res = await apiRequest(`/api/canvas/layout/${treeId}`);
      return res.positions || null;
    } catch {
      return null;
    }
  },

  async saveCanvasLayout(treeId: string, positions: any) {
    try {
      return await apiRequest(`/api/canvas/layout/${treeId}`, {
        method: 'PUT',
        body: JSON.stringify({ positions }),
      });
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // Admin & AI Provider Settings
  // -------------------------------------------------------------
  async getAiConfigs(): Promise<{ active: any; all: any[] }> {
    return await apiRequest('/api/admin/ai/configs');
  },

  async saveAiConfig(config: any) {
    return await apiRequest('/api/admin/ai/configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async testAiConfig(config: any) {
    return await apiRequest('/api/admin/ai/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async testAiChat(messages: Array<{ role: string; content: string }>, config?: any) {
    return await apiRequest('/api/admin/ai/chat-test', {
      method: 'POST',
      body: JSON.stringify({ messages, config }),
    });
  },

  async getAiCacheStats() {
    return await apiRequest('/api/admin/cache/stats');
  },

  async clearAiCache() {
    return await apiRequest('/api/admin/cache', {
      method: 'DELETE',
    });
  },
};


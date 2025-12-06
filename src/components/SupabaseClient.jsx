const SUPABASE_URL = 'https://jwfawrdwlhixjjyxposq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZmF3cmR3bGhpeGpqeXhwb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTY4MDUsImV4cCI6MjA3OTk5MjgwNX0.2_bFNg5P616a33CNI_aEjgbKyZlQkmam2R4bOMh2Lck';

const getHeaders = (token = null) => {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  // Get token from storage if not provided
  if (!token) {
    const session = localStorage.getItem('sb-session');
    
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

class SupabaseQueryBuilder {
  constructor(table, method = 'GET') {
    this.table = table;
    this.method = method;
    this.queryParams = [];
    this.bodyData = null;
    this.headers = getHeaders();
    this._count = null;
  }

  select(columns = '*', { count } = {}) {
    this.method = 'GET';
    this.queryParams.push(`select=${columns}`);
    if (count) {
      this.queryParams.push('count=exact');
      this._count = count;
    }
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.bodyData = data;
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.queryParams.push(`${column}=eq.${value}`);
    return this;
  }

  neq(column, value) {
    this.queryParams.push(`${column}=neq.${value}`);
    return this;
  }

  gt(column, value) {
    this.queryParams.push(`${column}=gt.${value}`);
    return this;
  }

  gte(column, value) {
    this.queryParams.push(`${column}=gte.${value}`);
    return this;
  }

  lt(column, value) {
    this.queryParams.push(`${column}=lt.${value}`);
    return this;
  }

  lte(column, value) {
    this.queryParams.push(`${column}=lte.${value}`);
    return this;
  }

  in(column, values) {
    const valueString = Array.isArray(values) ? values.map(v => `"${v}"`).join(',') : values;
    this.queryParams.push(`${column}=in.(${valueString})`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.queryParams.push(`order=${column}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(count) {
    this.queryParams.push(`limit=${count}`);
    return this;
  }

  single() {
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    return this;
  }

  async then(resolve, reject) {
    try {
      const queryString = this.queryParams.join('&');
      const url = `${SUPABASE_URL}/rest/v1/${this.table}${queryString ? '?' + queryString : ''}`;
      
      const options = {
        method: this.method,
        headers: this.headers,
      };

      if (this.bodyData) {
        options.body = JSON.stringify(this.bodyData);
      }

      const response = await fetch(url, options);
      
      // Handle empty response for DELETE or void returns
      if (response.status === 204) {
        resolve({ data: null, error: null });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // If single() was used and no rows found, Supabase returns 406 but we might want to handle it gracefully
        if (this.headers['Accept'] === 'application/vnd.pgrst.object+json' && (response.status === 406 || data.code === 'PGRST116')) {
             resolve({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } });
             return;
        }
        resolve({ data: null, error: data });
        return;
      }

      resolve({ data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

export const supabase = {
  from: (table) => new SupabaseQueryBuilder(table),
  
  auth: {
    signUp: async ({ email, password, options }) => {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signInWithPassword: async ({ email, password }) => {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw data;
        localStorage.setItem('sb-session', JSON.stringify(data));
        return { data: { session: data, user: data.user }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      const session = JSON.parse(localStorage.getItem('sb-session'));
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: getHeaders(session.access_token),
        });
      }
      localStorage.removeItem('sb-session');
      return { error: null };
    },
    getSession: async () => {
      const session = localStorage.getItem('sb-session');
      return { data: { session: session ? JSON.parse(session) : null }, error: null };
    },
    getUser: async () => {
      const sessionStr = localStorage.getItem('sb-session');
      if (!sessionStr) return { data: { user: null }, error: null };
      
      const session = JSON.parse(sessionStr);
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: getHeaders(session.access_token),
        });
        const user = await response.json();
        if (!response.ok) throw user;
        return { data: { user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    getCurrentUserWithProfile: async () => {
      // Helper to get user + profile merged
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return {
          ...user,
          ...(profile || {}),
          user_metadata: {
             ...user.user_metadata,
             ...(profile || {})
          }
        };
      } catch (e) {
        console.error("Error getting current user with profile", e);
        return null;
      }
    }
  }
};
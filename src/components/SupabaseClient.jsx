const SUPABASE_URL = 'https://jwfawrdwlhixjjyxposq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZmF3cmR3bGhpeGpqeXhwb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTY4MDUsImV4cCI6MjA3OTk5MjgwNX0.2_bFNg5P616a33CNI_aEjgbKyZlQkmam2R4bOMh2Lck';

const getHeaders = (token = null) => {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const supabase = {
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
        // Save session
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
    getSession: () => {
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
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      // Fetch profile from user_profiles table
      try {
          const session = JSON.parse(localStorage.getItem('sb-session'));
          const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}&select=*`, {
             headers: { ...getHeaders(session.access_token), 'Accept': 'application/vnd.pgrst.object+json' }
          });
          
          let profile = {};
          if (response.ok) {
             const profiles = await response.json();
             if (profiles && profiles.length > 0) {
                profile = profiles[0];
             }
          }

          return {
            ...user,
            ...profile,
            id: user.id,
            email: user.email
          };
      } catch (e) {
          console.error("Error fetching profile", e);
          return user;
      }
    }
  },
  from: (table) => {
    const session = JSON.parse(localStorage.getItem('sb-session'));
    const token = session?.access_token;
    
    return {
      select: async (columns = '*', { count } = {}) => {
        let queryParams = `select=${columns}`;
        if (count) queryParams += '&count=exact';
        
        const chain = {
             eq: async (column, value) => {
                 const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}&${column}=eq.${value}`, {
                   headers: getHeaders(token)
                 });
                 const data = await response.json();
                 return { data, error: response.ok ? null : data };
             },
             in: async (column, values) => {
                 const valueString = values.map(v => `"${v}"`).join(',');
                 const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}&${column}=in.(${valueString})`, {
                   headers: getHeaders(token)
                 });
                 const data = await response.json();
                 return { data, error: response.ok ? null : data };
             },
             order: async (column, { ascending = true } = {}) => {
                 const orderParam = `${column}.${ascending ? 'asc' : 'desc'}`;
                 const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}&order=${orderParam}`, {
                   headers: getHeaders(token)
                 });
                 const data = await response.json();
                 return { data, error: response.ok ? null : data };
             },
             single: async () => {
                 const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}&limit=1`, {
                    headers: { ...getHeaders(token), 'Accept': 'application/vnd.pgrst.object+json' }
                 });
                 const data = await response.json();
                 return { data, error: response.ok ? null : data };
             },
             then: (resolve, reject) => {
                fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryParams}`, { headers: getHeaders(token) })
                  .then(r => r.json().then(d => resolve({ data: d, error: r.ok ? null : d })))
                  .catch(e => reject(e));
             }
        };
        return chain;
      },
      insert: async (data) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        const resData = await response.json();
        return { data: resData, error: response.ok ? null : resData };
      },
      update: async (data) => {
         return {
           eq: async (column, value) => {
             const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
               method: 'PATCH',
               headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
               body: JSON.stringify(data)
             });
             const resData = await response.json();
             return { data: resData, error: response.ok ? null : resData };
           },
           in: async (column, values) => {
             // Bulk update not directly supported in one go via simple REST this way for IN, 
             // but for now we only used it in loops. Implementing basic support just in case.
             // Actually standard PostgREST doesn't support IN for PATCH easily without custom stored proc or individual calls.
             // We will fallback to individual calls in the app logic if needed, but let's provide a dummy response or error.
             return { error: "Bulk update via IN not supported in this lightweight client" };
           }
         }
      },
      delete: async () => {
        return {
           eq: async (column, value) => {
             const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
               method: 'DELETE',
               headers: getHeaders(token)
             });
             return { error: response.ok ? null : await response.json() };
           }
        }
      }
    };
  }
};
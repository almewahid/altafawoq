const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ exists' : '❌ missing');
  throw new Error('Supabase configuration is missing. Please check your .env.local file');
}

console.log('✅ Supabase client initialized successfully');

const getHeaders = (token = null) => {
  const headers = {
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'x-application-name': 'altafawoq'
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
        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return { data, error: null };
      } catch (error) {
        console.error('❌ Sign up error:', error);
        return { data: null, error };
      }
    },
    
    signInWithPassword: async ({ email, password }) => {
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw data;
        
        localStorage.setItem('sb-auth-token', JSON.stringify(data));
        console.log('✅ User signed in successfully');
        
        return { data: { session: data, user: data.user }, error: null };
      } catch (error) {
        console.error('❌ Sign in error:', error);
        return { data: null, error };
      }
    },

    signInWithOAuth: async ({ provider, options = {} }) => {
      try {
        const redirectTo = options.redirectTo || window.location.origin;
        const params = new URLSearchParams({
          provider: provider,
          redirect_to: redirectTo,
        });

        if (options.queryParams) {
          Object.entries(options.queryParams).forEach(([key, value]) => {
            params.append(key, value);
          });
        }

        if (options.scopes) {
          params.append('scopes', options.scopes);
        }

        const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
        console.log('✅ Redirecting to OAuth provider:', provider);
        window.location.href = oauthUrl;
        return { data: { url: oauthUrl, provider }, error: null };
      } catch (error) {
        console.error('❌ OAuth error:', error);
        return { data: null, error };
      }
    },
    
    signOut: async () => {
      const session = JSON.parse(localStorage.getItem('sb-auth-token') || 'null');
      if (session?.access_token) {
        try {
          await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: getHeaders(session.access_token),
          });
          console.log('✅ User signed out successfully');
        } catch (error) {
          console.error('⚠️ Sign out error:', error);
        }
      }
      localStorage.removeItem('sb-auth-token');
      return { error: null };
    },
    
    getSession: () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken) {
        const oauthSession = {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: hashParams.get('token_type') || 'bearer',
          expires_in: parseInt(hashParams.get('expires_in') || '3600'),
        };
        
        localStorage.setItem('sb-auth-token', JSON.stringify(oauthSession));
        window.history.replaceState({}, document.title, window.location.pathname);
        return { data: { session: oauthSession }, error: null };
      }
      
      const session = localStorage.getItem('sb-auth-token');
      return { data: { session: session ? JSON.parse(session) : null }, error: null };
    },
    
    getUser: async () => {
      const sessionStr = localStorage.getItem('sb-auth-token');
      if (!sessionStr) return { data: { user: null }, error: null };
      
      const session = JSON.parse(sessionStr);
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: getHeaders(session.access_token),
        });
        const user = await response.json();
        if (!response.ok) throw user;
        return { data: { user }, error: null };
      } catch (error) {
        console.error('❌ Get user error:', error);
        return { data: { user: null }, error };
      }
    },
    
    getCurrentUserWithProfile: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      try {
        const session = JSON.parse(localStorage.getItem('sb-auth-token') || 'null');
        if (!session) return user;
        
        const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
          headers: { ...getHeaders(session.access_token), 'Accept': 'application/vnd.pgrst.object+json' }
        });
        
        if (response.ok) {
          const profile = await response.json();
          console.log('✅ User profile loaded');
          return { ...user, ...profile, id: user.id, email: user.email };
        }
        
        return user;
      } catch (e) {
        console.error('⚠️ Error fetching profile:', e);
        return user;
      }
    },

    onAuthStateChange: (callback) => {
      const checkAuth = async () => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          const { data: { user } } = await supabase.auth.getUser();
          callback('SIGNED_IN', user ? { user } : null);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
        }
      };
      
      checkAuth();
      
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log('Auth listener unsubscribed')
          }
        }
      };
    }
  },
  
  from: (table) => {
    const getToken = () => {
      const session = JSON.parse(localStorage.getItem('sb-auth-token') || 'null');
      return session?.access_token;
    };
    
    return {
      select: (columns = '*', options = {}) => {
        let queryParams = `select=${columns}`;
        if (options.count) queryParams += '&count=exact';
        
        const chain = {
          eq: async (column, value) => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&${column}=eq.${value}`, {
              headers: getHeaders(getToken())
            });
            const data = await response.json();
            return { data: response.ok ? data : [], error: response.ok ? null : data };
          },
          
          in: async (column, values) => {
            const valueString = values.map(v => `"${v}"`).join(',');
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&${column}=in.(${valueString})`, {
              headers: getHeaders(getToken())
            });
            const data = await response.json();
            return { data: response.ok ? data : [], error: response.ok ? null : data };
          },
          
          order: (column, options = {}) => ({
            ...chain,
            then: async (resolve) => {
              const ascending = options.ascending !== false;
              const orderParam = `${column}.${ascending ? 'asc' : 'desc'}`;
              const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&order=${orderParam}`, {
                headers: getHeaders(getToken())
              });
              const data = await response.json();
              resolve({ data: response.ok ? data : [], error: response.ok ? null : data });
            }
          }),
          
          limit: (count) => ({
            ...chain,
            then: async (resolve) => {
              const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&limit=${count}`, {
                headers: getHeaders(getToken())
              });
              const data = await response.json();
              resolve({ data: response.ok ? data : [], error: response.ok ? null : data });
            }
          }),
          
          single: async () => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&limit=1`, {
              headers: { ...getHeaders(getToken()), 'Accept': 'application/vnd.pgrst.object+json' }
            });
            const data = await response.json();
            return { data: response.ok ? data : null, error: response.ok ? null : data };
          },
          
          maybeSingle: async () => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}&limit=1`, {
              headers: { ...getHeaders(getToken()), 'Accept': 'application/vnd.pgrst.object+json' }
            });
            
            if (response.status === 404) {
              return { data: null, error: null };
            }
            
            const data = await response.json();
            return { data: response.ok ? data : null, error: response.ok ? null : data };
          },
          
          then: (resolve) => {
            fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}`, { 
              headers: getHeaders(getToken()) 
            })
              .then(r => r.json().then(d => resolve({ data: r.ok ? d : [], error: r.ok ? null : d })))
              .catch(e => resolve({ data: [], error: e }));
          }
        };
        
        return chain;
      },
      
      insert: async (data) => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...getHeaders(getToken()), 'Prefer': 'return=representation' },
          body: JSON.stringify(Array.isArray(data) ? data : [data])
        });
        const resData = await response.json();
        
        if (response.ok) {
          console.log(`✅ Inserted into ${table}`);
        } else {
          console.error(`❌ Insert error in ${table}:`, resData);
        }
        
        return { data: response.ok ? resData : null, error: response.ok ? null : resData };
      },
      
      update: (data) => ({
        eq: async (column, value) => {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: { ...getHeaders(getToken()), 'Prefer': 'return=representation' },
            body: JSON.stringify(data)
          });
          const resData = await response.json();
          
          if (response.ok) {
            console.log(`✅ Updated ${table}`);
          } else {
            console.error(`❌ Update error in ${table}:`, resData);
          }
          
          return { data: response.ok ? resData : null, error: response.ok ? null : resData };
        }
      }),
      
      delete: () => ({
        eq: async (column, value) => {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
            headers: getHeaders(getToken())
          });
          const resData = response.ok ? null : await response.json();
          
          if (response.ok) {
            console.log(`✅ Deleted from ${table}`);
          } else {
            console.error(`❌ Delete error in ${table}:`, resData);
          }
          
          return { error: resData };
        }
      })
    };
  },
  
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        const session = JSON.parse(localStorage.getItem('sb-auth-token') || 'null');
        const token = session?.access_token;
        
        try {
          const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` },
            body: file
          });
          
          const data = await response.json();
          if (!response.ok) throw data;
          
          console.log(`✅ File uploaded to ${bucket}/${path}`);
          
          return { 
            data: { 
              path: data.Key || path,
              fullPath: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
            }, 
            error: null 
          };
        } catch (error) {
          console.error('❌ Upload error:', error);
          return { data: null, error };
        }
      },
      
      getPublicUrl: (path) => ({
        data: {
          publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
        }
      })
    })
  }
};

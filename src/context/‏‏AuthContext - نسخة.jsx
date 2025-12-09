import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/components/SupabaseClient";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setCurrentUser(null);
        setUserType(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
    } catch (error) {
      console.error("خطأ في فحص المستخدم:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (user) => {
    try {
      setCurrentUser(user);
      
      // جلب نوع المستخدم من جدول user_profiles
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .limit(1)
.maybeSingle();
      
      if (error) {
        console.error("خطأ في جلب بيانات المستخدم:", error);
        setUserType("student"); // افتراضي
      } else {
        setUserType(profile?.user_type || "student");
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات المستخدم:", error);
      setUserType("student");
    }
  };

  const value = {
    currentUser,
    userType,
    loading,
    refreshUser: checkUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
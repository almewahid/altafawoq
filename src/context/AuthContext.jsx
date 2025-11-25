import { createContext, useContext, useState, useEffect } from "react";
import { onAuthChanged } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // جلب نوع المستخدم من Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.userType || "student"); // افتراضي: طالب
          } else {
            setUserType("student"); // افتراضي إذا لم يوجد المستند
          }
        } catch (error) {
          console.error("خطأ في جلب بيانات المستخدم:", error);
          setUserType("student");
        }
      } else {
        setUserType(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userType,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
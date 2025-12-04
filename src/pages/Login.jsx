import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInEmail(email, password);
      navigate("/");
    } catch (err) {
      setError("فشل تسجيل الدخول: " + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      setError("فشل تسجيل الدخول بجوجل: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>تسجيل الدخول</h2>
      {error && <p style={{ color: "red", backgroundColor: "#fee", padding: "10px", borderRadius: "5px" }}>{error}</p>}
      
      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "10px 0", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "10px 0", border: "1px solid #ddd", borderRadius: "5px" }}
          required
        />
        <button 
          type="submit" 
          style={{ 
            width: "100%", 
            padding: "12px", 
            backgroundColor: "#22c55e", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          دخول
        </button>
      </form>
      
      <div style={{ margin: "15px 0", textAlign: "center", color: "#999" }}>أو</div>
      
      <button
        onClick={handleGoogleLogin}
        style={{ 
          width: "100%", 
          padding: "12px", 
          backgroundColor: "#fff", 
          color: "#333",
          border: "1px solid #ddd",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        دخول بجوجل
      </button>
      
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        ليس لديك حساب؟ <a href="/register" style={{ color: "#22c55e", textDecoration: "none" }}>سجل الآن</a>
      </p>
    </div>
  );
}
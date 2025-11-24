import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInEmail, signInWithGoogle } from "../firebase";

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
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2>تسجيل الدخول</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          required
        />
        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          دخول
        </button>
      </form>

      <button
        onClick={handleGoogleLogin}
        style={{ width: "100%", padding: "10px", marginTop: "10px" }}
      >
        دخول بجوجل
      </button>

      <p style={{ marginTop: "20px" }}>
        ليس لديك حساب؟ <a href="/register">سجل الآن</a>
      </p>
    </div>
  );
}

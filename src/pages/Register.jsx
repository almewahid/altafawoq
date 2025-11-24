import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpEmail, signInWithGoogle, ensureUserDoc } from "../firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const result = await signUpEmail(email, password);
      await ensureUserDoc(result.user);
      navigate("/");
    } catch (err) {
      setError("فشل التسجيل: " + err.message);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithGoogle();
      await ensureUserDoc(result.user);
      navigate("/");
    } catch (err) {
      setError("فشل التسجيل بجوجل: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2>إنشاء حساب جديد</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleRegister}>
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
          تسجيل
        </button>
      </form>

      <button
        onClick={handleGoogleRegister}
        style={{ width: "100%", padding: "10px", marginTop: "10px" }}
      >
        تسجيل بجوجل
      </button>

      <p style={{ marginTop: "20px" }}>
        لديك حساب؟ <a href="/login">سجل الدخول</a>
      </p>
    </div>
  );
}

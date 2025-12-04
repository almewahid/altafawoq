import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/SupabaseClient";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

export default function UserLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: 'user'
            }
          }
        });
        if (error) throw error;
        
        if (data?.user) {
          // Create user profile manually since we don't have triggers set up yet
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: 'user'
          });
          alert("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.");
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        
        navigate(createPageUrl("Home"));
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </CardTitle>
          <p className="text-gray-500 text-sm">
            منصة التفوق التعليمية (Supabase)
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم الكامل</label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="الاسم الكامل"
                  className="text-right"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@email.com"
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="********"
                className="text-left"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "إنشاء حساب" : "دخول")}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              {isSignUp ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-600 font-bold hover:underline"
              >
                {isSignUp ? "سجل دخولك" : "أنشئ حساباً جديداً"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
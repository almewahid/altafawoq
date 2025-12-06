import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ user_type: role })
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ Update error:', error);
          alert('حدث خطأ في الحفظ');
          setLoading(false);
          return;
        }
        
        console.log('✅ User type updated to:', role);
        
        // إعادة تحميل الصفحة لتحديث AuthContext
        window.location.href = '/home';
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('حدث خطأ');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إكمال الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>نوع الحساب</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحساب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="center">مركز تعليمي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-green-600" 
              disabled={!role || loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
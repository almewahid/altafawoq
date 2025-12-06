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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      await supabase.from('user_profiles').update({ user_type: role }).eq('id', user.data.user.id);
      navigate(createPageUrl("Home"));
      window.location.reload();
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
            <Button type="submit" className="w-full bg-green-600" disabled={!role}>
              حفظ ومتابعة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
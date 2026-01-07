import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function StudentSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: settings } = useQuery({
    queryKey: ['studentSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from('student_settings').select('*').eq('student_email', user.email).maybeSingle();
      return data || {
        student_email: user.email,
        theme: 'light',
        notifications_enabled: true,
        email_notifications: true,
        language: 'ar',
        interests: []
      };
    },
    enabled: !!user?.email
  });

  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newData) => {
      const { data, error } = await supabase.from('student_settings').upsert(newData).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studentSettings']);
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: (err) => {
      toast.error("فشل حفظ الإعدادات: " + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (!formData) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="w-4 h-4 ml-2" />
          عودة
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">إعدادات الطالب</h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>التفضيلات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-gray-500">استلام إشعارات عن الواجبات والجلسات</p>
                  </div>
                  <Switch
                    checked={formData.notifications_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, notifications_enabled: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-gray-500">استلام ملخصات أسبوعية وتنبيهات مهمة</p>
                  </div>
                  <Switch
                    checked={formData.email_notifications}
                    onCheckedChange={(checked) => setFormData({...formData, email_notifications: checked})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>السمة (Theme)</Label>
                <Select value={formData.theme} onValueChange={(val) => setFormData({...formData, theme: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="system">نظام الجهاز</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اللغة المفضلة</Label>
                <Select value={formData.language} onValueChange={(val) => setFormData({...formData, language: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الاهتمامات الأكاديمية</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغات', 'البرمجة', 'الفنون'].map((interest) => (
                    <div 
                      key={interest}
                      onClick={() => {
                        const newInterests = formData.interests?.includes(interest)
                          ? formData.interests.filter(i => i !== interest)
                          : [...(formData.interests || []), interest];
                        setFormData({...formData, interests: newInterests});
                      }}
                      className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors border ${
                        formData.interests?.includes(interest)
                          ? 'bg-blue-100 border-blue-200 text-blue-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {interest}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
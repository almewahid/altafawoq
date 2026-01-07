import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateStudyGroup() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [schedule, setSchedule] = React.useState([{ day: "الأحد", time: "16:00" }]);
  const [formData, setFormData] = React.useState({
    name: "",
    subject: "",
    stage: "",
    price_per_session: "",
    description: "",
    max_students: "10"
  });

  const handleAddSchedule = () => {
    setSchedule([...schedule, { day: "الأحد", time: "16:00" }]);
  };

  const handleRemoveSchedule = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await supabase.auth.getCurrentUserWithProfile();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      const { error } = await supabase.from('study_groups').insert({
        teacher_email: user.email,
        name: formData.name,
        subject: formData.subject,
        stage: formData.stage,
        price_per_session: Number(formData.price_per_session),
        description: formData.description,
        max_students: Number(formData.max_students),
        schedule: schedule,
        status: 'active',
        students: []
      });

      if (error) throw error;

      toast.success("تم إنشاء المجموعة بنجاح");
      navigate(-1);
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء المجموعة: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowRight className="w-4 h-4 ml-2" />
        عودة
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>إنشاء مجموعة دراسية جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المجموعة</Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: مراجعة فيزياء نهائي"
                />
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Input 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="مثال: فيزياء"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المرحلة الدراسية</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({...formData, stage: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">الابتدائية</SelectItem>
                    <SelectItem value="middle">المتوسطة</SelectItem>
                    <SelectItem value="high">الثانوية</SelectItem>
                    <SelectItem value="university">الجامعية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سعر الحصة (د.ك)</Label>
                <Input 
                  type="number"
                  required
                  value={formData.price_per_session}
                  onChange={(e) => setFormData({...formData, price_per_session: e.target.value})}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="وصف تفصيلي للمجموعة وما سيتم شرحه..."
              />
            </div>

            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <Label className="text-base">المواعيد الأسبوعية</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSchedule}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة موعد
                </Button>
              </div>
              {schedule.map((slot, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>اليوم</Label>
                    <Select value={slot.day} onValueChange={(v) => handleScheduleChange(index, 'day', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الأحد">الأحد</SelectItem>
                        <SelectItem value="الإثنين">الإثنين</SelectItem>
                        <SelectItem value="الثلاثاء">الثلاثاء</SelectItem>
                        <SelectItem value="الأربعاء">الأربعاء</SelectItem>
                        <SelectItem value="الخميس">الخميس</SelectItem>
                        <SelectItem value="الجمعة">الجمعة</SelectItem>
                        <SelectItem value="السبت">السبت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>الوقت</Label>
                    <Input 
                      type="time"
                      value={slot.time}
                      onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                    />
                  </div>
                  {schedule.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveSchedule(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء المجموعة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
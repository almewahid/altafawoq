import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, Target, Trophy, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentGoals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "academic",
    target_date: "",
    progress_percentage: 0
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['personalGoals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('student_email', user.email)
        .order('created_date', { ascending: false });
      return data || [];
    },
    enabled: !!user?.email
  });

  const createGoalMutation = useMutation({
    mutationFn: async (newGoal) => {
      const { error } = await supabase.from('personal_goals').insert({
        ...newGoal,
        student_email: user.email,
        status: 'active'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "academic",
        target_date: "",
        progress_percentage: 0
      });
      toast.success("تم إضافة الهدف بنجاح");
    },
    onError: (err) => toast.error("حدث خطأ: " + err.message)
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }) => {
      const status = progress >= 100 ? 'completed' : 'active';
      const { error } = await supabase.from('personal_goals').update({ progress_percentage: progress, status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
      toast.success("تم تحديث التقدم");
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('personal_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personalGoals']);
      toast.success("تم حذف الهدف");
    }
  });

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'academic': return 'bg-blue-100 text-blue-700';
      case 'skill': return 'bg-purple-100 text-purple-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const getCategoryName = (cat) => {
    switch(cat) {
      case 'academic': return 'أكاديمي';
      case 'skill': return 'مهارة';
      default: return 'شخصي';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowRight className="w-4 h-4 ml-2" />
              عودة
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-8 h-8 text-green-600" />
                أهدافي الدراسية
              </h1>
              <p className="text-gray-500">تتبع تقدمك وحقق طموحاتك</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
                هدف جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة هدف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>عنوان الهدف</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="مثال: إتقان قواعد اللغة الإنجليزية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">أكاديمي</SelectItem>
                      <SelectItem value="skill">مهارة</SelectItem>
                      <SelectItem value="personal">شخصي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ التحقيق المستهدف</Label>
                  <Input 
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={() => createGoalMutation.mutate(formData)}
                  disabled={!formData.title || createGoalMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {createGoalMutation.isPending ? "جاري الحفظ..." : "حفظ الهدف"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <span className="text-2xl font-bold">{goals.filter(g => g.status === 'completed').length}</span>
              </div>
              <h3 className="font-bold text-lg">الأهداف المحققة</h3>
              <p className="text-blue-100 text-sm">أحسنت! استمر في التقدم</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <span className="text-2xl font-bold">{goals.filter(g => g.status === 'active').length}</span>
              </div>
              <h3 className="font-bold text-lg">الأهداف النشطة</h3>
              <p className="text-purple-100 text-sm">أهداف تعمل عليها حالياً</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <span className="text-2xl font-bold">
                  {goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progress_percentage || 0), 0) / goals.length) : 0}%
                </span>
              </div>
              <h3 className="font-bold text-lg">متوسط الإنجاز</h3>
              <p className="text-orange-100 text-sm">معدل تقدمك العام</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-12">جاري التحميل...</div>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Target className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900">ابدأ رحلتك</h3>
                <p className="text-gray-500 mt-2 mb-6">لم تقم بإضافة أي أهداف بعد. حدد هدفك الأول الآن!</p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600">
                  إضافة هدف جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
                            <Badge className={getCategoryColor(goal.category)} variant="secondary">
                              {getCategoryName(goal.category)}
                            </Badge>
                            {goal.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-700" variant="secondary">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                مكتمل
                              </Badge>
                            )}
                          </div>
                          {goal.description && <p className="text-gray-500 text-sm">{goal.description}</p>}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا الهدف؟")) deleteGoalMutation.mutate(goal.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>نسبة الإنجاز</span>
                          <span className="font-bold">{goal.progress_percentage}%</span>
                        </div>
                        <Progress value={goal.progress_percentage} className="h-3" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress_percentage || 0}
                          onChange={(e) => updateProgressMutation.mutate({
                            id: goal.id,
                            progress: parseInt(e.target.value)
                          })}
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-48 flex-shrink-0 flex flex-col justify-center gap-2 p-4 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ البدء:</span>
                        <span className="font-medium text-gray-900">
                          {format(new Date(goal.created_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      {goal.target_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>المستهدف:</span>
                          <span className="font-medium text-gray-900">
                            {format(new Date(goal.target_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
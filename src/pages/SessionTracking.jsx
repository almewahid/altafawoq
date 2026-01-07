import React, { useState } from "react";
import { supabase } from "@/components/SupabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle, Plus, Edit2, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

export default function SessionTracking() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: groups } = useQuery({
    queryKey: ['teacherGroups', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase.from('study_groups')
        .select('id, name')
        .eq('teacher_email', user.email);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['groupSessions', selectedGroup],
    queryFn: async () => {
      const { data, error } = await supabase.from('sessions')
        .select('*')
        .eq('group_id', selectedGroup)
        .order('scheduled_start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedGroup
  });

  const upsertSessionMutation = useMutation({
    mutationFn: async (formData) => {
      const { data, error } = await supabase.from('sessions').upsert({
        ...formData,
        teacher_email: user.email
      }).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupSessions', selectedGroup]);
      setIsDialogOpen(false);
      setEditingSession(null);
      toast.success("تم حفظ بيانات الحصة بنجاح");
    },
    onError: (err) => {
      toast.error("حدث خطأ: " + err.message);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-black hover:text-white shrink-0"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              عودة
            </Button>
            <div className="flex-1 md:flex-initial">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">تتبع الحصص</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">إدارة سجل الحصص وتحديث حالتها</p>
            </div>
          </div>
          
          <Select onValueChange={setSelectedGroup} value={selectedGroup || ""}>
            <SelectTrigger className="w-full md:w-[280px] bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600">
              <SelectValue placeholder="اختر المجموعة" />
            </SelectTrigger>
            <SelectContent>
              {groups?.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedGroup ? (
          <Card className="border-dashed border-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-none transition-colors duration-300">
            <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">يرجى اختيار مجموعة لعرض حصصها</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={() => { setEditingSession(null); setIsDialogOpen(true); }} className="bg-green-600 hover:bg-black text-white gap-2 transition-all">
                <Plus className="w-4 h-4" />
                إضافة حصة جديدة
              </Button>
            </div>

            <div className="grid gap-4">
              {isLoadingSessions ? (
                <div className="text-center py-8 text-gray-900 dark:text-white">جاري التحميل...</div>
              ) : sessions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد حصص مسجلة لهذه المجموعة</div>
              ) : (
                sessions.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onEdit={() => { setEditingSession(session); setIsDialogOpen(true); }} 
                  />
                ))
              )}
            </div>
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] dark:bg-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {editingSession ? "تعديل تفاصيل الحصة" : "جدولة حصة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <SessionForm 
              group={selectedGroup}
              session={editingSession} 
              onSubmit={(data) => upsertSessionMutation.mutate(data)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function SessionCard({ session, onEdit }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'postponed': return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      case 'postponed': return 'مؤجلة';
      default: return 'مجدولة';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl border-0 shadow-xl">
      <div className="flex flex-col md:flex-row border-r-4 border-r-transparent md:border-r-4" 
           style={{ borderRightColor: session.status === 'completed' ? '#10b981' : '#e5e7eb' }}>
        <div className="p-6 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-0 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">{session.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                <Calendar className="w-4 h-4" />
                {format(new Date(session.scheduled_start_time), 'EEEE d MMMM yyyy', { locale: ar })}
              </div>
            </div>
            <Badge variant="outline" className={`${getStatusColor(session.status)} border px-3 py-1 transition-colors duration-300`}>
              {getStatusLabel(session.status)}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 block text-xs transition-colors duration-300">الوقت المجدول</span>
              <div className="font-medium flex items-center gap-2 text-gray-900 dark:text-white transition-colors duration-300">
                <Clock className="w-4 h-4 text-gray-400" />
                {format(new Date(session.scheduled_start_time), 'hh:mm a')}
              </div>
            </div>
            
            {session.actual_start_time && (
              <div className="space-y-1">
                <span className="text-gray-500 dark:text-gray-400 block text-xs transition-colors duration-300">الوقت الفعلي</span>
                <div className="font-medium flex items-center gap-2 text-green-700 dark:text-green-400 transition-colors duration-300">
                  <CheckCircle className="w-4 h-4" />
                  {format(new Date(session.actual_start_time), 'hh:mm a')} - 
                  {session.actual_end_time ? format(new Date(session.actual_end_time), 'hh:mm a') : '...'}
                </div>
              </div>
            )}
          </div>

          {session.notes && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
              <span className="font-bold text-gray-700 dark:text-gray-200 ml-1">ملاحظات:</span>
              {session.notes}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-slate-700 p-4 flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-r dark:border-slate-600 transition-colors duration-300">
          <Button variant="ghost" size="sm" onClick={onEdit} className="w-full justify-start gap-2 hover:bg-black hover:text-white dark:text-white">
            <Edit2 className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SessionForm({ group, session, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(session || {
    group_id: group,
    title: "",
    scheduled_start_time: new Date().toISOString().slice(0, 16),
    status: "scheduled",
    notes: ""
  });

  const [completedDetails, setCompletedDetails] = useState({
    actual_start_time: session?.actual_start_time ? new Date(session.actual_start_time).toISOString().slice(0, 16) : "",
    actual_end_time: session?.actual_end_time ? new Date(session.actual_end_time).toISOString().slice(0, 16) : ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData, group_id: group };
    
    if (formData.status === 'completed') {
      if (!completedDetails.actual_start_time || !completedDetails.actual_end_time) {
        toast.error("يرجى تحديد وقت البدء والانتهاء الفعلي للحصة المكتملة");
        return;
      }
      dataToSubmit.actual_start_time = new Date(completedDetails.actual_start_time).toISOString();
      dataToSubmit.actual_end_time = new Date(completedDetails.actual_end_time).toISOString();
    }

    dataToSubmit.scheduled_start_time = new Date(formData.scheduled_start_time).toISOString();
    
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium dark:text-white">عنوان الحصة</label>
        <Input 
          required 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="مثال: مراجعة الفصل الأول"
          className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium dark:text-white">الموعد المجدول</label>
        <Input 
          type="datetime-local"
          required
          value={formData.scheduled_start_time}
          onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
          className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium dark:text-white">الحالة</label>
        <Select 
          value={formData.status} 
          onValueChange={(val) => setFormData({...formData, status: val})}
        >
          <SelectTrigger className="dark:bg-slate-700 dark:text-white dark:border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">مجدولة</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="postponed">مؤجلة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.status === 'completed' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-700">
          <div className="space-y-2">
            <label className="text-xs font-medium text-green-800 dark:text-green-300">وقت البدء الفعلي</label>
            <Input 
              type="datetime-local"
              value={completedDetails.actual_start_time}
              onChange={(e) => setCompletedDetails({...completedDetails, actual_start_time: e.target.value})}
              className="bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-green-800 dark:text-green-300">وقت الانتهاء الفعلي</label>
            <Input 
              type="datetime-local"
              value={completedDetails.actual_end_time}
              onChange={(e) => setCompletedDetails({...completedDetails, actual_end_time: e.target.value})}
              className="bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium dark:text-white">ملاحظات</label>
        <Textarea 
          value={formData.notes || ""}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="سجل أي ملاحظات حول الحصة، حضور الطلاب، أو ما تم إنجازه..."
          className="h-20 dark:bg-slate-700 dark:text-white dark:border-slate-600"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-black text-white transition-all">
          حفظ
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="hover:bg-black hover:text-white dark:border-slate-600 dark:text-white">
          إلغاء
        </Button>
      </div>
    </form>
  );
}
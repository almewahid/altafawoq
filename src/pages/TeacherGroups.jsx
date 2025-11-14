
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  Users, 
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  BookOpen,
  Bell,
  Video,
  Upload,
  FileText,
  Eye,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STAGES = ["روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي"];
const SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية", "تاريخ", "جغرافيا"];
const CURRICULUMS = ["سعودي", "إماراتي", "كويتي", "مصري", "أمريكي", "بريطاني", "IB"];
const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

export default function TeacherGroupsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  
  // Announcement Dialog
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    content: "",
    is_urgent: false
  });

  // Material Dialog
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialData, setMaterialData] = useState({
    title: "",
    description: "",
    type: "file",
    file_url: "",
    is_downloadable: true
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['teacherGroups', user?.email],
    queryFn: () => base44.entities.StudyGroup.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    stage: "",
    curriculum: "",
    price_per_session: 0,
    max_students: 10,
    description: "",
    image_url: "",
    schedule: [],
    status: "active"
  });

  React.useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name || "",
        subject: editingGroup.subject || "",
        stage: editingGroup.stage || "",
        curriculum: editingGroup.curriculum || "",
        price_per_session: editingGroup.price_per_session || 0,
        max_students: editingGroup.max_students || 10,
        description: editingGroup.description || "",
        image_url: editingGroup.image_url || "",
        schedule: editingGroup.schedule || [],
        status: editingGroup.status || "active"
      });
    }
  }, [editingGroup]);

  const createGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.StudyGroup.create({
      ...data,
      teacher_email: user?.email,
      students: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherGroups']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StudyGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherGroups']);
      setShowDialog(false);
      setEditingGroup(null);
      resetForm();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id) => base44.entities.StudyGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherGroups']);
    },
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      const announcement = await base44.entities.Announcement.create(data);
      
      // Send notifications to all students
      const group = groups.find(g => g.id === selectedGroup?.id);
      if (group?.students) {
        await Promise.all(
          group.students.map(studentEmail =>
            base44.entities.Notification.create({
              user_email: studentEmail,
              title: data.title,
              message: data.content,
              type: "announcement",
              priority: data.is_urgent ? "urgent" : "normal",
              link: createPageUrl("GroupDetails") + `?id=${selectedGroup?.id}`
            })
          )
        );
      }
      
      return announcement;
    },
    onSuccess: () => {
      setShowAnnouncementDialog(false);
      setAnnouncementData({ title: "", content: "", is_urgent: false });
      setSelectedGroup(null);
      alert("تم إرسال الإعلان بنجاح!");
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data) => base44.entities.StudyMaterial.create({
      ...data,
      teacher_email: user?.email,
      group_id: selectedGroup?.id
    }),
    onSuccess: () => {
      setShowMaterialDialog(false);
      setMaterialData({
        title: "",
        description: "",
        type: "file",
        file_url: "",
        is_downloadable: true
      });
      setSelectedGroup(null);
      alert("تمت إضافة المادة بنجاح!");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      stage: "",
      curriculum: "",
      price_per_session: 0,
      max_students: 10,
      description: "",
      image_url: "",
      schedule: [],
      status: "active"
    });
    setScheduleDay("");
    setScheduleTime("");
  };

  const handleSaveGroup = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, image_url: result.file_url});
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("فشل رفع الصورة. حاول مرة أخرى.");
    }
    setUploadingImage(false);
  };

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMaterial(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setMaterialData({...materialData, file_url: result.file_url});
    } catch (error) {
      console.error("Error uploading material:", error);
      alert("فشل رفع الملف. حاول مرة أخرى.");
    }
    setUploadingMaterial(false);
  };

  const addSchedule = () => {
    if (scheduleDay && scheduleTime) {
      setFormData({
        ...formData,
        schedule: [...formData.schedule, { day: scheduleDay, time: scheduleTime }]
      });
      setScheduleDay("");
      setScheduleTime("");
    }
  };

  const removeSchedule = (index) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المجموعات</h1>
            <p className="text-gray-600">أنشئ وأدر مجموعاتك الدراسية</p>
          </div>

          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) {
              setEditingGroup(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
                مجموعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingGroup ? "تعديل المجموعة" : "إنشاء مجموعة جديدة"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label>اسم المجموعة *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="مثال: مجموعة الرياضيات المتقدمة"
                  />
                </div>

                <div>
                  <Label>صورة المجموعة</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="flex-1"
                      />
                      {uploadingImage && (
                        <Upload className="w-5 h-5 animate-spin text-green-600" />
                      )}
                    </div>
                    {uploadingImage && (
                      <p className="text-sm text-gray-600">جاري رفع الصورة...</p>
                    )}
                    {formData.image_url && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                        <img 
                          src={formData.image_url} 
                          alt="صورة المجموعة"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFormData({...formData, image_url: ""})}
                          className="absolute top-2 right-2 bg-white/90"
                        >
                          حذف
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المادة *</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>المرحلة *</Label>
                    <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>المنهج</Label>
                  <Select value={formData.curriculum} onValueChange={(value) => setFormData({...formData, curriculum: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنهج" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRICULUMS.map(curriculum => (
                        <SelectItem key={curriculum} value={curriculum}>{curriculum}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>سعر الحصة (دينار) *</Label>
                    <Input
                      type="number"
                      value={formData.price_per_session}
                      onChange={(e) => setFormData({...formData, price_per_session: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>الحد الأقصى للطلاب</Label>
                    <Input
                      type="number"
                      value={formData.max_students}
                      onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value)})}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label>وصف المجموعة</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف مختصر عن محتوى وأهداف المجموعة"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>مواعيد الحصص</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value={scheduleDay} onValueChange={setScheduleDay}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اليوم" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={scheduleTime} onValueChange={setScheduleTime}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="الساعة" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button type="button" onClick={addSchedule} variant="outline">
                      إضافة
                    </Button>
                  </div>

                  {formData.schedule.length > 0 && (
                    <div className="space-y-2">
                      {formData.schedule.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm">{item.day} - {item.time}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSchedule(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSaveGroup} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={createGroupMutation.isPending || updateGroupMutation.isPending || !formData.name || !formData.subject || !formData.stage}
                >
                  {(createGroupMutation.isPending || updateGroupMutation.isPending) ? "جاري الحفظ..." : editingGroup ? "حفظ التعديلات" : "إنشاء المجموعة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcement Dialog */}
        <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال إعلان للمجموعة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>عنوان الإعلان *</Label>
                <Input
                  value={announcementData.title}
                  onChange={(e) => setAnnouncementData({...announcementData, title: e.target.value})}
                  placeholder="مثال: واجب جديد"
                />
              </div>
              <div>
                <Label>المحتوى *</Label>
                <Textarea
                  value={announcementData.content}
                  onChange={(e) => setAnnouncementData({...announcementData, content: e.target.value})}
                  placeholder="اكتب محتوى الإعلان..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={announcementData.is_urgent}
                  onChange={(e) => setAnnouncementData({...announcementData, is_urgent: e.target.checked})}
                  id="urgent"
                  className="w-4 h-4"
                />
                <Label htmlFor="urgent" className="text-sm">إعلان عاجل</Label>
              </div>
              <Button
                onClick={() => sendAnnouncementMutation.mutate({
                  ...announcementData,
                  teacher_email: user?.email,
                  group_id: selectedGroup?.id,
                  type: "announcement"
                })}
                disabled={!announcementData.title || !announcementData.content || sendAnnouncementMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {sendAnnouncementMutation.isPending ? "جاري الإرسال..." : "إرسال الإعلان"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Material Dialog */}
        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مادة تعليمية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان *</Label>
                <Input
                  value={materialData.title}
                  onChange={(e) => setMaterialData({...materialData, title: e.target.value})}
                  placeholder="مثال: شرح الدرس الأول"
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={materialData.description}
                  onChange={(e) => setMaterialData({...materialData, description: e.target.value})}
                  placeholder="وصف مختصر..."
                  rows={2}
                />
              </div>
              <div>
                <Label>نوع المادة *</Label>
                <Select value={materialData.type} onValueChange={(value) => setMaterialData({...materialData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">ملف (PDF, Word, etc.)</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="link">رابط خارجي</SelectItem>
                    <SelectItem value="document">مستند</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {materialData.type === 'link' ? (
                <div>
                  <Label>الرابط *</Label>
                  <Input
                    type="url"
                    value={materialData.file_url}
                    onChange={(e) => setMaterialData({...materialData, file_url: e.target.value})}
                    placeholder="https://example.com/material"
                  />
                </div>
              ) : (
                <div>
                  <Label>رفع الملف *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleMaterialUpload}
                      disabled={uploadingMaterial}
                      className="flex-1"
                    />
                    {uploadingMaterial && (
                      <Upload className="w-5 h-5 animate-spin text-green-600" />
                    )}
                  </div>
                  {materialData.file_url && (
                    <p className="text-sm text-green-600 mt-2">✓ تم الرفع بنجاح</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={materialData.is_downloadable}
                  onChange={(e) => setMaterialData({...materialData, is_downloadable: e.target.checked})}
                  id="downloadable"
                  className="w-4 h-4"
                />
                <Label htmlFor="downloadable" className="text-sm">السماح بالتحميل</Label>
              </div>
              <Button
                onClick={() => addMaterialMutation.mutate(materialData)}
                disabled={!materialData.title || !materialData.file_url || addMaterialMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {addMaterialMutation.isPending ? "جاري الإضافة..." : "إضافة المادة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد مجموعات بعد</h3>
              <p className="text-gray-600 mb-6">ابدأ بإنشاء مجموعتك الأولى لاستقبال الطلاب</p>
              <Button 
                onClick={() => setShowDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مجموعة جديدة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                {group.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={group.image_url} 
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{group.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          <BookOpen className="w-3 h-3 ml-1" />
                          {group.subject}
                        </Badge>
                        <Badge variant="secondary">{group.stage}</Badge>
                        <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                          {group.status === 'active' ? 'نشط' : group.status === 'inactive' ? 'غير نشط' : 'مكتمل'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        الطلاب
                      </span>
                      <span className="font-semibold">
                        {group.students?.length || 0} / {group.max_students}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        سعر الحصة
                      </span>
                      <span className="font-semibold text-green-600">
                        {group.price_per_session} د.ك
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(createPageUrl("GroupDetails") + `?id=${group.id}`)}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingGroup(group);
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>

                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
                            deleteGroupMutation.mutate(group.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowAnnouncementDialog(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Bell className="w-4 h-4 ml-1" />
                        إعلان
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowMaterialDialog(true);
                        }}
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        <FileText className="w-4 h-4 ml-1" />
                        مادة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

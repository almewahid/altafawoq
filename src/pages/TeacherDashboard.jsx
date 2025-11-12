
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DollarSign,
  Users,
  BookOpen,
  Star,
  Edit,
  Video,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
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
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const COUNTRIES = ["السعودية", "الإمارات", "مصر", "الأردن", "الكويت", "قطر", "البحرين", "عمان"];
const STAGES = ["روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي"];
const SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية"];
const CURRICULUMS = ["سعودي", "إماراتي", "مصري", "أمريكي", "بريطاني", "IB"];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const { data: teacherProfile, isLoading } = useQuery({
    queryKey: ['teacherProfile', user?.email],
    queryFn: () => base44.entities.TeacherProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const profile = teacherProfile?.[0];

  const { data: groups = [] } = useQuery({
    queryKey: ['teacherGroups', user?.email],
    queryFn: () => base44.entities.StudyGroup.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: videoSessions = [] } = useQuery({
    queryKey: ['teacherVideoSessions', user?.email],
    queryFn: () => base44.entities.VideoSession.filter({ teacher_email: user?.email }, '-scheduled_time'),
    enabled: !!user?.email,
  });

  const upcomingSessions = videoSessions.filter(s =>
    s.status === 'scheduled' && new Date(s.scheduled_time) > new Date()
  );

  const [formData, setFormData] = React.useState({
    name: "",
    bio: "",
    subjects: [],
    stages: [],
    curriculum: [],
    teaching_type: [],
    hourly_rate: 0,
    currency: "KWD", // New field
    country: "",
    city: "",
    area: "",
    years_experience: 0,
    video_url: "",
    video_introduction: "", // New field
    portfolio: [], // New field
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        subjects: profile.subjects || [],
        stages: profile.stages || [],
        curriculum: profile.curriculum || [],
        teaching_type: profile.teaching_type || [],
        hourly_rate: profile.hourly_rate || 0,
        currency: profile.currency || "KWD", // New
        country: profile.country || "",
        city: profile.city || "",
        area: profile.area || "",
        years_experience: profile.years_experience || 0,
        video_url: profile.video_url || "",
        video_introduction: profile.video_introduction || "", // New
        portfolio: profile.portfolio || [], // New
      });
    }
  }, [profile]);

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.TeacherProfile.create({
      ...data,
      user_email: user?.email,
      is_approved: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherProfile']);
      setShowEditDialog(false);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.TeacherProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherProfile']);
      setShowEditDialog(false);
    },
  });

  const handleSaveProfile = () => {
    if (profile) {
      updateProfileMutation.mutate(formData);
    } else {
      createProfileMutation.mutate(formData);
    }
  };

  const toggleArrayItem = (field, item) => {
    const current = formData[field] || [];
    if (current.includes(item)) {
      setFormData({...formData, [field]: current.filter(i => i !== item)});
    } else {
      setFormData({...formData, [field]: [...current, item]});
    }
  };

  const [portfolioItem, setPortfolioItem] = React.useState({
    title: "",
    description: "",
    file_url: "",
    type: "lesson_plan"
  });

  const addPortfolioItem = () => {
    if (portfolioItem.title && portfolioItem.file_url) {
      setFormData({
        ...formData,
        portfolio: [...(formData.portfolio || []), portfolioItem]
      });
      setPortfolioItem({
        title: "",
        description: "",
        file_url: "",
        type: "lesson_plan"
      });
    }
  };

  const removePortfolioItem = (index) => {
    setFormData({
      ...formData,
      portfolio: formData.portfolio.filter((_, i) => i !== index)
    });
  };

  const stats = [
    {
      title: "إجمالي الطلاب",
      value: profile?.total_students || 0,
      icon: Users,
      color: "blue",
      change: "+12% هذا الشهر"
    },
    {
      title: "المجموعات النشطة",
      value: groups.filter(g => g.status === 'active').length,
      icon: BookOpen,
      color: "green",
      change: `${groups.length} إجمالي`
    },
    {
      title: "التقييم",
      value: profile?.rating?.toFixed(1) || "0.0",
      icon: Star,
      color: "yellow",
      change: "من 5.0"
    },
    {
      title: "سعر الساعة",
      value: `${profile?.hourly_rate || 0} ${profile?.currency || 'د.ك'}`, // Updated to use currency
      icon: DollarSign,
      color: "green",
      change: "يمكن تعديله"
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-4">مرحباً بك في منصة التفوق!</h2>
              <p className="text-gray-600 mb-8">
                لم تقم بإنشاء ملفك التعريفي بعد. أنشئ ملفك الآن لتبدأ بالتدريس ومشاركة خبرتك
              </p>
              <Button
                size="lg"
                onClick={() => setShowEditDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                إنشاء الملف التعريفي
              </Button>
            </CardContent>
          </Card>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">إنشاء الملف التعريفي</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <Label>نبذة عنك *</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="اكتب نبذة مختصرة عن خبرتك التعليمية"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>المواد التي تدرسها *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {SUBJECTS.map(subject => (
                      <Button
                        key={subject}
                        type="button"
                        variant={formData.subjects?.includes(subject) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('subjects', subject)}
                        className="justify-start"
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>المراحل التعليمية *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {STAGES.map(stage => (
                      <Button
                        key={stage}
                        type="button"
                        variant={formData.stages?.includes(stage) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('stages', stage)}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>المناهج</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {CURRICULUMS.map(curriculum => (
                      <Button
                        key={curriculum}
                        type="button"
                        variant={formData.curriculum?.includes(curriculum) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('curriculum', curriculum)}
                        className="justify-start"
                      >
                        {curriculum}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>نوع التدريس *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={formData.teaching_type?.includes('online') ? "default" : "outline"}
                      onClick={() => toggleArrayItem('teaching_type', 'online')}
                    >
                      أونلاين
                    </Button>
                    <Button
                      type="button"
                      variant={formData.teaching_type?.includes('home') ? "default" : "outline"}
                      onClick={() => toggleArrayItem('teaching_type', 'home')}
                    >
                      منزلي
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الدولة *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="المدينة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>سعر الساعة (دينار) *</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>العملة المفضلة</Label>
                    <Select
                      value={formData.currency || "KWD"}
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                    <Label>سنوات الخبرة</Label>
                    <Input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
                      placeholder="0"
                    />
                </div>

                <div>
                  <Label>رابط الفيديو التعريفي الرئيسي</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <Label>رابط فيديو تقديمي قصير (Video Introduction)</Label>
                  <Input
                    value={formData.video_introduction}
                    onChange={(e) => setFormData({...formData, video_introduction: e.target.value})}
                    placeholder="فيديو قصير يعرض أسلوبك في التدريس"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    فيديو قصير (1-3 دقائق) يعرض شخصيتك وأسلوبك التدريسي
                  </p>
                </div>

                {/* Portfolio Section */}
                <div className="border-t pt-4">
                  <Label className="text-lg mb-3 block">معرض الأعمال (Portfolio)</Label>

                  {/* Add Portfolio Item */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">نوع العمل</Label>
                        <Select
                          value={portfolioItem.type}
                          onValueChange={(value) => setPortfolioItem({...portfolioItem, type: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesson_plan">خطة درس</SelectItem>
                            <SelectItem value="success_story">قصة نجاح طالب</SelectItem>
                            <SelectItem value="project">مشروع تعليمي</SelectItem>
                            <SelectItem value="certificate">شهادة</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">العنوان</Label>
                        <Input
                          value={portfolioItem.title}
                          onChange={(e) => setPortfolioItem({...portfolioItem, title: e.target.value})}
                          placeholder="مثال: خطة درس الجبر المتقدم"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">الوصف</Label>
                        <Textarea
                          value={portfolioItem.description}
                          onChange={(e) => setPortfolioItem({...portfolioItem, description: e.target.value})}
                          placeholder="وصف مختصر..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">رابط الملف</Label>
                        <Input
                          value={portfolioItem.file_url}
                          onChange={(e) => setPortfolioItem({...portfolioItem, file_url: e.target.value})}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={addPortfolioItem}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        إضافة للمعرض
                      </Button>
                    </div>
                  </div>

                  {/* Display Portfolio Items */}
                  {formData.portfolio?.length > 0 && (
                    <div className="space-y-2">
                      {formData.portfolio.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.type}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePortfolioItem(index)}
                            className="text-red-600"
                          >
                            حذف
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={createProfileMutation.isPending}
                >
                  {createProfileMutation.isPending ? "جاري الحفظ..." : "حفظ الملف التعريفي"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              مرحباً، {profile.name}
            </h1>
            <p className="text-gray-600">إليك نظرة عامة على نشاطك التعليمي</p>
          </div>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Edit className="w-4 h-4 ml-2" />
                تعديل الملف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">تعديل الملف التعريفي</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>نبذة عنك *</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>المواد التي تدرسها *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {SUBJECTS.map(subject => (
                      <Button
                        key={subject}
                        type="button"
                        variant={formData.subjects?.includes(subject) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('subjects', subject)}
                        className="justify-start"
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>المراحل التعليمية *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {STAGES.map(stage => (
                      <Button
                        key={stage}
                        type="button"
                        variant={formData.stages?.includes(stage) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('stages', stage)}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>المناهج</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {CURRICULUMS.map(curriculum => (
                      <Button
                        key={curriculum}
                        type="button"
                        variant={formData.curriculum?.includes(curriculum) ? "default" : "outline"}
                        onClick={() => toggleArrayItem('curriculum', curriculum)}
                        className="justify-start"
                      >
                        {curriculum}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>نوع التدريس *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={formData.teaching_type?.includes('online') ? "default" : "outline"}
                      onClick={() => toggleArrayItem('teaching_type', 'online')}
                    >
                      أونلاين
                    </Button>
                    <Button
                      type="button"
                      variant={formData.teaching_type?.includes('home') ? "default" : "outline"}
                      onClick={() => toggleArrayItem('teaching_type', 'home')}
                    >
                      منزلي
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الدولة *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="المدينة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>سعر الساعة (دينار) *</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>العملة المفضلة</Label>
                    <Select
                      value={formData.currency || "KWD"}
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                    <Label>سنوات الخبرة</Label>
                    <Input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
                      placeholder="0"
                    />
                </div>

                <div>
                  <Label>رابط الفيديو التعريفي الرئيسي</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <Label>رابط فيديو تقديمي قصير (Video Introduction)</Label>
                  <Input
                    value={formData.video_introduction}
                    onChange={(e) => setFormData({...formData, video_introduction: e.target.value})}
                    placeholder="فيديو قصير يعرض أسلوبك في التدريس"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    فيديو قصير (1-3 دقائق) يعرض شخصيتك وأسلوبك التدريسي
                  </p>
                </div>

                {/* Portfolio Section */}
                <div className="border-t pt-4">
                  <Label className="text-lg mb-3 block">معرض الأعمال (Portfolio)</Label>

                  {/* Add Portfolio Item */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">نوع العمل</Label>
                        <Select
                          value={portfolioItem.type}
                          onValueChange={(value) => setPortfolioItem({...portfolioItem, type: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesson_plan">خطة درس</SelectItem>
                            <SelectItem value="success_story">قصة نجاح طالب</SelectItem>
                            <SelectItem value="project">مشروع تعليمي</SelectItem>
                            <SelectItem value="certificate">شهادة</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">العنوان</Label>
                        <Input
                          value={portfolioItem.title}
                          onChange={(e) => setPortfolioItem({...portfolioItem, title: e.target.value})}
                          placeholder="مثال: خطة درس الجبر المتقدم"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">الوصف</Label>
                        <Textarea
                          value={portfolioItem.description}
                          onChange={(e) => setPortfolioItem({...portfolioItem, description: e.target.value})}
                          placeholder="وصف مختصر..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">رابط الملف</Label>
                        <Input
                          value={portfolioItem.file_url}
                          onChange={(e) => setPortfolioItem({...portfolioItem, file_url: e.target.value})}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={addPortfolioItem}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        إضافة للمعرض
                      </Button>
                    </div>
                  </div>

                  {/* Display Portfolio Items */}
                  {formData.portfolio?.length > 0 && (
                    <div className="space-y-2">
                      {formData.portfolio.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.type}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePortfolioItem(index)}
                            className="text-red-600"
                          >
                            حذف
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Approval Status */}
        {!profile.is_approved && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-r-4 border-r-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-lg mb-1">بانتظار موافقة الإدارة</h3>
                  <p className="text-gray-600">
                    تم استلام ملفك التعريفي وسيتم مراجعته قريباً. ستصلك رسالة بالبريد الإلكتروني عند الموافقة.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profile.is_approved && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-r-4 border-r-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-lg mb-1">ملفك معتمد ونشط!</h3>
                  <p className="text-gray-600">
                    ملفك التعريفي معتمد ويظهر للطلاب. يمكنك الآن إنشاء المجموعات واستقبال الطلاب.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Video Sessions */}
        {upcomingSessions.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-r-blue-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-600" />
                الجلسات المجدولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session) => {
                  const group = groups.find(g => g.id === session.group_id);
                  return (
                    <div key={session.id} className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{session.title}</h4>
                          <p className="text-sm text-gray-600">{group?.name}</p>
                        </div>
                        <Badge className="bg-blue-600">مجدولة</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {format(new Date(session.scheduled_time), 'dd MMMM - HH:mm', { locale: ar })}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => navigate(createPageUrl("VideoSession") + `?id=${session.id}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="w-4 h-4 ml-1" />
                          بدء
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="text-sm text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("TeacherGroups"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">إدارة المجموعات</h3>
              <p className="text-sm text-gray-600 mb-4">
                أنشئ مجموعات جديدة أو أدر المجموعات الحالية
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                إدارة المجموعات
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("TeacherCoupons"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">الكوبونات</h3>
              <p className="text-sm text-gray-600 mb-4">
                أنشئ كوبونات خصم لجذب المزيد من الطلاب
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                إدارة الكوبونات
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(createPageUrl("Messages"))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">الرسائل</h3>
              <p className="text-sm text-gray-600 mb-4">
                تواصل مع طلابك واطلع على الرسائل الجديدة
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                فتح الرسائل
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Groups */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">المجموعات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">لم تقم بإنشاء أي مجموعات بعد</p>
                <Button
                  onClick={() => navigate(createPageUrl("TeacherGroups"))}
                  className="bg-green-600 hover:bg-green-700"
                >
                  إنشاء مجموعة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.slice(0, 5).map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">
                        {group.subject} - {group.stage}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                        {group.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {group.students?.length || 0} طالب
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Star,
  MapPin,
  BookOpen,
  DollarSign,
  Calendar,
  Users,
  Award,
  ArrowRight,
  Send,
  Play,
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Added Label
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TeacherDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teacherId = urlParams.get('id');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false); // New state for review dialog
  const [reviewForm, setReviewForm] = useState({ // New state for review form
    rating: 5,
    comment: "",
    teaching_quality: 5,
    communication: 5,
    punctuality: 5,
    materials: 5
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: async () => {
      const teachers = await base44.entities.TeacherProfile.filter({ id: teacherId });
      return teachers[0];
    },
    enabled: !!teacherId,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['teacherGroups', teacher?.user_email],
    queryFn: () => base44.entities.StudyGroup.filter({
      teacher_email: teacher?.user_email,
      status: 'active'
    }),
    enabled: !!teacher?.user_email,
  });

  const { data: reviews = [] } = useQuery({ // New query for teacher reviews
    queryKey: ['teacherReviews', teacher?.user_email],
    queryFn: () => base44.entities.Review.filter({ teacher_email: teacher?.user_email }),
    enabled: !!teacher?.user_email,
  });

  const { data: myEnrollments = [] } = useQuery({ // New query for student enrollments with this teacher
    queryKey: ['myEnrollments', user?.email, teacher?.user_email],
    queryFn: () => base44.entities.Enrollment.filter({ 
      student_email: user?.email,
      teacher_email: teacher?.user_email,
      status: 'completed'
    }),
    enabled: !!user?.email && !!teacher?.user_email,
  });

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'KWD': 'د.ك',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€'
    };
    return symbols[currency] || 'د.ك';
  };

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setShowMessageDialog(false);
      setMessageText("");
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactPayment.create(data),
    onSuccess: () => {
      setShowContactDialog(false);
    },
  });

  const createReviewMutation = useMutation({ // New mutation for creating reviews
    mutationFn: (data) => base44.entities.Review.create({
      ...data,
      student_email: user?.email,
      teacher_email: teacher?.user_email,
      is_verified: true, // Assuming a verified enrollment implies a verified review
      aspects: {
        teaching_quality: data.teaching_quality,
        communication: data.communication,
        punctuality: data.punctuality,
        materials: data.materials
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherReviews', teacher?.user_email]); // Invalidate reviews for this teacher
      queryClient.invalidateQueries(['teacher', teacherId]); // Invalidate teacher details to refresh average rating
      setShowReviewDialog(false);
      setReviewForm({
        rating: 5,
        comment: "",
        teaching_quality: 5,
        communication: 5,
        punctuality: 5,
        materials: 5
      });
    },
  });

  const handleSendMessage = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    if (messageText.trim()) {
      sendMessageMutation.mutate({
        sender_email: user.email,
        receiver_email: teacher.user_email,
        subject: "استفسار عن الدروس",
        content: messageText,
        is_read: false
      });
    }
  };

  const handleShowContact = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    // Get platform settings
    const settings = await base44.entities.PlatformSettings.filter({ setting_key: 'contact_view_price' });
    const contactPrice = settings[0]?.setting_value || '0.5';
    const isEnabled = await base44.entities.PlatformSettings.filter({ setting_key: 'contact_view_enabled' });
    const enabled = isEnabled[0]?.setting_value !== 'false';

    if (enabled) {
      createPaymentMutation.mutate({
        student_email: user.email,
        teacher_email: teacher.user_email,
        amount: parseFloat(contactPrice),
        status: 'completed'
      });
    }

    setShowContactDialog(true);
  };

  // Determine if the current user can leave a review
  const canReview = user && myEnrollments.length > 0 && !reviews.some(r => r.student_email === user?.email);
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : teacher?.rating?.toFixed(1) || "0.0"; // Fallback to teacher's overall rating if no reviews yet


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">المعلم غير موجود</p>
        <Button onClick={() => navigate(createPageUrl("Browse"))}>
          العودة للتصفح
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Browse"))}
            className="text-white hover:bg-white/10 mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للتصفح
          </Button>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden">
                  {teacher.avatar_url ? (
                    <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold">{teacher.name.charAt(0)}</span>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{teacher.name}</h1>

                  <div className="flex items-center gap-4 mb-4">
                    {teacher.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold">{averageRating}</span> {/* Use averageRating here */}
                        <span className="text-white/80">من 5.0</span>
                      </div>
                    )}

                    {teacher.total_students > 0 && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Users className="w-5 h-5" />
                        <span>{teacher.total_students} طالب</span>
                      </div>
                    )}

                    {teacher.years_experience > 0 && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Award className="w-5 h-5" />
                        <span>{teacher.years_experience} سنوات خبرة</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg text-white/90 mb-4">{teacher.bio}</p>

                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-5 h-5" />
                    <span>{teacher.country} {teacher.city && `- ${teacher.city}`}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 mb-2">سعر الساعة</p>
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <span className="text-4xl font-bold text-gray-900">{teacher.hourly_rate}</span>
                      <span className="text-gray-600">{getCurrencySymbol(teacher.currency)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4 ml-2" />
                          إرسال رسالة
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إرسال رسالة للمعلم</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="اكتب رسالتك هنا..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={5}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || sendMessageMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {teacher.teaching_type?.includes('home') && (
                      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full" onClick={handleShowContact}>
                            عرض بيانات الاتصال
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>بيانات الاتصال</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-gray-600">رقم الهاتف: {teacher.phone || 'غير متوفر'}</p>
                            <p className="text-gray-600">البريد الإلكتروني: {teacher.user_email}</p>
                            {teacher.area && (
                              <p className="text-gray-600">المنطقة: {teacher.area}</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Subjects & Stages */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  المواد والمراحل
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">المواد</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects?.map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 px-3 py-1">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">المراحل التعليمية</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.stages?.map((stage, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1">
                          <GraduationCap className="w-3 h-3 ml-1" />
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {teacher.curriculum?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">المناهج</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.curriculum.map((curr, idx) => (
                          <Badge key={idx} variant="secondary" className="px-3 py-1">
                            {curr}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Introduction */}
            {teacher.video_introduction && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Play className="w-6 h-6 text-green-600" />
                    فيديو تقديمي
                  </h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {teacher.video_introduction.includes('youtube.com') || teacher.video_introduction.includes('youtu.be') ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={teacher.video_introduction.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title="فيديو تقديمي"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    ) : teacher.video_introduction.includes('vimeo.com') ? (
                      <iframe
                        src={teacher.video_introduction.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    ) : (
                      <video
                        controls
                        className="w-full h-full"
                        src={teacher.video_introduction}
                      >
                        المتصفح الخاص بك لا يدعم تشغيل الفيديو
                      </video>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {teacher.portfolio?.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                    معرض الأعمال
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {teacher.portfolio.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                        <Badge variant="secondary" className="mb-2">
                          {item.type === 'lesson_plan' ? 'خطة درس' :
                           item.type === 'success_story' ? 'قصة نجاح' :
                           item.type === 'project' ? 'مشروع' :
                           item.type === 'certificate' ? 'شهادة' : 'أخرى'}
                        </Badge>
                        <h4 className="font-semibold mb-2">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}
                        {item.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="w-full"
                          >
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              عرض
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Groups */}
            {groups.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" />
                    المجموعات النشطة
                  </h3>
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{group.name}</h4>
                          <span className="text-green-600 font-bold">
                            {group.price_per_session} د.ك/حصة
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="secondary">{group.subject}</Badge>
                            <Badge variant="secondary">{group.stage}</Badge>
                          </div>
                          <span className="text-sm text-gray-600">
                            {group.students?.length || 0} / {group.max_students} طالب
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    التقييمات والمراجعات
                  </CardTitle>
                  {canReview && (
                    <Button
                      onClick={() => setShowReviewDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      أضف تقييمك
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Overall Rating */}
                <div className="flex items-center gap-8 mb-8 p-6 bg-yellow-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900">{averageRating}</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(parseFloat(averageRating))
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reviews.length} تقييم
                    </p>
                  </div>

                  {/* Detailed Ratings */}
                  {reviews.length > 0 && (
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = reviews.filter(r => Math.round(r.rating) === rating).length;
                        const percentage = (count / reviews.length) * 100;
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <span className="text-sm w-12">{rating} نجوم</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">لا توجد تقييمات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {review.student_email?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900">
                                {review.student_email?.split('@')[0]}
                              </span>
                              {review.is_verified && (
                                <Badge variant="secondary" className="text-xs">موثق</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                        )}
                        {/* Aspect Ratings */}
                        {review.aspects && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {review.aspects.teaching_quality && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">جودة التدريس:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.aspects.teaching_quality
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.aspects.communication && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">التواصل:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.aspects.communication
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.aspects.punctuality && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">الالتزام:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.aspects.punctuality
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.aspects.materials && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">المواد:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.aspects.materials
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">نوع التدريس</h3>
                <div className="space-y-2">
                  {teacher.teaching_type?.map((type, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      {type === 'online' ? 'تدريس أونلاين' : 'تدريس منزلي'}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">احجز درسك الآن</h3>
                <p className="text-sm text-gray-600 mb-4">
                  انضم لمجموعة المعلم واستفد من خبرته التعليمية
                </p>
                {groups.length > 0 ? (
                  <div className="space-y-3">
                    {groups.slice(0, 2).map((group) => (
                      <div key={group.id} className="p-3 bg-white rounded-lg border border-green-200">
                        <h4 className="font-semibold text-sm mb-1">{group.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {group.students?.length || 0} / {group.max_students} طالب
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!user) {
                              base44.auth.redirectToLogin(window.location.pathname + window.location.search);
                              return;
                            }
                            // Navigate to enrollment
                            navigate(createPageUrl("EnrollGroup") + `?id=${group.id}`);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Calendar className="w-3 h-3 ml-1" />
                          اشترك الآن - {group.price_per_session} د.ك
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowMessageDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="w-4 h-4 ml-2" />
                    تواصل للاشتراك
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تقييم المعلم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>التقييم الإجمالي</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${
                      star <= reviewForm.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>تعليقك</Label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="شارك تجربتك مع هذا المعلم..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>تقييمات تفصيلية</Label>
              {[
                { key: 'teaching_quality', label: 'جودة التدريس' },
                { key: 'communication', label: 'التواصل' },
                { key: 'punctuality', label: 'الالتزام بالمواعيد' },
                { key: 'materials', label: 'المواد التعليمية' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 cursor-pointer ${
                          star <= reviewForm[key]
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setReviewForm({ ...reviewForm, [key]: star })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => createReviewMutation.mutate(reviewForm)}
              disabled={createReviewMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {createReviewMutation.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Other Dialogs */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال رسالة للمعلم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="اكتب رسالتك هنا..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بيانات الاتصال</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">رقم الهاتف: {teacher?.phone || 'غير متوفر'}</p>
            <p className="text-gray-600">البريد الإلكتروني: {teacher?.user_email}</p>
            {teacher?.area && (
              <p className="text-gray-600">المنطقة: {teacher?.area}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

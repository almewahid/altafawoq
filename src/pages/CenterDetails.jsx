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
  Users,
  ArrowRight,
  Send,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Image as ImageIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CenterDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const centerId = urlParams.get('id');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");

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

  const { data: center, isLoading } = useQuery({
    queryKey: ['center', centerId],
    queryFn: async () => {
      const centers = await base44.entities.EducationalCenter.filter({ id: centerId });
      return centers[0];
    },
    enabled: !!centerId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setShowMessageDialog(false);
      setMessageText("");
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
        receiver_email: center.user_email,
        subject: "استفسار عن المركز التعليمي",
        content: messageText,
        is_read: false
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">المركز غير موجود</p>
        <Button onClick={() => navigate(createPageUrl("Browse"))}>
          العودة للتصفح
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Browse") + "?type=center")}
            className="text-white hover:bg-white/10 mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للتصفح
          </Button>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden">
                  {center.images?.[0] ? (
                    <img src={center.images[0]} alt={center.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16" />
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{center.name}</h1>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {center.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold">{center.rating.toFixed(1)}</span>
                        <span className="text-white/80">من 5.0</span>
                      </div>
                    )}
                    
                    {center.total_students > 0 && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Users className="w-5 h-5" />
                        <span>{center.total_students} طالب</span>
                      </div>
                    )}
                  </div>

                  <p className="text-lg text-white/90 mb-4">{center.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-5 h-5" />
                      <span>{center.country} - {center.city} - {center.area}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Phone className="w-5 h-5" />
                      <span>{center.phone}</span>
                    </div>
                    {center.address && (
                      <div className="flex items-start gap-2 text-white/90">
                        <MapPin className="w-5 h-5 mt-0.5" />
                        <span>{center.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 mb-2">الاشتراك الشهري</p>
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-8 h-8 text-orange-600" />
                      <span className="text-4xl font-bold text-gray-900">{center.price_per_month}</span>
                      <span className="text-gray-600">د.ك</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          <Send className="w-4 h-4 ml-2" />
                          إرسال رسالة
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إرسال رسالة للمركز</DialogTitle>
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
                            className="w-full bg-orange-600 hover:bg-orange-700"
                          >
                            {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${center.phone}`}>
                        <Phone className="w-4 h-4 ml-2" />
                        اتصل الآن
                      </a>
                    </Button>
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
            {/* Images Gallery */}
            {center.images?.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-orange-600" />
                    صور المركز
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {center.images.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden">
                        <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subjects & Stages */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                  المواد والمراحل المتاحة
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">المواد</p>
                    <div className="flex flex-wrap gap-2">
                      {center.subjects?.map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700 px-3 py-1">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">المراحل التعليمية</p>
                    <div className="flex flex-wrap gap-2">
                      {center.stages?.map((stage, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1">
                          <GraduationCap className="w-3 h-3 ml-1" />
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {center.curriculum?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">المناهج</p>
                      <div className="flex flex-wrap gap-2">
                        {center.curriculum.map((curr, idx) => (
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

            {/* Video */}
            {center.video_url && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">الفيديو التعريفي</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <a 
                      href={center.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
                    >
                      <Building2 className="w-8 h-8" />
                      <span>مشاهدة الفيديو</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">معلومات الاتصال</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5 text-orange-600" />
                    <span dir="ltr">{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <span className="text-sm break-all">{center.user_email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-sm">
                      {center.country} - {center.city} - {center.area}
                      {center.address && <><br />{center.address}</>}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">انضم للمركز الآن</h3>
                <p className="text-sm text-gray-600 mb-4">
                  تواصل مع المركز مباشرة للاستفسار عن الخدمات والأسعار
                </p>
                <Button 
                  onClick={() => setShowMessageDialog(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="w-4 h-4 ml-2" />
                  تواصل معنا
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
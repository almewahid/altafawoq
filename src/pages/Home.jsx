import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Video, 
  Home as HomeIcon, 
  Building2, 
  GraduationCap,
  ArrowLeft,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  const { data: userData } = useQuery({
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

  React.useEffect(() => {
    if (userData) {
      setUser(userData);
      if (!userData.user_type) {
        navigate(createPageUrl("CompleteProfile"));
      }
    }
  }, [userData]);

  React.useEffect(() => {
    document.title = "التفوق - منصة تعليمية";
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Home"));
  };

  const teachingCategories = [
    {
      id: "online",
      title: "مدرس أونلاين",
      description: "تعلم من منزلك مع أفضل المعلمين عبر الإنترنت",
      icon: Video,
      gradient: "from-blue-500 to-cyan-600",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      features: ["دروس تفاعلية", "مرونة في المواعيد", "توفير الوقت والجهد"]
    },
    {
      id: "home",
      title: "مدرس منزلي",
      description: "معلم خاص يأتي إلى منزلك لتعليم شخصي مباشر",
      icon: HomeIcon,
      gradient: "from-green-500 to-emerald-600",
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop",
      features: ["تعليم وجهاً لوجه", "اهتمام شخصي", "جدول مخصص"]
    },
    {
      id: "center",
      title: "مركز تعليمي",
      description: "انضم لمراكز تعليمية متخصصة بمناهج متطورة",
      icon: Building2,
      gradient: "from-orange-500 to-red-600",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop",
      features: ["بيئة تعليمية مميزة", "مجموعات صغيرة", "مرافق حديثة"]
    },
    {
      id: "services",
      title: "خدمات تعليمية",
      description: "أبحاث، بوربوينت، حل واجبات ومشاريع",
      icon: FileText,
      gradient: "from-purple-500 to-pink-600",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
      features: ["أبحاث علمية", "عروض تقديمية", "حل واجبات"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Simple Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">التفوق</h1>
                <p className="text-gray-600 text-sm">منصة تعليمية</p>
              </div>
            </div>
            
            {!user && (
              <Button 
                onClick={handleLogin}
                className="bg-green-600 hover:bg-green-700"
              >
                تسجيل الدخول
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            اختر الخدمة المناسبة لك
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            نوفر لك أربع خدمات مميزة، اختر ما يناسب احتياجاتك وظروفك
          </p>
        </div>

        {/* Mobile: 2x2 Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {teachingCategories.map((category) => (
            <Card 
              key={category.id}
              className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
              onClick={() => {
                if (category.id === 'services') {
                  navigate(createPageUrl("EducationalServices"));
                } else {
                  navigate(createPageUrl("Browse") + `?type=${category.id}`);
                }
              }}
            >
              <div className="relative h-32 md:h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-500`}></div>
                
                <div className={`absolute inset-0 flex items-center justify-center`}>
                  <category.icon className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
              </div>
              
              <CardContent className="relative p-3 md:p-6">
                <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3 text-center">
                  {category.title}
                </h3>
                
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4 text-center hidden md:block">
                  {category.description}
                </p>

                <div className="space-y-1 mb-3 md:mb-6 hidden md:block">
                  {category.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-xs md:text-sm text-gray-600">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full bg-gradient-to-r ${category.gradient} hover:opacity-90 text-white text-xs md:text-sm`}
                >
                  <span>تصفح الآن</span>
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
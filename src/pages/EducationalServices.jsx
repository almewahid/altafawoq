import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PenTool, BookOpen, CheckSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const serviceImages = {
  research: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1767365483/Scientific_research_egcg45.png",
  presentation: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1767365480/Progresentation_gulzij.png",
  assignments: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1767365484/Solve_assignments_r9uncg.png",
  summaries: "https://res.cloudinary.com/dufjbywcm/image/upload/q_auto,f_auto,fl_lossy,w_150/v1767365470/Summaries_e9y4xz.png"
};

export default function EducationalServices() {
  const navigate = useNavigate();
  
  const services = [
    { 
      title: "أبحاث علمية", 
      icon: FileText, 
      desc: "إعداد أبحاث أكاديمية لجميع المراحل",
      image: serviceImages.research
    },
    { 
      title: "عروض تقديمية", 
      icon: PenTool, 
      desc: "تصميم عروض باوربوينت احترافية",
      image: serviceImages.presentation
    },
    { 
      title: "حل واجبات", 
      icon: CheckSquare, 
      desc: "مساعدة في حل الواجبات المدرسية",
      image: serviceImages.assignments
    },
    { 
      title: "ملخصات", 
      icon: BookOpen, 
      desc: "تلخيص الكتب والمقررات الدراسية",
      image: serviceImages.summaries
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-green-600 hover:text-white"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            عودة
          </Button>
        </div>

        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white transition-colors duration-300">
            الخدمات التعليمية
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 transition-colors duration-300">
            نقدم مجموعة متكاملة من الخدمات المساندة للعملية التعليمية
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden"
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-4 md:p-6 text-center">
                <h3 className="font-bold text-sm md:text-xl mb-2 text-gray-900 dark:text-white transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6 transition-colors duration-300">
                  {service.desc}
                </p>
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs md:text-sm">
                  طلب خدمة
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
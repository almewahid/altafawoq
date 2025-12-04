import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PenTool, BookOpen, CheckSquare } from "lucide-react";

export default function EducationalServices() {
  const services = [
    { title: "أبحاث علمية", icon: FileText, desc: "إعداد أبحاث أكاديمية لجميع المراحل" },
    { title: "عروض تقديمية", icon: PenTool, desc: "تصميم عروض باوربوينت احترافية" },
    { title: "حل واجبات", icon: CheckSquare, desc: "مساعدة في حل الواجبات المدرسية" },
    { title: "ملخصات", icon: BookOpen, desc: "تلخيص الكتب والمقررات الدراسية" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">الخدمات التعليمية</h1>
        <p className="text-gray-600">نقدم مجموعة متكاملة من الخدمات المساندة للعملية التعليمية</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <service.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">{service.title}</h3>
              <p className="text-gray-500 mb-6">{service.desc}</p>
              <Button className="w-full">طلب خدمة</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
import React from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ModeratorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Mobile Back Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-green-600 hover:text-white mb-4 transition-all"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            عودة
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              لوحة تحكم المشرف
            </h1>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">مرحباً بك في لوحة تحكم المشرف. هنا يمكنك إدارة ومراقبة الأنشطة.</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl text-center text-gray-700 dark:text-gray-300 transition-colors duration-300">
          <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">هذه لوحة تحكم المشرف.</p>
          <p>سيتم إضافة المزيد من الوظائف هنا قريباً.</p>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Tag, 
  Settings,
  LayoutDashboard,
  LogOut,
  GraduationCap,
  Calendar,
  Wallet,
  FileText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import NotificationBadge from "@/components/NotificationBadge";
import MobileBottomNav from "@/components/MobileBottomNav";
import { signOutUser } from "@/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userType } = useAuth();

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login");
    } catch (err) {
      console.error("فشل تسجيل الخروج:", err);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "الرئيسية",
        url: createPageUrl("Home"),
        icon: Home,
      }
    ];

    // قائمة المعلم
    const teacherItems = [
      {
        title: "لوحة التحكم",
        url: createPageUrl("TeacherDashboard"),
        icon: LayoutDashboard,
      },
      {
        title: "المجموعات",
        url: createPageUrl("TeacherGroups"),
        icon: Users,
      },
      {
        title: "الدروس",
        url: createPageUrl("TeacherLessons"),
        icon: BookOpen,
      },
      {
        title: "الواجبات",
        url: createPageUrl("TeacherAssignments"),
        icon: FileText,
      },
      {
        title: "الجدول",
        url: createPageUrl("TeacherCalendar"),
        icon: Calendar,
      },
      {
        title: "المحفظة",
        url: createPageUrl("TeacherWallet"),
        icon: Wallet,
      },
      {
        title: "الكوبونات",
        url: createPageUrl("TeacherCoupons"),
        icon: Tag,
      },
      {
        title: "الدردشة",
        url: createPageUrl("Chat"),
        icon: MessageSquare,
        badge: true,
      },
      {
        title: "الإعدادات",
        url: createPageUrl("Settings"),
        icon: Settings,
      },
    ];

    // قائمة الطالب
    const studentItems = [
      {
        title: "لوحتي",
        url: createPageUrl("StudentDashboard"),
        icon: LayoutDashboard,
      },
      {
        title: "الدروس",
        url: createPageUrl("StudentLessons"),
        icon: BookOpen,
      },
      {
        title: "الواجبات",
        url: createPageUrl("StudentAssignments"),
        icon: FileText,
      },
      {
        title: "الجدول",
        url: createPageUrl("StudentCalendar"),
        icon: Calendar,
      },
      {
        title: "الدردشة",
        url: createPageUrl("Chat"),
        icon: MessageSquare,
        badge: true,
      },
      {
        title: "الإعدادات",
        url: createPageUrl("Settings"),
        icon: Settings,
      },
    ];

    // قائمة مركز تعليمي
    const centerItems = [
      {
        title: "لوحة التحكم",
        url: createPageUrl("CenterDashboard"),
        icon: LayoutDashboard,
      },
      {
        title: "المعلمين",
        url: createPageUrl("CenterTeachers"),
        icon: Users,
      },
      {
        title: "الدردشة",
        url: createPageUrl("Chat"),
        icon: MessageSquare,
        badge: true,
      },
    ];

    // قائمة الإدارة
    const adminItems = [
      {
        title: "لوحة الإدارة",
        url: createPageUrl("AdminDashboard"),
        icon: Settings,
      },
      {
        title: "المستخدمين",
        url: createPageUrl("AdminUsers"),
        icon: Users,
      },
      {
        title: "التقارير",
        url: createPageUrl("AdminReports"),
        icon: FileText,
      },
    ];

    let additionalItems = [];
    if (userType === "teacher") additionalItems = teacherItems;
    else if (userType === "student") additionalItems = studentItems;
    else if (userType === "center") additionalItems = centerItems;
    else if (userType === "admin") additionalItems = adminItems;

    return [...baseItems, ...additionalItems];
  };

  const getUserTypeLabel = () => {
    const labels = {
      teacher: "معلم",
      student: "طالب",
      center: "مركز تعليمي",
      admin: "إدارة",
    };
    return labels[userType] || "مستخدم";
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <style>{`
        :root {
          --primary: 34 197 94;
          --primary-foreground: 255 255 255;
          --secondary: 251 146 60;
          --secondary-foreground: 255 255 255;
        }
        * {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
      `}</style>

      {currentUser ? (
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <Sidebar side="right" className="border-l border-orange-100 bg-white/80 backdrop-blur-sm">
              <SidebarHeader className="border-b border-orange-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">التفوق</h2>
                    <p className="text-xs text-gray-500">منصة تعليمية</p>
                  </div>
                </div>
              </SidebarHeader>
              
              <SidebarContent className="p-3">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                    القائمة
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {getNavigationItems().map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className={`hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-xl mb-1 ${
                              location.pathname === item.url ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : ''
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <div className="relative">
                                <item.icon className="w-5 h-5" />
                                {item.badge && <NotificationBadge />}
                              </div>
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter className="border-t border-orange-100 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentUser?.email?.charAt(0) || 'م'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{currentUser?.email}</p>
                      <p className="text-xs text-gray-500 truncate">{getUserTypeLabel()}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </Button>
                </div>
              </SidebarFooter>
            </Sidebar>

            <main className="flex-1 flex flex-col">
              <div className="flex-1 overflow-auto pb-20 md:pb-0">
                {children}
              </div>
            </main>
          </div>
          
          <MobileBottomNav />
        </SidebarProvider>
      ) : (
        <div className="min-h-screen">
          {children}
        </div>
      )}
    </div>
  );
}

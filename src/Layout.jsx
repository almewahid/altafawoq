import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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
  Wallet
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import NotificationBadge from "@/components/NotificationBadge";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  React.useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "الرئيسية",
        url: createPageUrl("Home"),
        icon: Home,
      }
    ];

    if (user?.user_type === "teacher") {
      return [
        ...baseItems,
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
          title: "المحفظة",
          url: createPageUrl("TeacherWallet"),
          icon: Wallet,
        },
        {
          title: "الجدول",
          url: createPageUrl("TeacherCalendar"),
          icon: Calendar,
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
      ];
    } else if (user?.user_type === "center") {
      return [
        ...baseItems,
        {
          title: "لوحة التحكم",
          url: createPageUrl("CenterDashboard"),
          icon: LayoutDashboard,
        },
        {
          title: "الدردشة",
          url: createPageUrl("Chat"),
          icon: MessageSquare,
          badge: true,
        },
      ];
    } else if (user?.user_type === "student") {
      return [
        ...baseItems,
        {
          title: "لوحتي",
          url: createPageUrl("StudentDashboard"),
          icon: LayoutDashboard,
        },
        {
          title: "الواجبات",
          url: createPageUrl("StudentAssignments"),
          icon: BookOpen,
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
      ];
    } else if (user?.role === "admin") {
      return [
        ...baseItems,
        {
          title: "لوحة الإدارة",
          url: createPageUrl("AdminDashboard"),
          icon: Settings,
        },
      ];
    }

    return baseItems;
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

      {user ? (
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
                        {user?.full_name?.charAt(0) || 'م'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
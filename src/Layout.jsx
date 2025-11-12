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
  Wallet,
  Building2
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
import NotificationCenter from "@/components/NotificationCenter";

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

  React.useEffect(() => {
    document.title = "التفوق - منصة تعليمية";
  }, []);

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
          url: createPageUrl("CenterAdminDashboard"),
          icon: Building2,
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
    } else if (user?.user_type === "parent") {
      return [
        ...baseItems,
        {
          title: "أبنائي",
          url: createPageUrl("ParentDashboard"),
          icon: Users,
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

  const navItems = getNavigationItems();

  const layoutStyles = `
    :root {
      --primary: 34 197 94;
      --primary-foreground: 255 255 255;
      --secondary: 251 146 60;
      --secondary-foreground: 255 255 255;
    }
    
    * {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body, html, #root {
      background: linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%) !important;
      min-height: 100vh !important;
    }
    
    /* Hide bottom nav on desktop */
    @media (min-width: 768px) {
      .mobile-bottom-nav {
        display: none !important;
      }
    }
    
    /* Hide desktop sidebar on mobile */
    @media (max-width: 767px) {
      .desktop-sidebar {
        display: none !important;
      }
      body, html, #root {
        background: #f3f4f6 !important;
      }
    }

    /* Change yellow to black */
    .text-yellow-400, .text-yellow-500, .text-yellow-600,
    [class*="text-yellow"] {
      color: #000000 !important;
    }
    .bg-yellow-400, .bg-yellow-500, .bg-yellow-600,
    [class*="bg-yellow"] {
      background-color: #000000 !important;
    }
    .fill-yellow-400, .fill-yellow-500, .fill-yellow-600,
    [class*="fill-yellow"] {
      fill: #000000 !important;
    }
    .border-yellow-400, .border-yellow-500, .border-yellow-600,
    [class*="border-yellow"] {
      border-color: #000000 !important;
    }
  `;

  return (
    <>
      <style>{layoutStyles}</style>
      <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%)' }}>
        {user ? (
          <>
            {/* Desktop Sidebar */}
            <SidebarProvider>
              <div className="min-h-screen flex w-full desktop-sidebar" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%)' }}>
                <Sidebar side="right" className="border-l border-gray-200 bg-white/95 backdrop-blur-sm">
                  <SidebarHeader className="border-b border-gray-200 p-6">
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
                          {navItems.map((item) => (
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

                  <SidebarFooter className="border-t border-gray-200 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
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

                <main className="flex-1 flex flex-col" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%)' }}>
                  <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 md:hidden" />
                        <h1 className="text-xl font-bold text-gray-900">التفوق</h1>
                      </div>
                      <NotificationCenter />
                    </div>
                  </header>

                  <div className="flex-1 overflow-auto pb-20 md:pb-0">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarProvider>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {navItems.slice(0, 5).map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                        isActive ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                      }`}
                    >
                      <div className="relative">
                        <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                        {item.badge && <NotificationBadge />}
                      </div>
                      <span className="text-xs mt-1 font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%)' }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}
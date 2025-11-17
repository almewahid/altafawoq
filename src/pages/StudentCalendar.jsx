import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar as CalendarIcon, Video, Users, Clock, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function StudentCalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['studentEnrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.StudyGroup.list(),
  });

  const { data: videoSessions = [] } = useQuery({
    queryKey: ['studentVideoSessions'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const allSessions = await base44.entities.VideoSession.list();
      return allSessions.filter(s => groupIds.includes(s.group_id));
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const allAssignments = await base44.entities.Assignment.list();
      return allAssignments.filter(a => groupIds.includes(a.group_id));
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    const events = [];
    const dayName = DAYS[date.getDay()];
    
    // Regular group sessions
    const myGroups = allGroups.filter(g => enrollments.some(e => e.group_id === g.id));
    myGroups.forEach(group => {
      group.schedule?.forEach(schedule => {
        if (schedule.day === dayName) {
          events.push({
            type: 'group',
            group: group,
            time: schedule.time,
            title: group.name
          });
        }
      });
    });

    // Video sessions
    videoSessions.forEach(session => {
      const sessionDate = new Date(session.scheduled_date);
      if (sessionDate.toDateString() === date.toDateString()) {
        events.push({
          type: 'video',
          session: session,
          time: session.scheduled_time,
          title: session.title
        });
      }
    });

    // Assignments due
    assignments.forEach(assignment => {
      if (assignment.due_date) {
        const dueDate = new Date(assignment.due_date);
        if (dueDate.toDateString() === date.toDateString()) {
          events.push({
            type: 'assignment',
            assignment: assignment,
            time: '23:59',
            title: assignment.title
          });
        }
      }
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays();
  const today = new Date();

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">جدولي الدراسي</h1>
          <p className="text-gray-600">عرض جميع حصصك وواجباتك</p>
        </div>

        {/* View Tabs */}
        <Tabs defaultValue="month" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="month">عرض شهري</TabsTrigger>
            <TabsTrigger value="week">عرض أسبوعي</TabsTrigger>
          </TabsList>

          {/* Monthly View */}
          <TabsContent value="month">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <CardTitle className="text-2xl">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {DAYS.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-700 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {days.map((date, index) => {
                    const events = date ? getEventsForDate(date) : [];
                    const isToday = date && date.toDateString() === today.toDateString();

                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-2 rounded-lg border ${
                          !date ? 'bg-gray-50' :
                          isToday ? 'bg-green-50 border-green-500' :
                          'bg-white hover:bg-gray-50'
                        } transition-colors`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-green-600' : 'text-gray-700'}`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {events.map((event, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs p-1 rounded cursor-pointer ${
                                    event.type === 'video' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                    event.type === 'assignment' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                    'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                  }`}
                                  onClick={() => {
                                    if (event.type === 'video') {
                                      navigate(createPageUrl("VideoSession") + `?id=${event.session.id}`);
                                    } else if (event.type === 'assignment') {
                                      navigate(createPageUrl("StudentAssignments"));
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    {event.type === 'video' ? <Video className="w-3 h-3" /> : 
                                     event.type === 'assignment' ? <FileText className="w-3 h-3" /> :
                                     <Users className="w-3 h-3" />}
                                    <span className="truncate">{event.time}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="week">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">عرض الأسبوع الحالي</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {weekDays.map((date, index) => {
                    const events = getEventsForDate(date);
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          isToday ? 'bg-green-50 border-green-500' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className={`font-bold text-lg ${isToday ? 'text-green-600' : 'text-gray-900'}`}>
                              {DAYS[date.getDay()]}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {date.getDate()} {MONTHS[date.getMonth()]} {date.getFullYear()}
                            </p>
                          </div>
                          {isToday && (
                            <Badge className="bg-green-600">اليوم</Badge>
                          )}
                        </div>

                        {events.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">لا توجد أحداث</p>
                        ) : (
                          <div className="space-y-2">
                            {events.map((event, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  if (event.type === 'video') {
                                    navigate(createPageUrl("VideoSession") + `?id=${event.session.id}`);
                                  } else if (event.type === 'assignment') {
                                    navigate(createPageUrl("StudentAssignments"));
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    event.type === 'video' ? 'bg-blue-100' :
                                    event.type === 'assignment' ? 'bg-red-100' : 'bg-purple-100'
                                  }`}>
                                    {event.type === 'video' ? <Video className="w-5 h-5 text-blue-600" /> :
                                     event.type === 'assignment' ? <FileText className="w-5 h-5 text-red-600" /> :
                                     <Users className="w-5 h-5 text-purple-600" />}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                    <p className="text-sm text-gray-600">{event.time}</p>
                                  </div>
                                </div>
                                <Badge variant={
                                  event.type === 'video' ? 'default' :
                                  event.type === 'assignment' ? 'destructive' : 'secondary'
                                }>
                                  {event.type === 'video' ? 'جلسة مباشرة' :
                                   event.type === 'assignment' ? 'واجب' : 'حصة'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Today's Schedule */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-600" />
              جدول اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(today).length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد أحداث اليوم</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventsForDate(today).map((event, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        event.type === 'video' ? 'bg-blue-100' :
                        event.type === 'assignment' ? 'bg-red-100' : 'bg-purple-100'
                      }`}>
                        {event.type === 'video' ? <Video className="w-6 h-6 text-blue-600" /> :
                         event.type === 'assignment' ? <FileText className="w-6 h-6 text-red-600" /> :
                         <Users className="w-6 h-6 text-purple-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.time}</p>
                      </div>
                    </div>
                    <Badge variant={
                      event.type === 'video' ? 'default' :
                      event.type === 'assignment' ? 'destructive' : 'secondary'
                    }>
                      {event.type === 'video' ? 'جلسة مباشرة' :
                       event.type === 'assignment' ? 'واجب' : 'حصة'}
                    </Badge>
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
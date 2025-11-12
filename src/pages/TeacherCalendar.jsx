import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar as CalendarIcon, Video, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function TeacherCalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['teacherGroups', user?.email],
    queryFn: () => base44.entities.StudyGroup.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: videoSessions = [] } = useQuery({
    queryKey: ['teacherVideoSessions', user?.email],
    queryFn: () => base44.entities.VideoSession.filter({ teacher_email: user?.email }),
    enabled: !!user?.email,
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

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    const events = [];
    const dayName = DAYS[date.getDay()];
    
    // Regular group sessions
    groups.forEach(group => {
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

    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">جدول الحصص</h1>
            <p className="text-gray-600">عرض جميع حصصك ومواعيدك</p>
          </div>
        </div>

        {/* Calendar Navigation */}
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
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS.map(day => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
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
                                event.type === 'video' 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}
                              onClick={() => {
                                if (event.type === 'video') {
                                  navigate(createPageUrl("VideoSession") + `?id=${event.session.id}`);
                                } else {
                                  navigate(createPageUrl("TeacherGroups"));
                                }
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {event.type === 'video' ? <Video className="w-3 h-3" /> : <Users className="w-3 h-3" />}
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
                <p className="text-gray-600">لا توجد حصص اليوم</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventsForDate(today).map((event, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        event.type === 'video' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {event.type === 'video' ? <Video className="w-6 h-6 text-blue-600" /> : <Users className="w-6 h-6 text-purple-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.time}
                        </p>
                      </div>
                    </div>
                    <Badge variant={event.type === 'video' ? 'default' : 'secondary'}>
                      {event.type === 'video' ? 'جلسة مباشرة' : 'حصة عادية'}
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
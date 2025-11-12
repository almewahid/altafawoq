import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Copy, CheckCircle, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VideoSessionPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('id');
  
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: session, isLoading } = useQuery({
    queryKey: ['videoSession', sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.VideoSession.filter({ id: sessionId });
      return sessions[0];
    },
    enabled: !!sessionId,
  });

  const { data: group } = useQuery({
    queryKey: ['group', session?.group_id],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.filter({ id: session?.group_id });
      return groups[0];
    },
    enabled: !!session?.group_id,
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email || !sessionId || !session?.group_id) return null;
      
      const existing = await base44.entities.Attendance.filter({
        session_id: sessionId,
        student_email: user?.email
      });

      if (existing.length === 0) {
        return await base44.entities.Attendance.create({
          group_id: session?.group_id,
          session_id: sessionId,
          student_email: user?.email,
          status: 'present',
          check_in_time: new Date().toISOString()
        });
      }
      return existing[0];
    },
  });

  // Record attendance when joining Jitsi
  useEffect(() => {
    if (session && user?.email && (session.platform === 'jitsi' || !session.platform)) {
      const isHost = session.teacher_email === user?.email;
      const sessionDate = new Date(session.scheduled_date);
      const [hours, minutes] = session.scheduled_time.split(':');
      sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const now = new Date();
      const timeUntilSession = sessionDate.getTime() - now.getTime();
      const minutesUntilSession = Math.floor(timeUntilSession / (1000 * 60));
      
      const canJoin = isHost || minutesUntilSession <= 15;

      if (canJoin) {
        recordAttendanceMutation.mutate();
      }
    }
  }, [session?.id, user?.email]);

  const copyLink = () => {
    if (session?.meeting_url) {
      navigator.clipboard.writeText(session.meeting_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinSession = () => {
    setJoining(true);
    recordAttendanceMutation.mutate();
    
    if (session?.platform === 'zoom' || session?.platform === 'google_meet') {
      window.open(session.meeting_url, '_blank');
      setTimeout(() => {
        if (user?.user_type === 'teacher') {
          navigate(createPageUrl("TeacherDashboard"));
        } else {
          navigate(createPageUrl("StudentDashboard"));
        }
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: '#1f2937' 
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid transparent', 
          borderTop: '4px solid #10b981', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: '#1f2937',
        padding: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', marginBottom: '16px' }}>الجلسة غير موجودة</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const isHost = session.teacher_email === user?.email;
  
  const sessionDate = new Date(session.scheduled_date);
  const [hours, minutes] = session.scheduled_time.split(':');
  sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const now = new Date();
  const timeUntilSession = sessionDate.getTime() - now.getTime();
  const minutesUntilSession = Math.floor(timeUntilSession / (1000 * 60));
  
  const canJoin = isHost || minutesUntilSession <= 15;

  const showJitsiFrame = canJoin && (session.platform === 'jitsi' || !session.platform);
  const showExternalJoin = canJoin && (session.platform === 'zoom' || session.platform === 'google_meet');

  // Build Jitsi iframe URL with all parameters
  const jitsiUrl = showJitsiFrame ? 
    `https://meet.jit.si/${session.meeting_room_id}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName="${encodeURIComponent(user?.full_name || user?.email?.split('@')[0])}"&userInfo.email="${encodeURIComponent(user?.email)}"&config.disableDeepLinking=true` 
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#1f2937' }}>
      {/* Header */}
      <div style={{ 
        background: '#374151', 
        padding: '16px', 
        borderBottom: '1px solid #4b5563' 
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              variant="ghost"
              onClick={() => {
                if (user?.user_type === 'teacher') {
                  navigate(createPageUrl("TeacherDashboard"));
                } else {
                  navigate(createPageUrl("StudentDashboard"));
                }
              }}
              style={{ color: 'white' }}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                {session.title}
              </h1>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>{group?.name}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Badge variant="secondary" style={{ background: '#4b5563', color: 'white' }}>
              {session.platform === 'zoom' ? '🔵 Zoom' : 
               session.platform === 'google_meet' ? '📹 Google Meet' : 
               '🎥 Jitsi'}
            </Badge>
            
            {isHost && (
              <Badge variant="secondary" style={{ background: '#059669', color: 'white' }}>
                أنت المضيف
              </Badge>
            )}
            
            {isHost && session?.meeting_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                style={{ color: 'white', borderColor: '#4b5563' }}
              >
                {copied ? <CheckCircle className="w-4 h-4 ml-2" /> : <Copy className="w-4 h-4 ml-2" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {showJitsiFrame ? (
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          style={{
            width: '100%',
            height: 'calc(100vh - 80px)',
            border: 'none',
            minHeight: '500px'
          }}
        ></iframe>
      ) : showExternalJoin ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100vh - 80px)', 
          padding: '16px' 
        }}>
          <Card style={{ maxWidth: '448px', width: '100%', background: '#374151', color: 'white', border: 'none' }}>
            <CardContent style={{ padding: '48px', textAlign: 'center' }}>
              <VideoIcon style={{ width: '64px', height: '64px', color: '#10b981', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>جاهز للانضمام</h2>
              <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                اضغط الزر للانضمام عبر {session.platform === 'zoom' ? 'Zoom' : 'Google Meet'}
              </p>
              
              {session.meeting_password && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#4b5563', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>كلمة المرور:</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{session.meeting_password}</p>
                </div>
              )}

              <Button
                onClick={handleJoinSession}
                disabled={joining}
                style={{ width: '100%', background: '#059669', color: 'white' }}
              >
                {joining ? 'جاري الانضمام...' : 'انضم الآن'}
              </Button>
              
              {session.meeting_url && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#4b5563', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>الرابط المباشر:</p>
                  <a 
                    href={session.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#60a5fa', fontSize: '14px', wordBreak: 'break-all' }}
                  >
                    {session.meeting_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100vh - 80px)', 
          padding: '16px' 
        }}>
          <Card style={{ maxWidth: '448px', width: '100%', background: '#374151', color: 'white', border: 'none' }}>
            <CardContent style={{ padding: '48px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                {isHost ? 'يمكنك الدخول الآن' : 'الجلسة لم تبدأ بعد'}
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '8px' }}>
                موعد الجلسة: {sessionDate.toLocaleDateString('ar-SA')} - {session.scheduled_time}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                {isHost 
                  ? 'يمكنك الدخول في أي وقت كمعلم' 
                  : minutesUntilSession > 0
                  ? `يمكنك الانضمام قبل 15 دقيقة من موعد الجلسة (بعد ${minutesUntilSession} دقيقة)`
                  : 'الموعد قد مضى - تواصل مع المعلم'
                }
              </p>
              
              {isHost && (
                <>
                  {session.meeting_url && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#4b5563', borderRadius: '8px' }}>
                      <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>رابط الجلسة للطلاب:</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={session.meeting_url}
                          readOnly
                          style={{ 
                            flex: 1, 
                            background: '#6b7280', 
                            color: 'white', 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            fontSize: '14px',
                            border: 'none'
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={copyLink}
                          style={{ background: '#059669', color: 'white' }}
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '16px', width: '100%', background: '#059669', color: 'white' }}
                  >
                    ابدأ الجلسة الآن
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
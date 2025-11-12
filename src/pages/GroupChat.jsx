import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Send, Paperclip, Megaphone, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatInterface from "../components/chat/ChatInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GroupChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const groups = await base44.entities.StudyGroup.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['groupEnrollments', groupId],
    queryFn: () => base44.entities.Enrollment.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const sendAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      // Send announcement message
      await base44.entities.ChatMessage.create(data);
      
      // Create notifications for all students
      const studentEmails = enrollments.map(e => e.student_email);
      await Promise.all(studentEmails.map(email => 
        base44.entities.Notification.create({
          user_email: email,
          title: "إعلان جديد",
          message: `إعلان جديد في ${group?.name}`,
          type: "announcement",
          link: createPageUrl("GroupChat") + `?id=${groupId}`,
          is_read: false
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      setShowAnnouncementDialog(false);
      setAnnouncementText("");
      setFileUrl("");
      setFileName("");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(result.file_url);
    setFileName(file.name);
    setUploadingFile(false);
  };

  const handleSendAnnouncement = () => {
    if (!announcementText.trim() && !fileUrl) return;

    sendAnnouncementMutation.mutate({
      sender_email: user?.email,
      group_id: groupId,
      message: announcementText || `تم مشاركة ملف: ${fileName}`,
      message_type: fileUrl ? "file" : "announcement",
      file_url: fileUrl,
      file_name: fileName,
      is_read: false
    });
  };

  const isTeacher = group?.teacher_email === user?.email;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl(isTeacher ? "TeacherGroups" : "StudentDashboard"))}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة
        </Button>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Group Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">{group?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">المادة</p>
                  <Badge variant="secondary">{group?.subject}</Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">المرحلة</p>
                  <Badge variant="secondary">{group?.stage}</Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    الطلاب
                  </p>
                  <p className="font-semibold">
                    {enrollments.length} / {group?.max_students}
                  </p>
                </div>

                {isTeacher && (
                  <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Megaphone className="w-4 h-4 ml-2" />
                        إرسال إعلان
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إرسال إعلان للمجموعة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>نص الإعلان</Label>
                          <Textarea
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            placeholder="اكتب الإعلان هنا..."
                            rows={4}
                          />
                        </div>

                        <div>
                          <Label>إرفاق ملف (اختياري)</Label>
                          <Input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                            className="mt-2"
                          />
                          {uploadingFile && (
                            <p className="text-xs text-gray-600 mt-1">جاري رفع الملف...</p>
                          )}
                          {fileUrl && (
                            <p className="text-xs text-green-600 mt-1">تم رفع: {fileName}</p>
                          )}
                        </div>

                        <Button 
                          onClick={handleSendAnnouncement}
                          disabled={(!announcementText.trim() && !fileUrl) || sendAnnouncementMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {sendAnnouncementMutation.isPending ? "جاري الإرسال..." : "إرسال الإعلان"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface groupId={groupId} />
          </div>
        </div>
      </div>
    </div>
  );
}
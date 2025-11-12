import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentAssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['studentEnrollments', user?.email],
    queryFn: () => base44.entities.Enrollment.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      if (!user?.email) return [];
      const groupIds = enrollments.map(e => e.group_id);
      if (groupIds.length === 0) return [];
      
      const allAssignments = await base44.entities.Assignment.list('-created_date');
      return allAssignments.filter(a => groupIds.includes(a.group_id));
    },
    enabled: !!user?.email && enrollments.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['studentSubmissions', user?.email],
    queryFn: () => base44.entities.AssignmentSubmission.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['allGroups'],
    queryFn: () => base44.entities.StudyGroup.list(),
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.AssignmentSubmission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentSubmissions']);
      setShowSubmitDialog(false);
      setSelectedAssignment(null);
      setSubmissionText("");
      setFileUrl("");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(result.file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setUploadingFile(false);
  };

  const handleSubmit = () => {
    if (!selectedAssignment) return;

    submitAssignmentMutation.mutate({
      assignment_id: selectedAssignment.id,
      student_email: user?.email,
      submission_text: submissionText,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
      status: "submitted"
    });
  };

  const pendingAssignments = assignments.filter(a => 
    !submissions.some(s => s.assignment_id === a.id)
  );

  const submittedAssignments = assignments.filter(a =>
    submissions.some(s => s.assignment_id === a.id)
  );

  const AssignmentCard = ({ assignment, submission }) => {
    const group = groups.find(g => g.id === assignment.group_id);
    const daysLeft = assignment.due_date 
      ? Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{assignment.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{group?.name}</p>
            </div>
            {submission ? (
              <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                {submission.status === 'graded' ? 'مقيّم' : submission.status === 'late' ? 'متأخر' : 'مسلّم'}
              </Badge>
            ) : daysLeft !== null && (
              <Badge variant={daysLeft < 3 ? "destructive" : "secondary"}>
                <Clock className="w-3 h-3 ml-1" />
                {daysLeft > 0 ? `${daysLeft} يوم` : 'متأخر'}
              </Badge>
            )}
          </div>

          <p className="text-gray-700 mb-4">{assignment.description}</p>

          <div className="space-y-2 mb-4">
            {assignment.due_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>موعد التسليم: {format(new Date(assignment.due_date), 'dd MMMM yyyy', { locale: ar })}</span>
              </div>
            )}

            {assignment.max_score && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4" />
                <span>الدرجة القصوى: {assignment.max_score}</span>
              </div>
            )}

            {assignment.file_url && (
              <div className="flex items-center gap-2 text-sm">
                <a 
                  href={assignment.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  تحميل ملف الواجب
                </a>
              </div>
            )}
          </div>

          {submission ? (
            <div className="pt-4 border-t space-y-3">
              {submission.status === 'graded' && submission.score !== null && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">درجتك</span>
                  <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                    {submission.score}/{assignment.max_score || 100}
                  </Badge>
                </div>
              )}

              {submission.feedback && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">ملاحظات المعلم:</p>
                  <p className="text-sm text-gray-700">{submission.feedback}</p>
                </div>
              )}

              {submission.file_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 ml-2" />
                    عرض إجابتي
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <Button 
              onClick={() => {
                setSelectedAssignment(assignment);
                setShowSubmitDialog(true);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 ml-2" />
              تسليم الواجب
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الواجبات والموارد</h1>
          <p className="text-gray-600">اطلع على واجباتك وسلمها في الموعد المحدد</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              معلقة ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              مسلّمة ({submittedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingAssignments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-20 h-20 text-green-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">رائع!</h3>
                  <p className="text-gray-600">لا توجد واجبات معلقة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted">
            {submittedAssignments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد واجبات مسلّمة</h3>
                  <p className="text-gray-600">ابدأ بتسليم واجباتك المعلقة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {submittedAssignments.map((assignment) => {
                  const submission = submissions.find(s => s.assignment_id === assignment.id);
                  return (
                    <AssignmentCard 
                      key={assignment.id} 
                      assignment={assignment} 
                      submission={submission}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">تسليم الواجب</DialogTitle>
            </DialogHeader>

            {selectedAssignment && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedAssignment.title}</h3>
                  <p className="text-gray-600">{selectedAssignment.description}</p>
                </div>

                <div>
                  <Label>الإجابة النصية</Label>
                  <Textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>إرفاق ملف (اختياري)</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="mb-2"
                    />
                    {uploadingFile && (
                      <p className="text-sm text-gray-600">جاري رفع الملف...</p>
                    )}
                    {fileUrl && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        تم رفع الملف بنجاح
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSubmitDialog(false);
                      setSelectedAssignment(null);
                      setSubmissionText("");
                      setFileUrl("");
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={(!submissionText.trim() && !fileUrl) || submitAssignmentMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitAssignmentMutation.isPending ? "جاري التسليم..." : "تسليم الواجب"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
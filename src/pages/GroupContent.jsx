import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/components/SupabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Upload, Trash2, Tag, Loader2, Link as LinkIcon, Video, File, Download, Folder, Search, Filter } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function GroupContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "file",
    file_url: "",
    importance: "essential",
    folder: "عام",
    tags: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => supabase.auth.getCurrentUserWithProfile(),
  });

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data } = await supabase.from('study_groups').select('*').eq('id', groupId).single();
      return data;
    },
    enabled: !!groupId
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['groupMaterials', groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_materials')
        .select('*')
        .eq('group_id', groupId)
        .order('order', { ascending: true });
      return data || [];
    },
    enabled: !!groupId
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (newMaterial) => {
      const tagsArray = newMaterial.tags ? newMaterial.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from('study_materials').insert({
        ...newMaterial,
        tags: tagsArray,
        group_id: groupId,
        teacher_email: user.email
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMaterials', groupId]);
      setIsUploadOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "file",
        file_url: "",
        importance: "essential",
        folder: "عام",
        tags: ""
      });
      toast.success("تم إضافة المحتوى بنجاح");
    },
    onError: (err) => toast.error("حدث خطأ: " + err.message)
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('study_materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMaterials', groupId]);
      toast.success("تم حذف المحتوى");
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-purple-500" />;
      default: return <File className="w-5 h-5 text-orange-500" />;
    }
  };

  // Compute unique folders and tags
  const uniqueFolders = ['all', ...new Set(materials.map(m => m.folder || 'عام'))];
  const uniqueTags = ['all', ...new Set(materials.flatMap(m => m.tags || []))];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (m.folder || 'عام') === selectedFolder;
    const matchesTag = selectedTag === 'all' || (m.tags && m.tags.includes(selectedTag));
    
    return matchesSearch && matchesFolder && matchesTag;
  });

  // Group filtered materials by folder if viewing 'all' folders, otherwise just list
  const materialsByFolder = selectedFolder === 'all' 
    ? filteredMaterials.reduce((acc, m) => {
        const folder = m.folder || 'عام';
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(m);
        return acc;
      }, {})
    : { [selectedFolder]: filteredMaterials };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-gray-100">
            <ArrowRight className="w-4 h-4 ml-2" />
            عودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المحتوى التعليمي</h1>
            <p className="text-gray-500 text-sm">{group?.name}</p>
          </div>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <Upload className="w-4 h-4 ml-2" />
              إضافة محتوى
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إضافة مادة تعليمية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>عنوان المادة</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="مثال: ملخص الفصل الأول"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المجلد</Label>
                  <div className="relative">
                    <Input 
                      value={formData.folder}
                      onChange={(e) => setFormData({...formData, folder: e.target.value})}
                      placeholder="اسم المجلد..."
                      list="folders-list"
                    />
                    <datalist id="folders-list">
                      {uniqueFolders.filter(f => f !== 'all').map(f => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">ملف (PDF/Doc)</SelectItem>
                      <SelectItem value="video">فيديو</SelectItem>
                      <SelectItem value="link">رابط خارجي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الرابط</Label>
                <Input 
                  value={formData.file_url}
                  onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="مهم, مراجعة, فيزياء..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف مختصر للمحتوى..."
                />
              </div>

              <div className="space-y-2">
                <Label>الأهمية</Label>
                <Select value={formData.importance} onValueChange={(v) => setFormData({...formData, importance: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">ضروري</SelectItem>
                    <SelectItem value="optional">إثرائي/اختياري</SelectItem>
                    <SelectItem value="review">مراجعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => createMaterialMutation.mutate(formData)}
                disabled={!formData.title || !formData.file_url || createMaterialMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createMaterialMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "حفظ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="بحث في المواد..." 
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
               <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[180px]">
                  <Folder className="w-4 h-4 ml-2 text-gray-500" />
                  <SelectValue placeholder="المجلد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المجلدات</SelectItem>
                  {uniqueFolders.filter(f => f !== 'all').map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[180px]">
                  <Tag className="w-4 h-4 ml-2 text-gray-500" />
                  <SelectValue placeholder="الوسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الوسوم</SelectItem>
                  {uniqueTags.filter(t => t !== 'all').map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-500">جاري التحميل...</p>
          </div>
        ) : Object.keys(materialsByFolder).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد محتوى يطابق بحثك</p>
          </div>
        ) : (
          Object.entries(materialsByFolder).map(([folderName, folderMaterials]) => (
            folderMaterials.length > 0 && (
              <div key={folderName} className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-bold text-lg px-1">
                  <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {folderName}
                  <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {folderMaterials.length}
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {folderMaterials.map((material) => (
                    <Card key={material.id} className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: material.importance === 'essential' ? '#ef4444' : '#3b82f6' }}>
                      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg shrink-0">
                          {getIcon(material.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">{material.title}</h3>
                            {material.importance === 'essential' && (
                              <Badge variant="destructive" className="text-xs px-1.5 h-5">مهم</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">{material.description}</p>
                          
                          {material.tags && material.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {material.tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                  <Tag className="w-3 h-3 ml-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0">
                          <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none">
                            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 ml-2" />
                              تحميل
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من الحذف؟")) deleteMaterialMutation.mutate(material.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
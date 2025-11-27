
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Filter,
  MapPin,
  Star,
  Users,
  Video,
  Home as HomeIcon,
  DollarSign,
  Search,
  Book,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = ["السعودية", "الإمارات", "مصر", "الأردن", "الكويت", "قطر", "البحرين", "عمان", "العراق", "سوريا", "لبنان", "فلسطين"];

const REGIONS_BY_COUNTRY = {
  "السعودية": ["الرياض", "مكة المكرمة", "المدينة المنورة", "الشرقية", "عسير", "تبوك", "القصيم", "حائل", "جازان", "نجران", "الباحة", "الجوف", "الحدود الشمالية"],
  "الإمارات": ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"],
  "مصر": ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "القليوبية", "البحيرة", "الغربية", "المنوفية", "كفر الشيخ"],
  "الأردن": ["عمان", "إربد", "الزرقاء", "العقبة", "الكرك", "معان", "المفرق", "جرش", "عجلون", "الطفيلة", "مأدبا", "البلقاء"],
  "الكويت": ["العاصمة", "حولي", "الفروانية", "مبارك الكبير", "الأحمدي", "الجهراء"]
};

const AREAS_BY_REGION = {
  "الرياض": ["العليا", "الملقا", "النخيل", "الورود", "الربوة", "السليمانية", "الملز", "الياسمين", "النرجس"],
  "مكة المكرمة": ["العزيزية", "الشرائع", "النزهة", "المنصور", "العوالي", "الزاهر"],
  "دبي": ["البرشاء", "جميرا", "الخليج التجاري", "مارينا", "الصفوح", "الممزر"],
  "أبوظبي": ["الخالدية", "المرور", "النادي السياحي", "المشرف", "الزاهية"],
  "القاهرة": ["مدينة نصر", "المعادي", "مصر الجديدة", "الزمالك", "المهندسين", "العباسية"],
  "عمان": ["الدوار الأول", "الدوار الثاني", "الدوار الثالث", "الدوار الرابع", "الدوار الخامس", "الدوار السادس", "الدوار السابع", "الدوار الثامن"],
  "العاصمة": ["الكويت", "الشرق", "المرقاب", "دسمان", "الصوابر", "الدعية"],
  "حولي": ["حولي", "السالمية", "الجابرية", "الرميثية", "بيان", "مشرف", "سلوى"],
  "الفروانية": ["الفروانية", "جليب الشيوخ", "العمرية", "الرابية", "الأندلس", "إشبيلية"],
  "مبارك الكبير": ["صباح السالم", "القرين", "أبو فطيرة", "المسيلة", "العدان", "القصور"],
  "الأحمدي": ["الأحمدي", "الفحيحيل", "المنقف", "الفنطاس", "المهبولة", "الرقة"],
  "الجهراء": ["الجهراء", "القيروان", "النعيم", "الصليبية", "تيماء", "العيون"]
};

const STAGES = ["روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي"];
const SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية", "تاريخ", "جغرافيا", "حاسوب"];
const CURRICULUMS = ["سعودي", "إماراتي", "كويتي", "مصري", "أمريكي", "بريطاني", "IB"];

export default function BrowsePage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type') || 'online';
  
  const [filters, setFilters] = useState({
    type: typeParam,
    country: "",
    region: "",
    area: "",
    stage: "",
    subject: "",
    curriculum: "",
    searchText: "",
    minPrice: "",
    maxPrice: "",
    minRating: ""
  });

  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  useEffect(() => {
    if (filters.country && REGIONS_BY_COUNTRY[filters.country]) {
      setAvailableRegions(REGIONS_BY_COUNTRY[filters.country]);
    } else {
      setAvailableRegions([]);
    }
    setFilters(prev => ({...prev, region: "", area: ""}));
  }, [filters.country]);

  useEffect(() => {
    if (filters.region && AREAS_BY_REGION[filters.region]) {
      setAvailableAreas(AREAS_BY_REGION[filters.region]);
    } else {
      setAvailableAreas([]);
    }
    setFilters(prev => ({...prev, area: ""}));
  }, [filters.region]);

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.TeacherProfile.filter({ is_approved: true }),
  });

  const { data: centers = [], isLoading: loadingCenters } = useQuery({
    queryKey: ['centers'],
    queryFn: () => base44.entities.EducationalCenter.filter({ is_approved: true }),
  });

  const fuzzyMatch = (text, search) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(searchLower)) return true;
    
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  };

  const getFilteredData = () => {
    if (filters.type === 'center') {
      return centers.filter(center => {
        if (filters.country && center.country !== filters.country) return false;
        if (filters.region && center.city !== filters.region) return false;
        if (filters.area && center.area !== filters.area) return false;
        if (filters.stage && !center.stages?.includes(filters.stage)) return false;
        if (filters.subject && !center.subjects?.includes(filters.subject)) return false;
        if (filters.curriculum && !center.curriculum?.includes(filters.curriculum)) return false;
        if (filters.searchText && !fuzzyMatch(center.name, filters.searchText)) return false;
        if (filters.minPrice && center.price_per_month < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && center.price_per_month > parseFloat(filters.maxPrice)) return false;
        if (filters.minRating && center.rating < parseFloat(filters.minRating)) return false;
        return true;
      });
    } else {
      return teachers.filter(teacher => {
        if (filters.type === 'online' && !teacher.teaching_type?.includes('online')) return false;
        if (filters.type === 'home' && !teacher.teaching_type?.includes('home')) return false;
        if (filters.country && teacher.country !== filters.country) return false;
        if (filters.region && teacher.city !== filters.region) return false;
        if (filters.area && teacher.area !== filters.area) return false;
        if (filters.stage && !teacher.stages?.includes(filters.stage)) return false;
        if (filters.subject && !teacher.subjects?.includes(filters.subject)) return false;
        if (filters.curriculum && !teacher.curriculum?.includes(filters.curriculum)) return false;
        if (filters.searchText && !fuzzyMatch(teacher.name, filters.searchText)) return false;
        if (filters.minPrice && teacher.hourly_rate < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && teacher.hourly_rate > parseFloat(filters.maxPrice)) return false;
        if (filters.minRating && teacher.rating < parseFloat(filters.minRating)) return false;
        return true;
      });
    }
  };

  const filteredData = getFilteredData();
  const isLoading = filters.type === 'center' ? loadingCenters : loadingTeachers;

  const getTypeTitle = () => {
    if (filters.type === 'online') return 'المدرسون عبر الإنترنت';
    if (filters.type === 'home') return 'المدرسون المنازل';
    return 'المراكز التعليمية';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            {getTypeTitle()}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            اختر المعلم أو المركز المناسب لك من بين {filteredData.length} خيار
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex gap-2 md:gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'online', label: 'أونلاين', icon: Video, color: 'blue' },
            { id: 'home', label: 'منزلي', icon: HomeIcon, color: 'green' },
            { id: 'center', label: 'مركز', icon: GraduationCap, color: 'orange' }
          ].map(type => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={filters.type === type.id ? "default" : "outline"}
                onClick={() => setFilters({...filters, type: type.id})}
                className={`flex-shrink-0 text-sm ${filters.type === type.id ? `bg-${type.color}-600 hover:bg-${type.color}-700` : ''}`}
              >
                <Icon className="w-4 h-4 ml-1 md:ml-2" />
                {type.label}
              </Button>
            );
          })}
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-6 md:mb-8 border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <h3 className="font-semibold text-base md:text-lg">البحث والتصفية</h3>
            </div>

            <div className="space-y-3 md:space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث بالاسم..."
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  className="pr-10"
                />
              </div>

              {/* Row 1: Country & Curriculum (Mobile: side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.country} onValueChange={(value) => setFilters({...filters, country: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.curriculum} onValueChange={(value) => setFilters({...filters, curriculum: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="المنهج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    {CURRICULUMS.map(curriculum => (
                      <SelectItem key={curriculum} value={curriculum}>{curriculum}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Region & Area (if available) */}
              {availableRegions.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Select value={filters.region} onValueChange={(value) => setFilters({...filters, region: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>الكل</SelectItem>
                      {availableRegions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {availableAreas.length > 0 && (
                    <Select value={filters.area} onValueChange={(value) => setFilters({...filters, area: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>الكل</SelectItem>
                        {availableAreas.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Row 3: Stage & Subject */}
              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.stage} onValueChange={(value) => setFilters({...filters, stage: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    {STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.subject} onValueChange={(value) => setFilters({...filters, subject: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 4: Price & Rating */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="السعر من"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="السعر إلى"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.minRating} onValueChange={(value) => setFilters({...filters, minRating: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="التقييم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    <SelectItem value="4">4+ نجوم</SelectItem>
                    <SelectItem value="4.5">4.5+ نجوم</SelectItem>
                    <SelectItem value="4.8">4.8+ نجوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filters.country || filters.region || filters.area || filters.stage || filters.subject || filters.curriculum || filters.searchText || filters.minPrice || filters.maxPrice || filters.minRating) && (
              <Button
                variant="ghost"
                onClick={() => setFilters({...filters, country: "", region: "", area: "", stage: "", subject: "", curriculum: "", searchText: "", minPrice: "", maxPrice: "", minRating: ""})}
                className="mt-4 text-sm"
              >
                إزالة جميع الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لم يتم العثور على نتائج</h3>
              <p className="text-gray-600">جرب تغيير معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-4">
            {filteredData.map((item) => (
              <Card 
                key={item.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg cursor-pointer overflow-hidden"
                onClick={() => {
                  if (filters.type === 'center') {
                    navigate(createPageUrl("CenterDetails") + `?id=${item.id}`);
                  } else {
                    navigate(createPageUrl("TeacherDetails") + `?id=${item.id}`);
                  }
                }}
              >
                <div className="relative h-40 md:h-48 bg-gradient-to-br from-green-500 to-emerald-600 overflow-hidden">
                  {item.avatar_url || item.images?.[0] ? (
                    <img 
                      src={item.avatar_url || item.images?.[0]} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-5xl md:text-6xl font-bold text-white/30">
                        {item.name?.charAt(0)}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {item.rating > 0 && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-xs md:text-sm">{item.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {item.name}
                  </h3>

                  {item.bio && (
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                      {item.bio || item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    {(item.subjects || []).slice(0, 3).map((subject, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 text-xs">
                        <Book className="w-2.5 h-2.5 md:w-3 md:h-3 ml-1" />
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                    {item.country && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="truncate">{item.country} {item.city && `- ${item.city}`}</span>
                      </div>
                    )}

                    {item.total_students > 0 && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        {item.total_students} طالب
                      </div>
                    )}

                    {item.years_experience && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                        {item.years_experience} سنوات خبرة
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t">
                    <div className="flex items-center gap-1 md:gap-2">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      <span className="text-xl md:text-2xl font-bold text-gray-900">
                        {item.hourly_rate || item.price_per_month}
                      </span>
                      <span className="text-xs md:text-sm text-gray-600">
                        {filters.type === 'center' ? 'شهرياً' : 'ساعة'}
                      </span>
                    </div>

                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs md:text-sm">
                      التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

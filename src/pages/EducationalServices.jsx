import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileText,
  Search,
  Star,
  Clock,
  Award,
  Filter,
  CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SERVICE_TYPES = [
  { value: "research", label: "أبحاث علمية", icon: "📚" },
  { value: "presentation", label: "عروض تقديمية (PPT)", icon: "📊" },
  { value: "homework", label: "حل واجبات", icon: "✏️" },
  { value: "project", label: "مشاريع", icon: "🎯" },
  { value: "translation", label: "ترجمة", icon: "🌐" },
  { value: "tutoring", label: "دروس خصوصية", icon: "👨‍🏫" },
  { value: "other", label: "أخرى", icon: "📋" }
];

const SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية", "تاريخ", "جغرافيا", "حاسوب"];

export default function EducationalServicesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: "",
    subject: "",
    searchText: "",
    minPrice: "",
    maxPrice: "",
    maxDelivery: "",
    minRating: ""
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['educationalServices'],
    queryFn: () => base44.entities.EducationalService.filter({ is_approved: true, is_active: true }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'KWD': 'د.ك',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€'
    };
    return symbols[currency] || 'د.ك';
  };

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

  const filteredServices = services.filter(service => {
    if (filters.type && service.service_type !== filters.type) return false;
    if (filters.subject && !service.subjects?.includes(filters.subject)) return false;
    if (filters.searchText && !fuzzyMatch(service.title, filters.searchText) && !fuzzyMatch(service.description || '', filters.searchText)) return false;
    if (filters.minPrice && service.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && service.price > parseFloat(filters.maxPrice)) return false;
    if (filters.maxDelivery && service.delivery_days > parseInt(filters.maxDelivery)) return false;
    if (filters.minRating && service.rating < parseFloat(filters.minRating)) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            الخدمات التعليمية
          </h1>
          <p className="text-gray-600">
            أبحاث، عروض تقديمية، حل واجبات ومشاريع من خبراء متخصصين - {filteredServices.length} خدمة متاحة
          </p>
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-lg">البحث والتصفية المتقدمة</h3>
            </div>

            <div className="space-y-4">
              {/* First Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="relative col-span-2 md:col-span-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="ابحث (بحث ذكي)..."
                    value={filters.searchText}
                    onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                    className="pr-10"
                  />
                </div>

                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>الكل</SelectItem>
                    {SERVICE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
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

              {/* Second Row - Advanced Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <Input
                  type="number"
                  placeholder="التسليم خلال (أيام)"
                  value={filters.maxDelivery}
                  onChange={(e) => setFilters({...filters, maxDelivery: e.target.value})}
                />
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

            {(filters.type || filters.subject || filters.searchText || filters.minPrice || filters.maxPrice || filters.maxDelivery || filters.minRating) && (
              <Button
                variant="ghost"
                onClick={() => setFilters({ type: "", subject: "", searchText: "", minPrice: "", maxPrice: "", maxDelivery: "", minRating: "" })}
                className="mt-4 text-sm"
              >
                إزالة جميع الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Services Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد خدمات متاحة</h3>
              <p className="text-gray-600">جرب تغيير معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.map((service) => {
              const provider = allUsers.find(u => u.email === service.provider_email);
              const serviceType = SERVICE_TYPES.find(t => t.value === service.service_type);
              
              return (
                <Card 
                  key={service.id} 
                  className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg cursor-pointer overflow-hidden"
                  onClick={() => navigate(createPageUrl("ServiceDetails") + `?id=${service.id}`)}
                >
                  <div className="relative h-32 md:h-48 bg-gradient-to-br from-purple-500 to-pink-600">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl md:text-7xl">{serviceType?.icon}</span>
                    </div>
                    {service.rating > 0 && (
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5">
                        <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-xs md:text-sm">{service.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 md:p-6">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {serviceType?.label}
                    </Badge>
                    
                    <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {service.title}
                    </h3>

                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 hidden md:block">
                      {service.description}
                    </p>

                    <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>التسليم: {service.delivery_days} أيام</span>
                      </div>

                      {service.total_orders > 0 && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          <span>{service.total_orders} طلب مكتمل</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-xl md:text-2xl font-bold text-gray-900">
                          {service.price}
                        </span>
                        <span className="text-xs md:text-sm text-gray-600">
                          {getCurrencySymbol(service.currency)}
                        </span>
                      </div>

                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm">
                        اطلب الآن
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
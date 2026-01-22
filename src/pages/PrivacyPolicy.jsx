import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "سياسة الخصوصية - Privacy Policy | أستاذي";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm hover:bg-green-600 hover:text-white transition-all"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          عودة
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            سياسة الخصوصية
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Privacy Policy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">
            آخر تحديث: 21 يناير 2026 | Last Updated: January 21, 2026
          </p>
        </div>

        {/* Arabic Content */}
        <Card className="mb-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300" dir="rtl">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
              سياسة الخصوصية (العربية)
            </h3>
            
            <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  1. مقدمة
                </h4>
                <p>
                  نحن في منصة "أستاذي" نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحماية معلوماتك عند استخدام خدماتنا التعليمية.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  2. البيانات التي نجمعها
                </h4>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>معلومات الحساب: الاسم، البريد الإلكتروني، كلمة المرور</li>
                  <li>معلومات الملف الشخصي: الصورة الشخصية، السيرة الذاتية، المؤهلات</li>
                  <li>بيانات الاستخدام: سجل الحصص، التفاعلات، التقييمات</li>
                  <li>معلومات الدفع: تفاصيل المعاملات المالية (مشفرة)</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  3. كيفية استخدام البيانات
                </h4>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>توفير وتحسين خدماتنا التعليمية</li>
                  <li>التواصل معك بخصوص حسابك وخدماتنا</li>
                  <li>معالجة المدفوعات والمعاملات المالية</li>
                  <li>تحليل وتحسين تجربة المستخدم</li>
                  <li>ضمان أمان المنصة ومنع الاحتيال</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  4. حماية البيانات
                </h4>
                <p>
                  نستخدم تقنيات التشفير المتقدمة وإجراءات الأمان لحماية بياناتك من الوصول غير المصرح به. يتم تخزين جميع البيانات الحساسة بشكل مشفر على خوادم آمنة.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  5. مشاركة البيانات
                </h4>
                <p>
                  لا نقومببيع أو مشاركة بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية. قد نشارك البيانات فقط في الحالات التالية:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4 mt-2">
                  <li>مع موافقتك الصريحة</li>
                  <li>لتقديم الخدمات التي طلبتها</li>
                  <li>للامتثال للقوانين واللوائح</li>
                  <li>لحماية حقوقنا وسلامة مستخدمينا</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  6. حقوقك
                </h4>
                <p>
                  لديك الحق في:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4 mt-2">
                  <li>الوصول إلى بياناتك الشخصية</li>
                  <li>تصحيح أو تحديث معلوماتك</li>
                  <li>حذف حسابك وبياناتك</li>
                  <li>الاعتراض على معالجة بياناتك</li>
                  <li>طلب نقل بياناتك</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  7. ملفات تعريف الارتباط (Cookies)
                </h4>
                <p>
                  نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتذكر تفضيلاتك. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  8. التواصل معنا
                </h4>
                <p>
                  إذا كان لديك أي أسئلة حول سياسة الخصوصية أو ممارساتنا، يرجى التواصل معنا عبر البريد الإلكتروني أو من خلال المنصة.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* English Content */}
        <Card className="mb-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl transition-colors duration-300" dir="ltr">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
              Privacy Policy (English)
            </h3>
            
            <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  1. Introduction
                </h4>
                <p>
                  At "Ostathi" platform, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information when using our educational services.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  2. Data We Collect
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account Information: Name, email, password</li>
                  <li>Profile Information: Profile picture, bio, qualifications</li>
                  <li>Usage Data: Session history, interactions, ratings</li>
                  <li>Payment Information: Financial transaction details (encrypted)</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  3. How We Use Your Data
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve our educational services</li>
                  <li>Communicate with you about your account and services</li>
                  <li>Process payments and financial transactions</li>
                  <li>Analyze and enhance user experience</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  4. Data Protection
                </h4>
                <p>
                  We use advanced encryption technologies and security measures to protect your data from unauthorized access. All sensitive data is stored encrypted on secure servers.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  5. Data Sharing
                </h4>
                <p>
                  We do not sell or share your personal data with third parties for marketing purposes. We may only share data in the following cases:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>With your explicit consent</li>
                  <li>To provide services you requested</li>
                  <li>To comply with laws and regulations</li>
                  <li>To protect our rights and user safety</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  6. Your Rights
                </h4>
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>Access your personal data</li>
                  <li>Correct or update your information</li>
                  <li>Delete your account and data</li>
                  <li>Object to data processing</li>
                  <li>Request data portability</li>
                </ul>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  7. Cookies
                </h4>
                <p>
                  We use cookies to improve your experience and remember your preferences. You can control cookie settings through your browser.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  8. Contact Us
                </h4>
                <p>
                  If you have any questions about this Privacy Policy or our practices, please contact us via email or through the platform.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Button */}
        <div className="text-center">
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all shadow-lg"
          >
            العودة للرئيسية | Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
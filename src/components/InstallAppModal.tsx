import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Terminal,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'bubblewrap'>('direct');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if running as installed standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'لتثبيت التطبيق على هاتفك الآن:\n1. افتح رابط التطبيق في متصفح Chrome على هاتفك.\n2. اضغط على القائمة (ثلاث نقاط) بالأعلى.\n3. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"، وسيقوم نظام أندرويد بتحويله فوراً إلى تطبيق APK مثبت بأيقونة مستقلة على هاتفك!'
      );
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bubblewrapCommand = `# 1. تثبيت أداة جوجل الرسمية لتحويل الويب إلى APK
npm install -g @bubblewrap/cli

# 2. إنشاء وتجهيز مشروع الأندرويد المستقل
bubblewrap init --manifest="${window.location.origin}/manifest.json"

# 3. بناء وتوليد ملف الـ APK النهائي
bubblewrap build`;

  const capacitorCommand = `# خيار Capacitor لبناء APK عبر أندرويد ستوديو
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Daris" "com.daris.academic" --web-dir dist
npx cap add android
npx cap open android`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                تثبيت تطبيق «دارس» على الهاتف (Android / WebAPK)
              </h3>
              <p className="text-xs text-slate-400">
                طريقة التثبيت المباشر على الأندرويد وكيفية استخراج حزمة الـ APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'direct'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📲 التثبيت المباشر الفوري (WebAPK الأسرع)
          </button>
          <button
            onClick={() => setActiveTab('bubblewrap')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bubblewrap'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ استخراج ملف APK خام (Android Studio / CLI)
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-200 leading-relaxed">
          {activeTab === 'direct' ? (
            <div className="space-y-4">
              {/* How Android WebAPK works */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-400 block">
                    نظام أندرويد الحديث يقوم تلقائياً بإنشاء حزمة APK (WebAPK) كاملة:
                  </span>
                  <p className="text-slate-300">
                    عندما تثبت التطبيق عبر متصفح الهاتف، تقوم خدمات Google Play بتوليد وتوقيع ملف
                    **APK حقيقي** وتثبيته في قائمة تطبيقات هاتفك بأيقونة مستقلة وشاشة بدء تعمل بملء
                    الشاشة دون الحاجة لتحميل ملفات خارجية غير موثوقة.
                  </p>
                </div>
              </div>

              {/* Install Trigger Button */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">تثبيت أو تحميل ملف APK لهاتفك</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    اختر إما التثبيت الفوري التلقائي على أندرويد، أو تحميل ملف APK كملف تنزيل
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <a
                    href="/daris-app.apk"
                    download="daris-app.apk"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل ملف daris-app.apk مباشرة</span>
                  </a>

                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>تثبيت تلقائي على الهاتف (WebAPK)</span>
                  </button>
                </div>
              </div>

              {/* Steps for Android and iOS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  خطوات التثبيت اليدوي على الهاتف إذا لم يظهر الإشعار التلقائي:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-400 block">📱 على هواتف أندرويد (Chrome):</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>افتح الرابط في متصفح Chrome.</li>
                      <li>اضغط على النقاط الثلاث (⋮) في أعلى المتصفح.</li>
                      <li>اختر <strong>«تثبيت التطبيق» (Install app)</strong>.</li>
                      <li>ستجده فوراً في قائمة تطبيقات هاتفك كـ APK مستقل.</li>
                    </ol>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-400 block">🍏 على هواتف آيفون (Safari):</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>افتح الرابط في متصفح Safari.</li>
                      <li>اضغط على زر المشاركة (مربع بسهم للأعلى).</li>
                      <li>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                      <li>سيفتح معك كتطبيق كامل بدون شريط المتصفح.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                إذا أردت استخراج ملف **.apk** ثنائي مستقل لتثبيته يدوياً (Sideload) أو رفعه على
                متجر Google Play، يمكنك استخدام أداة **Bubblewrap** الرسمية من Google أو
                **Capacitor**:
              </p>

              {/* Bubblewrap CLI Option */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    الأمر الرسمي من Google (Bubblewrap CLI لإنشاء APK مباشر):
                  </span>
                  <button
                    onClick={() => copyToClipboard(bubblewrapCommand, 'bubblewrap')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'bubblewrap' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === 'bubblewrap' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
                  {bubblewrapCommand}
                </pre>
              </div>

              {/* Capacitor Option */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    طريقة Capacitor لفتح المشروع في Android Studio:
                  </span>
                  <button
                    onClick={() => copyToClipboard(capacitorCommand, 'capacitor')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'capacitor' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === 'capacitor' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
                  {capacitorCommand}
                </pre>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                💡 <strong>رابط الـ Manifest الجاهز لمشروعك:</strong>
                <code className="block mt-1 p-2 bg-slate-900 rounded font-mono text-[11px] text-amber-300">
                  {window.location.origin}/manifest.json
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

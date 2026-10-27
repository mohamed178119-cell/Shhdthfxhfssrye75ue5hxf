import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject?: string;
  content: string;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  content,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">معاينة وتصدير كملف PDF</h3>
              <p className="text-xs text-slate-400">
                مذكرة دراسية منسقة بأعلى معايير الطباعة الأكاديمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Academic Document Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          <div
            id="printable-academic-sheet"
            className="max-w-3xl mx-auto bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl border border-slate-200"
            dir="rtl"
          >
            {/* Academic Sheet Top Bar */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-amber-600 block tracking-wider">
                  منصة دارس · المساعد الأكاديمي الصارم
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{title}</h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  المادة: {subject || 'دراسة عامة'} · وثيقة مذاكرة رسمية للاختبار
                </p>
              </div>

              <div className="text-left font-mono text-xs text-slate-600 space-y-0.5">
                <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>معتمد أكاديمياً</span>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
              {content}
            </div>

            {/* Academic Sheet Footer */}
            <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
              <span>تطبيق دارس · إتقان، انضباط، تفوق دراسي</span>
              <span className="font-mono">صفحة 1 من 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

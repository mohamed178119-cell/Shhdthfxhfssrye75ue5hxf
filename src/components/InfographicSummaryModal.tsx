import React, { useRef, useEffect, useState } from 'react';
import { InfographicData } from '../types';
import { X, Download, Sparkles, AlertTriangle, BookOpen, CheckCircle, Award } from 'lucide-react';

interface InfographicSummaryModalProps {
  data: InfographicData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InfographicSummaryModal: React.FC<InfographicSummaryModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !data || !canvasRef.current) return;
    drawInfographic(canvasRef.current, data);
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  // Draw high-resolution academic infographic on HTML5 Canvas
  const drawInfographic = (canvas: HTMLCanvasElement, info: InfographicData) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // Background: Deep academic navy gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090D16');
    bgGrad.addColorStop(0.5, '#0F172A');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative geometric grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer academic double border (Gold & Slate)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Header Badge: Daris Academic Stamp
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(width / 2 - 160, 48, 320, 36);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width / 2 - 160, 48, 320, 36);

    ctx.font = 'bold 16px "Tajawal", sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('دارس · بطاقة الخلاصة الأكاديمية الصارمة', width / 2, 72);

    // Title & Subject
    ctx.font = 'bold 38px "Tajawal", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(info.title || 'ملخص الدرس الأكاديمي', width / 2, 135);

    ctx.font = '18px "Tajawal", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`المادة: ${info.subject || 'دراسة عامة'} · وثيقة مراجعة للاختبارات النهائية`, width / 2, 168);

    // Divider
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.beginPath();
    ctx.moveTo(100, 190);
    ctx.lineTo(width - 100, 190);
    ctx.stroke();

    // Section 1: Three Core Concept Cards
    const cardY = 215;
    const cardWidth = 330;
    const cardHeight = 220;
    const startX = 60;
    const gap = 35;

    const concepts = info.keyConcepts?.slice(0, 3) || [];
    concepts.forEach((concept, idx) => {
      const cx = startX + idx * (cardWidth + gap);

      // Card Background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fillRect(cx, cardY, cardWidth, cardHeight);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cardY, cardWidth, cardHeight);

      // Card Header strip
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(cx, cardY, cardWidth, 42);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.beginPath();
      ctx.moveTo(cx, cardY + 42);
      ctx.lineTo(cx + cardWidth, cardY + 42);
      ctx.stroke();

      // Card Number & Title
      ctx.font = 'bold 18px "Tajawal", sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'right';
      ctx.fillText(`${idx + 1}. ${concept.label}`, cx + cardWidth - 18, cardY + 28);

      // Card Description (multiline wrapped text)
      ctx.font = '16px "Tajawal", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      wrapText(ctx, concept.desc, cx + cardWidth - 18, cardY + 70, cardWidth - 36, 26);
    });

    // Section 2: Golden Rules / Formulas Ribbon (Center Left)
    const ruleX = 60;
    const ruleY = 465;
    const ruleWidth = 515;
    const ruleHeight = 210;

    ctx.fillStyle = 'rgba(24, 32, 52, 0.85)';
    ctx.fillRect(ruleX, ruleY, ruleWidth, ruleHeight);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ruleX, ruleY, ruleWidth, ruleHeight);

    // Title
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'right';
    ctx.fillText('📐 القوانين والقواعد الذهبية الحاكمة', ruleX + ruleWidth - 20, ruleY + 36);

    const rules = info.goldenRules || [];
    rules.slice(0, 3).forEach((rule, rIdx) => {
      ctx.font = '16px "Tajawal", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      wrapText(ctx, `▪ ${rule}`, ruleX + ruleWidth - 20, ruleY + 75 + rIdx * 45, ruleWidth - 40, 24);
    });

    // Section 3: Exam Traps (Right Side)
    const trapX = 625;
    const trapY = 465;
    const trapWidth = 515;
    const trapHeight = 210;

    ctx.fillStyle = 'rgba(45, 18, 24, 0.7)';
    ctx.fillRect(trapX, trapY, trapWidth, trapHeight);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trapX, trapY, trapWidth, trapHeight);

    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillStyle = '#F87171';
    ctx.textAlign = 'right';
    ctx.fillText('⚠️ فخاخ امتحانية حاسمة احذر منها', trapX + trapWidth - 20, trapY + 36);

    const traps = info.examTraps || [];
    traps.slice(0, 3).forEach((trap, tIdx) => {
      ctx.font = '16px "Tajawal", sans-serif';
      ctx.fillStyle = '#FECACA';
      wrapText(ctx, `▲ ${trap}`, trapX + trapWidth - 20, trapY + 75 + tIdx * 45, trapWidth - 40, 24);
    });

    // Section 4: Strict Tutor Verdict (Bottom Bar)
    const verdictY = 705;
    const verdictWidth = width - 120;
    const verdictHeight = 120;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(60, verdictY, verdictWidth, verdictHeight);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(60, verdictY, verdictWidth, verdictHeight);

    ctx.font = 'bold 18px "Tajawal", sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'right';
    ctx.fillText('وصية الأستاذ الصارم لتحصيل الدرجة النهائية:', 60 + verdictWidth - 24, verdictY + 34);

    ctx.font = 'italic 17px "Tajawal", sans-serif';
    ctx.fillStyle = '#CBD5E1';
    wrapText(
      ctx,
      `"${info.tutorVerdict || 'لا عذر لمن قصر في الخطوات أو أهمل القوانين الأساسية. استعن بالله وركز حتى النصر.'}"`,
      60 + verdictWidth - 24,
      verdictY + 68,
      verdictWidth - 48,
      26
    );

    // Footer copyright / signature
    ctx.font = '13px "Tajawal", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText('أُنتجت هذه البطاقة آلياً بواسطة تطبيق دارس الأكاديمي الصارم · للامتحانات والمراجعة الفائقة', width / 2, 860);
  };

  // Helper to wrap text cleanly in Canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currY);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      const imageURL = canvasRef.current.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `بطاقة_درس_${data.title || 'ملخص_أكاديمي'}.png`;
      link.href = imageURL;
      link.click();
    } catch (e) {
      console.error('Error downloading canvas image', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                بطاقة الإنفوجرافيك الصورية للدرس
                <span className="text-xs font-normal text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  عالية الدقة 1200x900
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                صممها الأستاذ الصارم جاهزة للحفظ والمشاركة والمراجعة السريعة قبل الاختبار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadImage}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'جاري التنزيل...' : 'تحميل كصورة (PNG)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Canvas & Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Real High-Resolution Canvas Container */}
          <div className="w-full flex justify-center bg-slate-950 rounded-xl p-3 border border-slate-800 shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full max-w-4xl h-auto rounded-lg shadow-2xl border border-slate-800"
              style={{ maxHeight: '55vh', objectFit: 'contain' }}
            />
          </div>

          {/* Interactive Card Elements View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {data.keyConcepts?.map((concept, i) => (
              <div
                key={i}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>{concept.label}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{concept.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Golden Rules */}
            <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" />
                القوانين الذهبية للمسألة
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {data.goldenRules?.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">▪</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exam Traps */}
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                فخاخ امتحانية شائعة
              </h4>
              <ul className="space-y-1.5 text-xs text-red-200">
                {data.examTraps?.map((trap, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-400 font-bold">▲</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strict Tutor Verdict */}
          {data.tutorVerdict && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-400 block mb-0.5">
                  وصية الأستاذ الصارم:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{data.tutorVerdict}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatAttachment, InfographicData } from '../types';
import { askStrictTutor, fileToBase64, generateInfographicData, synthesizeAudioTrack } from '../services/api';
import {
  Send,
  Image as ImageIcon,
  FileText,
  Trash2,
  Sparkles,
  Printer,
  Volume2,
  VolumeX,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface StrictTutorViewProps {
  onOpenInfographic: (data: InfographicData) => void;
  onOpenPdfExport: (title: string, content: string) => void;
}

export const StrictTutorView: React.FC<StrictTutorViewProps> = ({
  onOpenInfographic,
  onOpenPdfExport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `أهلاً بك يا بني في محراب العلم. أنا الأستاذ "دارس"، معلمك الأكاديمي الصارم.
هنا لا مجال لإضاعة دقيقة واحدة في التوافه أو الأحاديث الجانبية. نحن هنا من أجل هدف واحد: **التفوق الدراسي، الفهم العميق، وحصد الدرجة الكاملة في امتحاناتك**.

ماذا يمكنك أن تقدم لي الآن؟
1. 📸 **صورة لمسألة معقدة أو ورقة امتحان** لأحلها لك خطوة بخطوة مع القوانين.
2. 📄 **ملف PDF لمذكرتك أو كتابك** لاستخراج الشرح والمفاهيم المحورية.
3. ❓ **أي سؤال دراسي في أي مادة** (رياضيات، فيزياء، كيمياء، أحياء، لغات، تاريخ، فلسفة...).
4. 🎨 في أي وقت، اطلب مني **"بطاقة ملخص صوري"** وسأصنع لك إنفوجرافيك بصري فائق الدقة قابل للتنزيل كصورة.

أين واجهتك الصعوبة اليوم؟ اطرح مسألتك ولنبدأ العمل!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'image',
            mimeType: file.type || 'image/jpeg',
            data: base64,
            previewUrl: URL.createObjectURL(file),
            sizeBytes: file.size,
          },
        ]);
      } catch (err) {
        console.error('Image read error', err);
      }
    }
    e.target.value = '';
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'pdf',
            mimeType: 'application/pdf',
            data: base64,
            sizeBytes: file.size,
          },
        ]);
      } catch (err) {
        console.error('PDF read error', err);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      attachments: [...attachments],
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      // Build history
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const reply = await askStrictTutor({
        message: textToSend,
        history,
        attachments: userMsg.attachments,
      });

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ تنبيه من الأستاذ: حدث انقطاع في الاتصال (${err.message || 'خطأ غير متوقع'}). أعد إرسال سؤالك وسنتابع فوراً.`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action: Generate Infographic from message
  const handleCreateInfographic = async (msg: ChatMessage) => {
    try {
      const info = await generateInfographicData('خلاصة الدرس الأكاديمي', msg.text);
      onOpenInfographic(info);
    } catch (e) {
      console.error(e);
      // Fallback local infographic structure if server fails
      onOpenInfographic({
        title: 'ملخص الدرس الأكاديمي',
        subject: 'مراجعة المنهج',
        keyConcepts: [
          { label: 'المفهوم الجوهري', desc: msg.text.slice(0, 140) },
          { label: 'خطوات الحل المنهجي', desc: 'الالتزام بالتسلسل الرياضي والوحدات الفيزيائية.' },
          { label: 'القوانين الحاكمة', desc: 'تطبيق المعادلة الأساسية بدقة متناهية.' },
        ],
        goldenRules: ['تأكد من كتابة القانون قبل التعويض بالمعطيات', 'احذر من نسيان تحويل الوحدات القياسية'],
        examTraps: ['عدم توحيد إشارات المتجهات', 'التسرع في الاختصار الرياضي قبل إتمام الجمع'],
        tutorVerdict: 'التركيز التام أثناء قراءة المسألة يوفر نصف وقت الحل.',
      });
    }
  };

  // Play audio narration for message
  const handleToggleVoice = async (msg: ChatMessage) => {
    if (playingMsgId === msg.id && activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
      setPlayingMsgId(null);
      return;
    }

    if (activeAudio) {
      activeAudio.pause();
    }

    setAudioLoadingId(msg.id);
    try {
      const cleanText = msg.text.replace(/[*#_`]/g, '').slice(0, 600);
      const res = await synthesizeAudioTrack(cleanText);
      if (res.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
        audio.onended = () => {
          setPlayingMsgId(null);
          setActiveAudio(null);
        };
        audio.play();
        setActiveAudio(audio);
        setPlayingMsgId(msg.id);
      }
    } catch (e) {
      console.error('Audio play error', e);
    } finally {
      setAudioLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-3 sm:p-6 gap-3">
      {/* Strict Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-white">نظام الانضباط الأكاديمي الصارم مفعّل:</span>
          <span className="hidden sm:inline text-slate-400">
            يرفض الدردشة الجانبية · حل المسائل بالخطوات الكاملة · دعم الصور وملفات الـ PDF
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-400/90 font-mono">
          <span>تركيز 100%</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            } animate-fade-in`}
          >
            <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400">
              <span className="font-bold text-slate-300">
                {msg.role === 'user' ? 'أنت (الطالب)' : 'الأستاذ دارس (المعلم الصارم)'}
              </span>
              <span>·</span>
              <span className="font-mono text-[11px]">{msg.timestamp}</span>
            </div>

            {/* Message Bubble */}
            <div
              className={`rounded-2xl p-4 sm:p-5 max-w-3xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-600/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
              }`}
            >
              {/* Attachments preview if user sent them */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/20">
                  {msg.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-black/30 rounded-lg p-2 text-xs text-white"
                    >
                      {att.type === 'image' && att.previewUrl ? (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-12 h-12 object-cover rounded border border-white/30"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-amber-300" />
                      )}
                      <div className="truncate max-w-[140px]">
                        <div className="font-semibold truncate">{att.name}</div>
                        <div className="text-[10px] text-white/70">
                          {att.type === 'image' ? 'صورة مسألة' : 'ملف PDF'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Text with Markdown formatting */}
              <div className="whitespace-pre-wrap font-sans text-sm sm:text-base selection:bg-amber-400 selection:text-slate-950">
                {msg.text}
              </div>

              {/* Model Actions Bar */}
              {msg.role === 'model' && msg.id !== 'welcome-1' && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => handleCreateInfographic(msg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد بطاقة إنفوجرافيك صوري</span>
                  </button>

                  <button
                    onClick={() =>
                      onOpenPdfExport('ملخص الدرس والحل النموذجي', msg.text)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>تصدير كـ PDF</span>
                  </button>

                  <button
                    onClick={() => handleToggleVoice(msg)}
                    disabled={audioLoadingId === msg.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {audioLoadingId === msg.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>جاري تحضير الصوت...</span>
                      </>
                    ) : playingMsgId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                        <span>إيقاف الصوت</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>استمع للشرح</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-md animate-pulse">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              دارس
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>الأستاذ يدرس مسألتك ويصيغ الحل النموذجي الصارم...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Academic Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          مقترحات سريعة:
        </span>
        <button
          onClick={() => handleSend('حل المسألة المرفقة مع ذكر القانون وخطوات الحل المفصلة')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
        >
          📐 حل المسألة بالقوانين والخطوات
        </button>
        <button
          onClick={() => handleSend('لخص هذا الدرس تلخيصاً مركزاً للاختبار القادم')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
        >
          📚 تلخيص شامل للاختبار
        </button>
        <button
          onClick={() => handleSend('ما هي أهم 3 أخطاء شائعة يقع فيها الطلاب في هذا الموضوع؟')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
        >
          ⚠️ فخاخ امتحانية شائعة
        </button>
      </div>

      {/* Attachments preview before sending */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
            >
              {att.type === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-10 h-10 object-cover rounded border border-slate-600"
                />
              ) : (
                <FileText className="w-5 h-5 text-amber-400" />
              )}
              <div className="max-w-[150px] truncate">
                <div className="font-semibold truncate">{att.name}</div>
                <div className="text-[10px] text-slate-400">
                  {att.type === 'image' ? 'صورة مسألة' : 'ملف PDF'}
                </div>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-end gap-2 shadow-lg">
        {/* Hidden inputs */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={pdfInputRef}
          onChange={handlePdfUpload}
          accept="application/pdf"
          className="hidden"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إرفاق صورة مسألة أو صفحة كتاب"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إرفاق ملف PDF أو ملخص"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="اطرح سؤالك الأكاديمي، أو أرسل صورة مسألتك لحلها فوراً..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none min-h-[40px] max-h-32 py-2 px-1 text-right"
        />

        <button
          onClick={() => handleSend()}
          disabled={loading || (!input.trim() && attachments.length === 0)}
          className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          title="إرسال السؤال للأستاذ"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { LectureRecord, InfographicData } from '../types';
import { transcribeAndSummarizeAudio, generateInfographicData } from '../services/api';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Sparkles,
  Printer,
  Copy,
  Check,
  FileAudio,
  Radio,
  BookOpen,
  FileText,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react';

interface LectureStudioViewProps {
  onOpenInfographic: (data: InfographicData) => void;
  onOpenPdfExport: (title: string, content: string) => void;
}

export const LectureStudioView: React.FC<LectureStudioViewProps> = ({
  onOpenInfographic,
  onOpenPdfExport,
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [topicHint, setTopicHint] = useState('');

  // Processing & Output state
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [currentResult, setCurrentResult] = useState<{
    transcript: string;
    summary: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Saved records
  const [savedLectures, setSavedLectures] = useState<LectureRecord[]>(() => {
    try {
      const stored = localStorage.getItem('daris_saved_lectures');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const playerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daris_saved_lectures', JSON.stringify(savedLectures));
    } catch (e) {
      console.error('Storage save error', e);
    }
  }, [savedLectures]);

  // Clean up timer and audio context on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  // Start live microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        setAudioUrl(URL.createObjectURL(fullBlob));
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      setUploadedFile(null);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // Start visualizer loop
      drawWaveform();
    } catch (err: any) {
      console.error('Microphone error', err);
      alert('تعذر الوصول إلى المايكروفون. يرجى التأكد من منح الإذن في المتصفح.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Real-time audio waveform visualizer
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(245, ${150 + i * 2}, 11)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setRecordSeconds(0);
    }
    e.target.value = '';
  };

  // Transcribe and Summarize with Gemini
  const handleTranscribeAndSummarize = async () => {
    const blobToProcess = audioBlob;
    if (!blobToProcess) {
      alert('يرجى تسجيل محاضرة أو رفع ملف صوتي أولاً.');
      return;
    }

    setProcessing(true);
    try {
      const mimeType = blobToProcess.type || 'audio/webm';
      const result = await transcribeAndSummarizeAudio(blobToProcess, mimeType, topicHint);
      setCurrentResult(result);
      setActiveTab('summary');

      // Add to saved lectures
      const newRecord: LectureRecord = {
        id: `lec-${Date.now()}`,
        title: topicHint.trim() || `محاضرة ${new Date().toLocaleDateString('ar-EG')}`,
        createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: recordSeconds || 120,
        transcript: result.transcript,
        summary: result.summary,
        audioBlobUrl: audioUrl || undefined,
      };

      setSavedLectures((prev) => [newRecord, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Processing error', err);
      alert(err.message || 'حدث خطأ أثناء معالجة المحاضرة.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopySummary = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateInfographic = async () => {
    if (!currentResult) return;
    try {
      const info = await generateInfographicData(
        topicHint || 'خلاصة المحاضرة الأكاديمية',
        currentResult.summary
      );
      onOpenInfographic(info);
    } catch {
      onOpenInfographic({
        title: topicHint || 'خلاصة المحاضرة الأكاديمية',
        subject: 'محاضرة مفرغة',
        keyConcepts: [
          { label: 'المحور الرئيسي', desc: currentResult.summary.slice(0, 120) },
          { label: 'الأفكار الجوهرية', desc: 'أهم النقاط التي ركز عليها الأستاذ أثناء الشرح.' },
          { label: 'الاستنتاجات', desc: 'تطبيق مباشر لحل المسائل واستيعاب المادة.' },
        ],
        goldenRules: ['احفظ المصطلحات بدقة', 'راجع الأسئلة المتوقعة بنهاية الملخص'],
        examTraps: ['عدم التفرقة بين التعريف النظري والتطبيق العملي'],
        tutorVerdict: 'التسجيل والاستماع والمراجعة المباشرة تضمن ثبات المعلومة في الذاكرة.',
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>استوديو المحاضرات الحية والملفات الصوتية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            تسجيل الحصص مباشر أو رفع ملفات صوتية للتلخيص الأكاديمي الصارم
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تفريغ فائق الدقة بواسطة الذكاء الاصطناعي مع استخراج القوانين، الأفكار الجوهرية، والأسئلة المتوقعة
          </p>
        </div>

        {/* Optional Topic Hint */}
        <div className="w-full md:w-72">
          <label className="text-[11px] text-slate-400 block mb-1">موضوع المحاضرة (اختياري للتركيز):</label>
          <input
            type="text"
            value={topicHint}
            onChange={(e) => setTopicHint(e.target.value)}
            placeholder="مثال: فيزياء الحركة الدائرية..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Recording & Upload Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Live Microphone Recording */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تسجيل الحصة مباشرة</h3>
                <span className="text-xs text-slate-400">سجل شرح المعلم في الفصل أو المحاضرة</span>
              </div>
            </div>

            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {formatTime(recordSeconds)}
            </div>
          </div>

          {/* Visualizer Canvas */}
          <div className="h-20 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-2">
            {isRecording ? (
              <canvas ref={canvasRef} width={300} height={70} className="w-full h-full" />
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>الموجات الصوتية الحية ستظهر هنا أثناء التسجيل</span>
              </div>
            )}
          </div>

          {/* Record Controls */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>بدء التسجيل المباشر</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-600 transition-all cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 text-red-400" />
                <span>إيقاف وحفظ التسجيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Audio File Upload */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">أو ارفع ملف صوتي مسجل</h3>
                <span className="text-xs text-slate-400">يدعم صيغ MP3, WAV, M4A, WebM</span>
              </div>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-20 border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/60 rounded-xl flex items-center justify-center cursor-pointer transition-colors p-3 text-center"
          >
            {uploadedFile ? (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <FileAudio className="w-4 h-4" />
                <span className="font-semibold truncate max-w-xs">{uploadedFile.name}</span>
                <span className="text-slate-400 text-[10px]">
                  ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-1">
                <div className="font-medium text-slate-300">اضغط لاختيار ملف صوتي من جهازك</div>
                <div className="text-[10px] text-slate-400">حتى 50 ميجابايت للمحاضرات الطويلة</div>
              </div>
            )}
          </div>

          {/* Audio Preview if available */}
          {audioUrl && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  if (playerAudioRef.current) {
                    if (isPlayingAudio) {
                      playerAudioRef.current.pause();
                      setIsPlayingAudio(false);
                    } else {
                      playerAudioRef.current.play();
                      setIsPlayingAudio(true);
                    }
                  }
                }}
                className="p-1.5 bg-amber-500 text-slate-950 rounded-lg cursor-pointer"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <audio
                ref={playerAudioRef}
                src={audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
              <span className="text-xs text-slate-300 truncate">
                {uploadedFile ? uploadedFile.name : `تسجيل صوتي (${formatTime(recordSeconds)})`}
              </span>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleTranscribeAndSummarize}
            disabled={!audioBlob || processing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تفريغ وتلخيص المحاضرة أكاديمياً...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ابدأ التفريغ والتلخيص الصارم الآن</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Workspace */}
      {currentResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          {/* Result Header & Tabs */}
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>التلخيص الأكاديمي الصارم</span>
              </button>

              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>النص المفرغ كاملاً</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateInfographic}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بطاقة إنفوجرافيك</span>
              </button>

              <button
                onClick={() =>
                  onOpenPdfExport(
                    topicHint || 'ملخص المحاضرة الأكاديمية',
                    currentResult.summary
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>تصدير PDF</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Content Box */}
          <div className="p-6">
            {activeTab === 'summary' ? (
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {currentResult.summary}
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {currentResult.transcript || 'لا يوجد نص مفرغ.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Lectures History */}
      {savedLectures.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              سجل المحاضرات الملخصة سابقاً
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {savedLectures.length} محاضرة محفوظة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedLectures.map((lec) => (
              <div
                key={lec.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{lec.title}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                    <span>{lec.createdAt}</span>
                    <span>·</span>
                    <span>{formatTime(lec.durationSeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => {
                      setCurrentResult({
                        transcript: lec.transcript,
                        summary: lec.summary,
                      });
                      setActiveTab('summary');
                    }}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    استعراض التلخيص
                  </button>

                  <button
                    onClick={() =>
                      setSavedLectures((prev) => prev.filter((item) => item.id !== lec.id))
                    }
                    className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

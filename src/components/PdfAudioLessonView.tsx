import React, { useState, useRef, useEffect } from 'react';
import { AudioLesson, AudioLessonTrack, InfographicData } from '../types';
import { preparePdfAudioLesson, generateInfographicData } from '../services/api';
import {
  FileText,
  Upload,
  Play,
  Pause,
  Download,
  Headphones,
  CheckCircle,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Loader2,
} from 'lucide-react';

interface PdfAudioLessonViewProps {
  onOpenInfographic: (data: InfographicData) => void;
  onOpenPdfExport: (title: string, content: string) => void;
}

export const PdfAudioLessonView: React.FC<PdfAudioLessonViewProps> = ({
  onOpenInfographic,
  onOpenPdfExport,
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lesson, setLesson] = useState<AudioLesson | null>(null);

  // Audio playback state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack: AudioLessonTrack | undefined = lesson?.tracks[currentTrackIndex];

  // Set up audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioBase64) return;

    audioRef.current.src = `data:audio/wav;base64,${currentTrack.audioBase64}`;
    audioRef.current.playbackRate = playbackSpeed;
    setCurrentTime(0);

    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, lesson]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleGenerateLesson = async () => {
    if (!pdfFile) {
      alert('يرجى اختيار ملف PDF أولاً.');
      return;
    }
    if (!topicTitle.trim()) {
      alert('يرجى تحديد عنوان الدرس أو الفصل المراد تجهيز الحصة عنه.');
      return;
    }

    setIsProcessing(true);
    try {
      const data = await preparePdfAudioLesson(pdfFile, topicTitle.trim());

      const newLesson: AudioLesson = {
        id: `lesson-${Date.now()}`,
        title: data.lessonTitle,
        subject: 'درس مستخرج من PDF',
        createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        tracks: data.tracks,
        pdfName: pdfFile.name,
      };

      setLesson(newLesson);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      console.error('Error generating audio lesson:', err);
      alert(err.message || 'فشل تجهيز الحصة الصوتية من ملف الـ PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleDownloadTrack = (track: AudioLessonTrack) => {
    if (!track.audioBase64) return;
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${track.audioBase64}`;
    link.download = `${lesson?.title || 'حصة'}_${track.title}.wav`;
    link.click();
  };

  const handleCreateInfographic = async () => {
    if (!lesson) return;
    const combinedScript = lesson.tracks.map((t) => `${t.title}:\n${t.script}`).join('\n\n');
    try {
      const info = await generateInfographicData(lesson.title, combinedScript);
      onOpenInfographic(info);
    } catch {
      onOpenInfographic({
        title: lesson.title,
        subject: 'حصة مستخرجة من الـ PDF',
        keyConcepts: lesson.tracks.map((t, idx) => ({
          label: t.title,
          desc: t.script.slice(0, 120),
        })),
        goldenRules: ['احرص على الاستماع للمحاور بترتيبها المنهجي'],
        examTraps: ['تجنب القفز إلى الخلاصة قبل استيعاب المفاهيم التأسيسية'],
        tutorVerdict: 'التكرار الصوتي يرسخ القوانين في الذهن أفضل من القراءة الصامتة.',
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hidden HTML Audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          if (lesson && currentTrackIndex < lesson.tracks.length - 1) {
            setCurrentTrackIndex((i) => i + 1);
          } else {
            setIsPlaying(false);
          }
        }}
      />

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <Headphones className="w-4 h-4" />
            <span>محول الـ PDF لحصص صوتية متكاملة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            حدد درساً من ملف الـ PDF وحوله إلى سلسلة مقاطع صوتية مسموعة وقابلة للتحميل
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يقسم الذكاء الاصطناعي الموضوع إلى محاور دراسية مترابطة ويسجلها بصوت أستاذ أكاديمي رصين
          </p>
        </div>
      </div>

      {/* PDF Input & Topic Selector Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* File Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              1. اختر ملف الـ PDF (كتاب، مذكرة، أو سلايدات المحاضرة):
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPdfFile(file);
                e.target.value = '';
              }}
              accept="application/pdf"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/60 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {pdfFile ? pdfFile.name : 'اضغط لاختيار ملف PDF'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {pdfFile
                      ? `${(pdfFile.size / 1024 / 1024).toFixed(1)} ميجابايت`
                      : 'يدعم جميع كتب وملازم المناهج'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                {pdfFile ? 'تغيير الملف' : 'تصفح'}
              </span>
            </div>
          </div>

          {/* Topic / Chapter Name */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              2. اكتب اسم الدرس أو الفصل المراد إعداده حصة صوتية:
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="مثال: الفصل الثالث: الكهرومغناطيسية وتطبيقاتها..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
              />
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
                <span>مقترحات شائعة:</span>
                <button
                  type="button"
                  onClick={() => setTopicTitle('مقدمة وتأسيس المفاهيم والقوانين')}
                  className="hover:text-amber-400 whitespace-nowrap"
                >
                  المفاهيم التأسيسية
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setTopicTitle('أهم المسائل والمسائل الحسابية')}
                  className="hover:text-amber-400 whitespace-nowrap"
                >
                  المسائل الحسابية
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setTopicTitle('مراجعة ليلة الامتحان والأسئلة الحرجة')}
                  className="hover:text-amber-400 whitespace-nowrap"
                >
                  مراجعة ليلة الامتحان
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerateLesson}
            disabled={!pdfFile || !topicTitle.trim() || isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري استخراج المنهج، كتابة السيناريو، وتوليد المقاطع الصوتية (WAV)...</span>
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                <span>إعداد الحصة الصوتية الآن</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Lecture Player & Tracks Playlist */}
      {lesson && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in space-y-0">
          {/* Lesson Title Bar */}
          <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-amber-400 tracking-wider block">
                حصة دراسية مسموعة جاهزة
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{lesson.title}</h3>
              <p className="text-xs text-slate-400">
                مستخرجة من ملف: {lesson.pdfName} · مقسمة إلى {lesson.tracks.length} محاور صوتية
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateInfographic}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بطاقة إنفوجرافيك للحصة</span>
              </button>

              <button
                onClick={() => {
                  const combined = lesson.tracks
                    .map((t) => `## ${t.title}\n${t.script}`)
                    .join('\n\n');
                  onOpenPdfExport(lesson.title, combined);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>تصدير PDF</span>
              </button>
            </div>
          </div>

          {/* Central Audio Player Console */}
          <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Currently Playing Track Label */}
              <div className="text-center space-y-1">
                <span className="text-xs text-amber-400 font-mono">
                  المحور {currentTrackIndex + 1} من {lesson.tracks.length}
                </span>
                <h4 className="text-base font-bold text-white">{currentTrack?.title}</h4>
              </div>

              {/* Progress Scrubber */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCurrentTime(val);
                    if (audioRef.current) audioRef.current.currentTime = val;
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration || 0)}</span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between pt-2">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px]">السرعة:</span>
                  {[1.0, 1.25, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded font-mono ${
                        playbackSpeed === spd
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Main transport buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentTrackIndex((i) => Math.max(0, i - 1))}
                    disabled={currentTrackIndex === 0}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="p-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 mr-0.5" />}
                  </button>

                  <button
                    onClick={() =>
                      setCurrentTrackIndex((i) => Math.min(lesson.tracks.length - 1, i + 1))
                    }
                    disabled={currentTrackIndex === lesson.tracks.length - 1}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Download Current Track Button */}
                {currentTrack && (
                  <button
                    onClick={() => handleDownloadTrack(currentTrack)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="تحميل المقطع الصوتي بصيغة WAV للاستماع دون اتصال"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل (WAV)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tracks Playlist & Synchronized Transcript */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
            {/* Playlist list */}
            <div className="p-4 space-y-2 bg-slate-950/40">
              <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-3">
                <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                محاور الحصة الصوتية:
              </h5>
              <div className="space-y-1.5">
                {lesson.tracks.map((trk, idx) => (
                  <div
                    key={trk.id}
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between text-xs ${
                      currentTrackIndex === idx
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
                        : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{trk.title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTrack(trk);
                      }}
                      className="p-1 hover:text-amber-300 text-slate-400"
                      title="تحميل هذا المقطع"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Script Text Reader */}
            <div className="col-span-2 p-6 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  النص الأكاديمي المنطوق للمحور الحالي:
                </span>
                <span className="text-[11px] text-slate-400">تابع القراءة أثناء الاستماع</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                {currentTrack?.script}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

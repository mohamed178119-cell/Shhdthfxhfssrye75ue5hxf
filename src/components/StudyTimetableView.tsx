import React, { useState, useEffect, useRef } from 'react';
import { StudyTask } from '../types';
import { academicAudio } from '../utils/audioAlert';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Award,
  Sparkles,
} from 'lucide-react';

interface StudyTimetableViewProps {
  onStartFocusSession?: (minutes: number) => void;
}

const DAYS_OF_WEEK: StudyTask['day'][] = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const StudyTimetableView: React.FC<StudyTimetableViewProps> = () => {
  // Saved tasks state
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    try {
      const stored = localStorage.getItem('daris_study_tasks');
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default seed schedule
    return [
      {
        id: '1',
        day: 'الأحد',
        subject: 'الفيزياء',
        topic: 'مراجعة قوانين الحركة وتطبيقات نيوتن',
        startTime: '16:00',
        durationMinutes: 50,
        completed: false,
      },
      {
        id: '2',
        day: 'الأحد',
        subject: 'الرياضيات',
        topic: 'حل 15 مسألة تفاضل وتكامل',
        startTime: '17:30',
        durationMinutes: 60,
        completed: false,
      },
      {
        id: '3',
        day: 'الإثنين',
        subject: 'الكيمياء',
        topic: 'الاتزان الكيميائي ومعادلات الأكسدة',
        startTime: '16:30',
        durationMinutes: 45,
        completed: false,
      },
      {
        id: '4',
        day: 'الثلاثاء',
        subject: 'اللغة الإنجليزية',
        topic: 'قراءة نص استيعابي وحفظ 25 مصطلحاً',
        startTime: '18:00',
        durationMinutes: 40,
        completed: true,
      },
    ];
  });

  const [selectedDay, setSelectedDay] = useState<StudyTask['day'] | 'الكل'>('الأحد');

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDay, setNewDay] = useState<StudyTask['day']>('الأحد');
  const [newTime, setNewTime] = useState('17:00');
  const [newDuration, setNewDuration] = useState(45);

  // Focus Timer State
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(50 * 60);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(50 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // Save tasks on changes
  useEffect(() => {
    try {
      localStorage.setItem('daris_study_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            academicAudio.playAlarmBell();
            if (timerMode === 'focus') {
              alert('🔔 انتهت جلسة المذاكرة المركزة بنجاح! حان وقت استراحة قصيرة.');
              setTimerMode('break');
              return 10 * 60;
            } else {
              alert('🔔 انتهت الاستراحة. استعد لجلسة المذاكرة التالية!');
              setTimerMode('focus');
              return 50 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode]);

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newTopic.trim()) return;

    const task: StudyTask = {
      id: `task-${Date.now()}`,
      day: newDay,
      subject: newSubject.trim(),
      topic: newTopic.trim(),
      startTime: newTime,
      durationMinutes: newDuration,
      completed: false,
    };

    setTasks((prev) => [...prev, task]);
    setNewSubject('');
    setNewTopic('');
    setShowAddModal(false);
  };

  const startTimerWithDuration = (mins: number, mode: 'focus' | 'break') => {
    setTimerMode(mode);
    setInitialTimerSeconds(mins * 60);
    setTimerSecondsLeft(mins * 60);
    setIsTimerRunning(true);
    academicAudio.playStartChime();
  };

  const toggleTimer = () => {
    if (!isTimerRunning) {
      academicAudio.playStartChime();
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(initialTimerSeconds);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter(
    (t) => selectedDay === 'الكل' || t.day === selectedDay
  );

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.completed ? t.durationMinutes : 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <Calendar className="w-4 h-4" />
            <span>تنظيم الجدول الزمني وتنبيهات المذاكرة الصارمة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            خطة دراسية منضبطة مع مؤقت تركيز وأجراس تنبيه واقعية
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            نظم جلسات المذاكرة لكل يوم، والتزم بمؤقت التركيز لمنع التشتت والوصول للعلامة الكاملة
          </p>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
          <div className="text-center">
            <div className="text-[10px] text-slate-400">الجلسات المنجزة</div>
            <div className="font-bold text-amber-400 font-mono text-sm tabular-nums">
              {completedCount} / {tasks.length}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] text-slate-400">دقائق الإنجاز</div>
            <div className="font-bold text-white font-mono text-sm tabular-nums">
              {totalMinutes} دقيقة
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Timer on Right, Schedule on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Timer Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>مؤقت المذاكرة والتركيز الأكاديمي</span>
            </div>
            <button
              onClick={() => academicAudio.playAlarmBell()}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="تجربة صوت جرس التنبيه"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>جرس التنبيه</span>
            </button>
          </div>

          {/* Central Countdown Clock */}
          <div className="text-center space-y-2 py-4">
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                timerMode === 'focus'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {timerMode === 'focus' ? '🎯 جلسة مذاكرة وتركيز مطلق' : '☕ استراحة ذهنية قصيرة'}
            </div>

            <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums">
              {formatTimer(timerSecondsLeft)}
            </div>

            <p className="text-xs text-slate-400">
              {isTimerRunning
                ? 'الجلسة قيد التشغيل.. لا تفتح أي مشتتات!'
                : 'اضغط على زر البدء لربط المذاكرة بالوقت'}
            </p>
          </div>

          {/* Timer Transport Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>بدء المذاكرة الآن</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="إعادة ضبط العداد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Presets */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">أنماط الجلسات المقترحة:</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => startTimerWithDuration(50, 'focus')}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer text-center"
              >
                50 دقيقة تركيز
              </button>
              <button
                onClick={() => startTimerWithDuration(25, 'focus')}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer text-center"
              >
                25 دقيقة بومودورو
              </button>
              <button
                onClick={() => startTimerWithDuration(10, 'break')}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 rounded-lg border border-slate-800 transition-colors cursor-pointer text-center"
              >
                10 دقائق راحة
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Schedule (2 Columns Wide on Desktop) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          {/* Day Selector & Add Task Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Days Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedDay('الكل')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDay === 'الكل'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                كل الأيام
              </button>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDay === day
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة جلسة مذاكرة</span>
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-600" />
                <p>لا توجد جلسات مذاكرة مجدولة ليوم {selectedDay}.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  أضف أول جلسة الآن
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">{task.subject}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-xs text-slate-400 font-mono">{task.day}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {task.startTime} ({task.durationMinutes} دقيقة)
                        </span>
                      </div>
                      <h4
                        className={`text-sm mt-0.5 text-white font-medium ${
                          task.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.topic}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!task.completed && (
                      <button
                        onClick={() => startTimerWithDuration(task.durationMinutes, 'focus')}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        title="بدء مؤقت هذه الجلسة فوراً"
                      >
                        بدء الجلسة
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              إضافة ميعاد مذاكرة للجدول
            </h3>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">المادة الدراسية:</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: الرياضيات / الكيمياء / الأحياء"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">موضوع المذاكرة أو المسائل:</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="مثال: حل 20 مسألة على قوانين نيوتن"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">اليوم:</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">المدة (دقيقة):</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  حفظ في الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

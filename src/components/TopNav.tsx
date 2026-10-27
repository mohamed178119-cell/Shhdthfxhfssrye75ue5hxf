import React from 'react';
import { ActiveTab } from '../types';
import { GraduationCap, Timer } from 'lucide-react';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isFocusTimerActive: boolean;
  focusTimeRemaining: string;
  onToggleQuickFocus: () => void;
  onOpenInstallModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  isFocusTimerActive,
  focusTimeRemaining,
  onToggleQuickFocus,
  onOpenInstallModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <button
            onClick={() => onTabChange('tutor')}
            className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap text-right"
          >
            دارس <span className="text-amber-400 font-mono text-xs font-semibold mr-1">DARIS</span>
          </button>
        </div>

        {/* Zone 2: 4 single-line text navigation links / segmented workspace tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300 shrink-0">
          <button
            onClick={() => onTabChange('tutor')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'tutor'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            غرفة المذاكرة والأسئلة
            {activeTab === 'tutor' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('lecture')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'lecture'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل وتلخيص المحاضرات
            {activeTab === 'lecture' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('audio-pdf')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'audio-pdf'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            حصص الـ PDF الصوتية
            {activeTab === 'audio-pdf' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('schedule')}
            className={`transition-colors whitespace-nowrap py-1 relative ${
              activeTab === 'schedule'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جدول المذاكرة والمنبهات
            {activeTab === 'schedule' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Install Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenInstallModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors whitespace-nowrap cursor-pointer"
            title="تثبيت التطبيق على الهاتف كـ APK أو WebAPK"
          >
            <span>📲 تثبيت التطبيق (APK)</span>
          </button>

          <button
            onClick={onToggleQuickFocus}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isFocusTimerActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title="بدء أو استعراض مؤقت المذاكرة والتركيز"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{isFocusTimerActive ? `مذاكرة نشطة: ${focusTimeRemaining}` : 'جلسة تركيز'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-slate-900 text-xs">
        <button
          onClick={() => onTabChange('tutor')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'tutor' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          المذاكرة
        </button>
        <button
          onClick={() => onTabChange('lecture')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'lecture' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          المحاضرات
        </button>
        <button
          onClick={() => onTabChange('audio-pdf')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'audio-pdf' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          صوت الـ PDF
        </button>
        <button
          onClick={() => onTabChange('schedule')}
          className={`py-1 px-2 whitespace-nowrap ${
            activeTab === 'schedule' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          الجدول
        </button>
      </div>
    </header>
  );
};

import { useState, useEffect } from 'react';
import { ActiveTab, InfographicData } from './types';
import { TopNav } from './components/TopNav';
import { StrictTutorView } from './components/StrictTutorView';
import { LectureStudioView } from './components/LectureStudioView';
import { PdfAudioLessonView } from './components/PdfAudioLessonView';
import { StudyTimetableView } from './components/StudyTimetableView';
import { InfographicSummaryModal } from './components/InfographicSummaryModal';
import { PdfExportModal } from './components/PdfExportModal';
import { InstallAppModal } from './components/InstallAppModal';
import { academicAudio } from './utils/audioAlert';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tutor');

  // Install App / APK Modal
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Global Infographic Modal
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null);
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);

  // Global PDF Export Modal
  const [pdfExportData, setPdfExportData] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: '',
    content: '',
  });

  // Global Quick Focus Timer (accessible from top bar)
  const [isFocusTimerActive, setIsFocusTimerActive] = useState(false);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(25 * 60);

  useEffect(() => {
    let interval: any = null;
    if (isFocusTimerActive) {
      interval = setInterval(() => {
        setFocusSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsFocusTimerActive(false);
            academicAudio.playAlarmBell();
            alert('🔔 انتهت جلسة التركيز المحددة بنجاح!');
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusTimerActive]);

  const toggleQuickFocus = () => {
    if (!isFocusTimerActive) {
      setIsFocusTimerActive(true);
      setFocusSecondsRemaining(25 * 60);
      academicAudio.playStartChime();
    } else {
      setIsFocusTimerActive(false);
    }
  };

  const formatTimeMinutes = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openInfographicModal = (data: InfographicData) => {
    setInfographicData(data);
    setIsInfographicOpen(true);
  };

  const openPdfExportModal = (title: string, content: string) => {
    setPdfExportData({
      isOpen: true,
      title,
      content,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Strict Academic Top Bar */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isFocusTimerActive={isFocusTimerActive}
        focusTimeRemaining={formatTimeMinutes(focusSecondsRemaining)}
        onToggleQuickFocus={toggleQuickFocus}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Workspace View Container */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'tutor' && (
          <StrictTutorView
            onOpenInfographic={openInfographicModal}
            onOpenPdfExport={openPdfExportModal}
          />
        )}

        {activeTab === 'lecture' && (
          <LectureStudioView
            onOpenInfographic={openInfographicModal}
            onOpenPdfExport={openPdfExportModal}
          />
        )}

        {activeTab === 'audio-pdf' && (
          <PdfAudioLessonView
            onOpenInfographic={openInfographicModal}
            onOpenPdfExport={openPdfExportModal}
          />
        )}

        {activeTab === 'schedule' && <StudyTimetableView />}
      </main>

      {/* High-Resolution Infographic Card Modal with Image Download */}
      <InfographicSummaryModal
        data={infographicData}
        isOpen={isInfographicOpen}
        onClose={() => setIsInfographicOpen(false)}
      />

      {/* PDF Export & Academic Printable Document Modal */}
      <PdfExportModal
        isOpen={pdfExportData.isOpen}
        onClose={() => setPdfExportData((prev) => ({ ...prev, isOpen: false }))}
        title={pdfExportData.title}
        content={pdfExportData.content}
      />

      {/* Install App as APK / Mobile App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}

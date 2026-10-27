export interface ChatAttachment {
  name: string;
  type: 'image' | 'pdf';
  mimeType: string;
  data: string; // base64 string
  previewUrl?: string;
  sizeBytes?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  audioBase64?: string;
  infographicData?: InfographicData;
}

export interface AudioLessonTrack {
  id: number;
  title: string;
  script: string;
  audioBase64?: string;
  mimeType?: string;
  durationSeconds?: number;
}

export interface AudioLesson {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  tracks: AudioLessonTrack[];
  pdfName?: string;
}

export interface InfographicData {
  title: string;
  subject: string;
  keyConcepts: { label: string; desc: string }[];
  goldenRules: string[];
  examTraps: string[];
  tutorVerdict: string;
  date?: string;
}

export interface LectureRecord {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  transcript: string;
  summary: string;
  audioBlobUrl?: string;
}

export interface StudyTask {
  id: string;
  day: 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة' | 'السبت';
  subject: string;
  topic: string;
  startTime: string;
  durationMinutes: number;
  completed: boolean;
  notes?: string;
}

export type ActiveTab = 'tutor' | 'lecture' | 'audio-pdf' | 'schedule';

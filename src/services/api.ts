import { ChatAttachment, InfographicData, AudioLessonTrack } from '../types';

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract pure base64 without prefix data:...;base64,
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}

export async function askStrictTutor(params: {
  message: string;
  history?: { role: 'user' | 'model'; text: string }[];
  attachments?: ChatAttachment[];
}): Promise<string> {
  const images = (params.attachments || [])
    .filter((a) => a.type === 'image')
    .map((a) => ({ data: a.data, mimeType: a.mimeType }));

  const pdfFiles = (params.attachments || [])
    .filter((a) => a.type === 'pdf')
    .map((a) => ({ data: a.data, name: a.name }));

  const res = await fetch('/api/tutor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      history: params.history || [],
      images,
      pdfFiles,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'تعذر التواصل مع المعلم الصارم.');
  }

  const data = await res.json();
  return data.reply;
}

export async function transcribeAndSummarizeAudio(
  audioBlob: Blob,
  mimeType: string,
  topicHint?: string
): Promise<{ transcript: string; summary: string }> {
  const audioBase64 = await blobToBase64(audioBlob);

  const res = await fetch('/api/lecture/transcribe-and-summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      topicHint: topicHint || '',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشلت معالجة وتلخيص الملف الصوتي.');
  }

  return await res.json();
}

export async function preparePdfAudioLesson(
  pdfFile: File,
  topicTitle: string
): Promise<{ lessonTitle: string; tracks: AudioLessonTrack[] }> {
  const pdfBase64 = await fileToBase64(pdfFile);

  const res = await fetch('/api/pdf/prepare-audio-lesson', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfBase64,
      topicTitle,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر إعداد الحصة الصوتية من ملف الـ PDF.');
  }

  return await res.json();
}

export async function synthesizeAudioTrack(
  text: string,
  voiceName: string = 'Fenrir'
): Promise<{ audioBase64: string; mimeType: string }> {
  const res = await fetch('/api/audio/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر توليد النطق الصوتي.');
  }

  return await res.json();
}

export async function generateInfographicData(
  topic: string,
  content: string
): Promise<InfographicData> {
  const res = await fetch('/api/infographic/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'تعذر تجهيز بيانات الإنفوجرافيك.');
  }

  return await res.json();
}

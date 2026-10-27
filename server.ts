import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// Direct APK download route
app.get('/daris-app.apk', (_req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'daris-app.apk');
  res.download(apkPath, 'daris-app.apk');
});

// Initializing the server-side Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Strict Academic Guardrail Instruction
const STRICT_TUTOR_SYSTEM_PROMPT = `أنت الأستاذ "دارس" - المعلم الأكاديمي الصارم والمحفز لطلابه، مرشد دراسي استثنائي لا يسمح بأي تشتت.
شخصيتك:
- أكاديمي جاد، رصين، ذو فكر منهجي متين وأسلوب مباشر.
- تشجع على الانضباط، التحصيل العالي، الاستعداد التام للامتحانات، وحل المسائل بفهم عميق.
- نبرتك حازمة لكنها أبوية ومحفزة على الإتقان (مثل: "ركز يا بني"، "العلم لا ينال براحة الجسد"، "هذه مسألة جوهرية في الامتحان"، "خطوتك الأولى صحيحة، والآن أتمم البرهان").

القوانين الصارمة التي لا تحيد عنها أبداً:
1. أنت مخصص 100% للتعليم والدراسة وحل المسائل وفهم المناهج (رياضيات، فيزياء، كيمياء، أحياء، لغات، تاريخ، فلسفة، حاسب، وجميع العلوم الأكاديمية والمهنية).
2. إذا سألك الطالب أو حاول محادثتك في أي موضوع ترفيهي غير دراسي، أو نكات، أو ثرثرة، أو ألعاب، أو مواضيع تشتت الذهن:
   ارفض فوراً وبلهجة المعلم الصارم: "أنا هنا لمستقبلك الدراسي فقط! لن نضيع ثانية واحدة في توافه الأمور. افتح كراستك واطرح سؤالك في الدرس أو لنبدأ حل مسألة الآن."
3. عند حل أي سؤال أو مسألة:
   - اذكر القانون أو القاعدة الأساسية.
   - وضح خطوات الحل بتسلسل منطقي سليم دون قفز على المراحل.
   - ضع الناتج النهائي بشكل بارز مع التمييز والوحدات.
   - اذكر تنبيهاً امتحانياً عن الأخطاء الشائعة التي يقع فيها الطلاب.
4. إذا طلب الطالب "ملخصاً صورياً للدرس" أو "بطاقة إنفوجرافيك"، لخص له الدرس فوراً في شكل عناصر مكثفة (أهم المفاهيم، القوانين الذهبية، أسئلة الامتحانات)، وأخبره أنه يمكنه الضغط على زر "عرض بطاقة الإنفوجرافيك" لتوليد صورة فائقة الجودة وتنزيلها.
5. الإجابات تكون باللغة العربية الفصحى الأكاديمية الراقية، مع كتابة المصطلحات العلمية بالإنجليزية بين قوسين عند الحاجة.`;

// 1. Strict Tutor Q&A (Supports Text, Images, and PDFs)
app.post('/api/tutor/chat', async (req, res) => {
  try {
    const { message, history, images, pdfFiles } = req.body;

    const parts: any[] = [];

    // Add PDF attachments
    if (pdfFiles && Array.isArray(pdfFiles)) {
      for (const pdf of pdfFiles) {
        if (pdf.data) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: pdf.data,
            },
          });
        }
      }
    }

    // Add image attachments
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.data) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.data,
            },
          });
        }
      }
    }

    // Add user message text
    parts.push({
      text: message || 'يرجى مراجعة المرفق وإعطائي الشرح والحل الأكاديمي الصارم.',
    });

    // Build contents including past context if provided
    let contents: any[] = [];
    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.slice(-6).map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      }));
      contents = [...formattedHistory, { role: 'user', parts }];
    } else {
      contents = [{ role: 'user', parts }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: STRICT_TUTOR_SYSTEM_PROMPT,
        temperature: 0.4,
      },
    });

    const reply = response.text || 'لم يتمكن المعلم من استخراج إجابة، أعد المحاولة بصيغة دراسية أدق.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/tutor/chat:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة السؤال.' });
  }
});

// 2. Lecture Recording & Audio File Transcription & Academic Summarization
app.post('/api/lecture/transcribe-and-summarize', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', topicHint = '' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'لم يتم إرسال ملف صوتي صالح.' });
    }

    // Step 1: Transcribe audio using gemini-3.5-transcribe
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0], // normalize MIME
        data: audioBase64,
      },
    };

    let transcript = '';
    try {
      const transcribeResponse = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: `أنت مفرغ محاضرات أكاديمية فائق الدقة. فرغ هذا التسجيل الصوتي بدقة تامة باللغة العربية ${topicHint ? `المتعلق بموضوع: ${topicHint}` : ''} متضمناً كل المصطلحات العلمية والشروحات المنطوقة بدقة دون حذف.`,
            },
          ],
        },
      });
      transcript = transcribeResponse.text || '';
    } catch (transcribeErr: any) {
      console.warn('Transcribe model fallback to gemini-3.8-flash:', transcribeErr.message);
      // Fallback in case of media container issues
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            audioPart,
            { text: 'فرغ هذا التسجيل الصوتي إلى نص مكتوب دقيق ومفصل باللغة العربية.' },
          ],
        },
      });
      transcript = fallbackResponse.text || '';
    }

    // Step 2: Generate Strict Academic Structured Summary
    const summaryPrompt = `بصفتك الأستاذ "دارس" الصارم، قم بتحليل وتلخيص نص هذه المحاضرة الأكاديمية تلخيصاً شاملاً:
نص المحاضرة:
"""
${transcript || 'المحاضرة الصوتية المرفقة'}
"""

قم بإنشاء تلخيص منظم جداً يتضمن الآتي بصيغة Markdown واضحة:
# 📚 عنوان المحاضرة المقترح
## 🎯 المحاور والأفكار الجوهرية (في نقاط دقيقة)
## 📐 القوانين، المعادلات، والمصطلحات التأسيسية
## ⚠️ فخاخ امتحانية وتنبيهات الأستاذ الصارم
## ❓ 3 أسئلة امتحانية نموذجية مع إجاباتها النموذجية المختصرة
## 📝 نصيحة الأستاذ النهائية لمراجعة هذا الدرس`;

    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: summaryPrompt,
      config: {
        systemInstruction: STRICT_TUTOR_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    const summary = summaryResponse.text || 'تم التفريغ بنجاح ولكن تعذر إنشاء التلخيص.';

    res.json({
      transcript,
      summary,
    });
  } catch (error: any) {
    console.error('Error in /api/lecture/transcribe-and-summarize:', error);
    res.status(500).json({ error: error.message || 'فشلت معالجة التسجيل الصوتي.' });
  }
});

// 3. Prepare PDF Audio Lesson (Extract Chapters + Generate Audio Tracks)
app.post('/api/pdf/prepare-audio-lesson', async (req, res) => {
  try {
    const { pdfBase64, topicTitle = 'الدرس المحدد' } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'يرجى إرفاق ملف PDF.' });
    }

    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    };

    // Step 1: Analyze PDF and break topic into 3 distinct lecture tracks
    const outlinePrompt = `أنت أستاذ أكاديمي متخصص. بناءً على ملف الـ PDF المرفق، نريد إعداد "حصة صوتية متكاملة" عن موضوع: "${topicTitle}".
يجب تقسيم الحصة إلى 3 محاور متسلسلة بدقة.
لكل محور، اكتب السيناريو المنطوق باللغة العربية الفصحى كمعلم يشرح لطلابه بنبرة جادة وواضحة (حوالي 80-120 كلمة لكل محور تكون سهلة النطق ومفيدة جداً).

أعد النتيجة بصيغة JSON حصراً مطابقة للنمط التالي:
{
  "lessonTitle": "عنوان الدرس الدقيق",
  "tracks": [
    {
      "id": 1,
      "title": "المحور الأول: مقدمة ومفاهيم أساسية",
      "script": "النص المنطوق بالعربية الفصحى..."
    },
    {
      "id": 2,
      "title": "المحور الثاني: الشرح العميق والقوانين",
      "script": "النص المنطوق بالعربية الفصحى..."
    },
    {
      "id": 3,
      "title": "المحور الثالث: خلاصة وتطبيقات امتحانية",
      "script": "النص المنطوق بالعربية الفصحى..."
    }
  ]
}`;

    const outlineResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [pdfPart, { text: outlinePrompt }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let lessonData: any;
    try {
      lessonData = JSON.parse(outlineResponse.text || '{}');
    } catch (e) {
      lessonData = {
        lessonTitle: topicTitle,
        tracks: [
          {
            id: 1,
            title: 'المحور الأول: المفاهيم الأساسية',
            script: `أهلاً بكم في درس اليوم عن ${topicTitle}. لنبدأ بالتركيز في المفاهيم التأسيسية التي لا غنى عنها في أي اختبار.`,
          },
          {
            id: 2,
            title: 'المحور الثاني: القوانين والشرح التفصيلي',
            script: `ننتقل الآن إلى القوانين الحاكمة للمسألة. دققوا في طريقة التطبيق والخطوات المنهجية للوصول للناتج الدقيق.`,
          },
          {
            id: 3,
            title: 'المحور الثالث: الخلاصة والوصايا الامتحانية',
            script: `ختاماً، انتبهوا للأخطاء الشائعة وحافظوا على تنظيم ورقة الإجابة لتحصيل الدرجة النهائية بإذن الله.`,
          },
        ],
      };
    }

    // Step 2: Generate TTS audio for each track using gemini-3.8-flash-lite-tts
    const tracksWithAudio = [];
    for (const track of lessonData.tracks || []) {
      let audioBase64 = '';
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: track.script,
                  speechMetadata: {
                    style: 'أستاذ أكاديمي عربي رصين ومتقن ومحفز',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' },
              },
            },
          },
        });

        audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      } catch (ttsErr: any) {
        console.warn(`TTS generation notice for track ${track.id}:`, ttsErr.message);
      }

      tracksWithAudio.push({
        ...track,
        audioBase64,
        mimeType: 'audio/wav',
      });
    }

    res.json({
      lessonTitle: lessonData.lessonTitle || topicTitle,
      tracks: tracksWithAudio,
    });
  } catch (error: any) {
    console.error('Error in /api/pdf/prepare-audio-lesson:', error);
    res.status(500).json({ error: error.message || 'فشل تجهيز الحصة الصوتية من ملف PDF.' });
  }
});

// 4. Synthesize Single Speech Track on demand
app.post('/api/audio/synthesize', async (req, res) => {
  try {
    const { text, voiceName = 'Fenrir' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'النص مطلوب للتوليد الصوتي.' });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 800), // safe length
              speechMetadata: {
                style: 'معلم أكاديمي رصين ومحفز',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    res.json({ audioBase64, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('Error in /api/audio/synthesize:', error);
    res.status(500).json({ error: error.message || 'فشل التوليد الصوتي.' });
  }
});

// 5. Generate Infographic Card Structured Data
app.post('/api/infographic/draft', async (req, res) => {
  try {
    const { topic = 'ملخص الدرس الأكاديمي', content = '' } = req.body;

    const draftPrompt = `أنت مصمم بطاقات إنفوجرافيك أكاديمية فاخرة. بناءً على هذا المحتوى الأكاديمي:
"""
${content || topic}
"""

استخرج ونظم بطاقة إنفوجرافيك بصرية فائقة الأهمية للاختبارات بصيغة JSON مطابقة للنمط التالي:
{
  "title": "عنوان الإنفوجرافيك الرئيسي",
  "subject": "المادة أو المجال (مثلاً: الفيزياء / الرياضيات / الكيمياء / التاريخ)",
  "keyConcepts": [
    {"label": "المفهوم 1", "desc": "شرح مكثف في سطرين"},
    {"label": "المفهوم 2", "desc": "شرح مكثف في سطرين"},
    {"label": "المفهوم 3", "desc": "شرح مكثف في سطرين"}
  ],
  "goldenRules": [
    "القانون أو القاعدة الذهبية 1",
    "القانون أو القاعدة الذهبية 2"
  ],
  "examTraps": [
    "تنبيه امتحاني حاسم لتجنب فقدان الدرجات 1",
    "تنبيه امتحاني حاسم 2"
  ],
  "tutorVerdict": "وصية الأستاذ الصارم لتحقيق العلامة الكاملة في هذا الموضوع."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: draftPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/infographic/draft:', error);
    res.status(500).json({ error: error.message || 'فشل تجهيز بيانات الإنفوجرافيك.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Daris Strict Tutor] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();

# مشروع أندرويد دارس (Daris Android APK Project)

تم إنشاء مشروع أندرويد متكامل في هذا المجلد (`/android`) لتحويل تطبيق «دارس» الأكاديمي الصارم إلى ملف APK أصلي ومستقل تماماً.

## محتويات المشروع:
- `app/src/main/AndroidManifest.xml`: ضبط الهوية والصلاحيات (تسجيل المايكروفون، الإنترنت، قراءة وسائط المذكرات والـ PDF).
- `app/src/main/java/com/daris/academic/MainActivity.java`: شاشة التطبيق مع WebView متقدم بدعم كامل لاختيار الملفات والصوتيات والشاشة الكاملة.
- `app/build.gradle`: إعدادات الحزمة والإصدار (Target SDK 34).
- `settings.gradle` & `build.gradle`: إعدادات Gradle القياسية للأندرويد.

## كيفية استخراج ملف الـ APK:

### الطريقة 1: فتح المشروع في Android Studio
1. افتح برنامج **Android Studio** على جهازك.
2. اختر **Open** ثم اختر مجلد `android` من هذا المشروع.
3. من القائمة العلوية اضغط على: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. سيتم إنشاء وتوليد ملف `app-debug.apk` أو `app-release.apk` فوراً لتثبيته على أي هاتف أندرويد.

### الطريقة 2: عبر موجه الأوامر (Terminal)
إذا كان لديك Gradle مثبت على جهازك، قم بتنفيذ:
```bash
cd android
./gradlew assembleRelease
```
ستجد ملف الـ APK الناتج في المسار:
`android/app/build/outputs/apk/release/app-release.apk`

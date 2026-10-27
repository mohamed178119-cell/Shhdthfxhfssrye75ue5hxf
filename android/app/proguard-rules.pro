# ProGuard rules for Daris Academic Assistant
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void onPermissionRequest(android.webkit.PermissionRequest);
    public boolean onShowFileChooser(android.webkit.WebView, android.webkit.ValueCallback, android.webkit.WebChromeClient$FileChooserParams);
}

-dontwarn androidx.webkit.**
-keep class androidx.webkit.** { *; }
-keep class com.daris.academic.** { *; }

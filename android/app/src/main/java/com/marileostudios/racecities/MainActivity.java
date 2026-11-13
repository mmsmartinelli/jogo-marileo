package com.marileostudios.racecities;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

// App Android do Race Cities: o jogo vai guardado dentro do app (assets/www) e roda num
// WebView em tela cheia, deitado, funcionando até sem internet (só o modo online precisa).
// O WebView vê o jogo em https://appassets.androidplatform.net/assets/www/ — um endereço
// https "de verdade", então módulos JavaScript, progresso salvo (localStorage) e o modo
// online (WebRTC) funcionam como no site.
// Se o APK for gerado sem o jogo (remoteGame=true), o app abre o site, como antes.
public class MainActivity extends Activity {
    static final String SITE = "https://mmsmartinelli.github.io/jogo-marileo/";
    static final String SITE_HOST = "mmsmartinelli.github.io";
    static final String SITE_PATH = "/jogo-marileo";
    static final String LOCAL_HOST = WebViewAssetLoader.DEFAULT_DOMAIN; // appassets.androidplatform.net
    static final String LOCAL = "https://" + LOCAL_HOST + "/assets/www/";
    static final String LOCAL_INDEX = LOCAL + "index.html";

    private WebView web;
    private GameAds ads;
    private WebViewAssetLoader assets;
    private boolean bundled;
    private long lastBack = 0;
    private Object backCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        bundled = hasAsset("www/index.html");
        assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(11, 13, 36));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setUserAgentString(s.getUserAgentString() + " RaceCitiesApp/2");

        if (bundled) blockServiceWorker();

        ads = new GameAds(this, code -> { if (web != null) web.evaluateJavascript(code, null); });
        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                return LOCAL_HOST.equals(u.getHost()) ? assets.shouldInterceptRequest(u) : null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (isLocal(u)) return false;
                if (isSite(u)) {
                    if (!bundled) return false;
                    view.loadUrl(toLocal(u)); // link do site abre a cópia de dentro do app
                    return true;
                }
                // outros links (WhatsApp etc.) abrem no app certo do celular
                openExternal(u);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame() && !bundled) showOffline();
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl(startUrl(getIntent()));

        setupBack();
        hideBars();
    }

    private boolean hasAsset(String path) {
        try (InputStream in = getAssets().open(path)) {
            return in != null;
        } catch (IOException e) {
            return false;
        }
    }

    // O jogo registra um service worker (cache do site). Dentro do app os arquivos já estão
    // no aparelho e um cache antigo poderia esconder atualizações: o registro falha de propósito.
    private void blockServiceWorker() {
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)
                && WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_SHOULD_INTERCEPT_REQUEST)) {
                ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(new ServiceWorkerClientCompat() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(@NonNull WebResourceRequest req) {
                        if (!LOCAL_HOST.equals(req.getUrl().getHost())) return null;
                        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null,
                            new ByteArrayInputStream(new byte[0]));
                    }
                });
            }
        } catch (Exception e) { /* sem suporte: o registro falha sozinho */ }
    }

    static boolean isSite(Uri u) {
        return u != null && "https".equals(u.getScheme()) && SITE_HOST.equals(u.getHost())
            && u.getPath() != null && u.getPath().startsWith(SITE_PATH);
    }

    static boolean isLocal(Uri u) {
        return u != null && "https".equals(u.getScheme()) && LOCAL_HOST.equals(u.getHost());
    }

    // …/jogo-marileo/?sala=ABCD  ->  https://appassets.androidplatform.net/assets/www/index.html?sala=ABCD
    static String toLocal(Uri u) {
        String q = u.getEncodedQuery();
        return LOCAL_INDEX + (q != null && !q.isEmpty() ? "?" + q : "");
    }

    // link de convite (…/jogo-marileo/?sala=ABCD) abre direto na sala
    String startUrl(Intent it) {
        Uri u = it != null ? it.getData() : null;
        if (bundled) return isSite(u) ? toLocal(u) : LOCAL_INDEX;
        return isSite(u) ? u.toString() : SITE;
    }

    @Override
    protected void onNewIntent(Intent it) {
        super.onNewIntent(it);
        Uri u = it.getData();
        if (isSite(u)) web.loadUrl(bundled ? toLocal(u) : u.toString());
    }

    private void openExternal(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (Exception e) { /* nada para abrir */ }
    }

    private void showOffline() {
        String html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            + "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"
            + "background:#0b0d24;color:#fff;font-family:sans-serif;text-align:center'>"
            + "<div><div style='font-size:64px'>🏁</div><h2>Sem internet</h2>"
            + "<p>Conecte no Wi-Fi ou nos dados móveis<br>para abrir o Race Cities pela primeira vez.</p>"
            + "<button onclick=\"location.href='" + SITE + "'\" style='font-size:20px;padding:14px 28px;border:0;"
            + "border-radius:14px;background:#ff4fa3;color:#fff;font-weight:bold'>Tentar de novo</button></div></body></html>";
        web.loadDataWithBaseURL(SITE, html, "text/html", "utf-8", SITE);
    }

    @SuppressWarnings("deprecation")
    private void hideBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideBars();
    }

    // ---------- voltar ----------
    // Android 13+ (e obrigatório a partir do targetSdk 36): OnBackInvokedCallback.
    // Antes disso: onBackPressed. O jogo pausa / volta uma tela; no menu, dois toques fecham o app.
    private void setupBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            OnBackInvokedCallback cb = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, cb);
            backCallback = cb;
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        handleBack();
    }

    private void handleBack() {
        if (web == null) { finish(); return; }
        web.evaluateJavascript("(window.androidBack && window.androidBack()) ? 1 : 0", r -> {
            if ("1".equals(r)) return;
            long now = System.currentTimeMillis();
            if (now - lastBack < 2000) { finish(); return; }
            lastBack = now;
            Toast.makeText(this, "Toque de novo para sair", Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        // pausa a corrida se o celular tocar, apagar a tela etc.
        web.evaluateJavascript("window.app && window.app.screen === 'race' && !(window.app.race && window.app.race.online) && window.app.pause && window.app.pause()", null);
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        hideBars();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback((OnBackInvokedCallback) backCallback);
        }
        if (web != null) {
            web.removeJavascriptInterface("AndroidApp");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    // Objeto window.AndroidApp da página. Estes métodos são chamados numa thread do WebView:
    // tudo que mexe na tela vai para a thread principal com runOnUiThread.
    class Bridge {
        // convite para a sala online (WhatsApp etc.)
        @JavascriptInterface
        public void share(String text) {
            // dentro do app o endereço da página é o local; o convite precisa do endereço do site
            final String msg = String.valueOf(text)
                .replaceAll("https://" + LOCAL_HOST.replace(".", "\\.") + "/assets/www/(index\\.html)?", SITE);
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, msg);
                try { startActivity(Intent.createChooser(send, "Convidar para a sala")); } catch (Exception e) { /* sem apps */ }
            });
        }

        // links de patrocinador: o jogo só chama depois do "portão dos pais"
        @JavascriptInterface
        public void openUrl(String url) {
            final Uri u;
            try { u = Uri.parse(String.valueOf(url)); } catch (Exception e) { return; }
            if (!"https".equals(u.getScheme()) && !"http".equals(u.getScheme())) return;
            runOnUiThread(() -> openExternal(u));
        }

        // ads.init() com anúncios ligados: inicia o SDK e pré-carrega os anúncios
        @JavascriptInterface
        public void prepareAds(String json) {
            final boolean test = json == null || !json.replace(" ", "").contains("\"test\":false");
            runOnUiThread(() -> ads.prepare(test));
        }

        @JavascriptInterface
        public void showInterstitial(String placement) {
            runOnUiThread(() -> ads.showInterstitial());
        }

        @JavascriptInterface
        public void showRewarded(String placement) {
            runOnUiThread(() -> ads.showRewarded());
        }
    }
}

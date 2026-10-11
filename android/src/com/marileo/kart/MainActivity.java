package com.marileo.kart;

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
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

// App Android do Marileo Kart: abre o jogo (o mesmo do site) em tela cheia, deitado.
// O jogo é atualizado pelo site, então o app não precisa ser reinstalado a cada novidade.
public class MainActivity extends Activity {
    static final String HOME = "https://mmsmartinelli.github.io/jogo-marileo/";
    static final String HOST = "mmsmartinelli.github.io";
    static final String PATH = "/jogo-marileo";

    private WebView web;
    private long lastBack = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(11, 13, 36));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " MarileoKartApp/1");

        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (isGame(u)) return false;
                // outros links (WhatsApp etc.) abrem no app certo do celular
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* nada para abrir */ }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) showOffline();
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl(startUrl(getIntent()));
        hideBars();
    }

    static boolean isGame(Uri u) {
        return u != null && HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith(PATH);
    }

    // link de convite (…/jogo-marileo/?sala=ABCD) abre direto na sala
    static String startUrl(Intent it) {
        Uri u = it != null ? it.getData() : null;
        return isGame(u) ? u.toString() : HOME;
    }

    @Override
    protected void onNewIntent(Intent it) {
        super.onNewIntent(it);
        Uri u = it.getData();
        if (isGame(u)) web.loadUrl(u.toString());
    }

    private void showOffline() {
        String html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            + "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"
            + "background:#0b0d24;color:#fff;font-family:sans-serif;text-align:center'>"
            + "<div><div style='font-size:64px'>🏁</div><h2>Sem internet</h2>"
            + "<p>Conecte no Wi-Fi ou nos dados móveis<br>para abrir o Marileo Kart pela primeira vez.</p>"
            + "<button onclick=\"location.href='" + HOME + "'\" style='font-size:20px;padding:14px 28px;border:0;"
            + "border-radius:14px;background:#ff4fa3;color:#fff;font-weight:bold'>Tentar de novo</button></div></body></html>";
        web.loadDataWithBaseURL(HOME, html, "text/html", "utf-8", HOME);
    }

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

    // voltar: o jogo pausa / volta uma tela; no menu principal, dois toques fecham o app
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
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
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    class Bridge {
        @JavascriptInterface
        public void share(String text) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, text);
                try { startActivity(Intent.createChooser(send, "Convidar para a sala")); } catch (Exception e) { /* sem apps */ }
            });
        }
    }
}

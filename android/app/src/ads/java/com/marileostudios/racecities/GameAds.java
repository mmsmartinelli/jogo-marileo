package com.marileostudios.racecities;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AgeRestrictedTreatment;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

// Anúncios do Google AdMob (intervalo entre corridas e "assista e ganhe").
//
// Contrato com o jogo (js/ads.js, provedor "native"):
//   página -> app:  AndroidApp.prepareAds('{"test":true}')   (ads.init, só com anúncios ligados)
//                   AndroidApp.showInterstitial(placement) / AndroidApp.showRewarded(placement)
//   app -> página:  window.__adStarted()         quando o anúncio aparece na tela
//                   window.__adDone({shown, rewarded, reason})   SEMPRE, em qualquer desfecho
//
// Público inclui crianças: todo pedido vai com tratamento de criança (substitui
// TFCD + TFUA), sem personalização e com classificação máxima G.
// Tudo aqui roda na thread principal; nada bloqueia a interface.
final class GameAds {
    private static final String TAG = "RaceCitiesAds";

    // IDs de TESTE oficiais do Google (https://developers.google.com/admob/android/test-ads)
    static final String TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
    static final String TEST_REWARDED = "ca-app-pub-3940256099942544/5224354917";

    // um anúncio carregado vale por 1 hora; descartamos antes disso
    private static final long MAX_AGE_MS = 55 * 60 * 1000L;

    interface Js { void run(String code); }

    private final Activity act;
    private final Js js;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final String realInterstitial, realRewarded;

    private boolean started, ready, testMode = true, showing;
    private InterstitialAd interstitial;
    private RewardedAd rewarded;
    private long interstitialAt, rewardedAt;
    private boolean loadingI, loadingR;
    private int failI, failR;

    GameAds(Activity act, Js js) {
        this.act = act;
        this.js = js;
        this.realInterstitial = act.getString(R.string.admob_interstitial_id);
        this.realRewarded = act.getString(R.string.admob_rewarded_id);
    }

    // ---------- inicialização (só quando o jogo está com anúncios ligados) ----------
    void prepare(boolean pageTest) {
        boolean newTest = pageTest || BuildConfig.DEBUG;
        if (started && newTest != testMode) {
            // mudou de teste para real (ou vice-versa): descarta o que estava carregado
            interstitial = null;
            rewarded = null;
        }
        testMode = newTest;
        if (started) { if (ready) preload(); return; }
        started = true;

        RequestConfiguration rc = MobileAds.getRequestConfiguration().toBuilder()
            // criança: equivale a TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE + TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE
            .setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
            .setPublisherPrivacyPersonalizationState(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED)
            .build();
        MobileAds.setRequestConfiguration(rc);

        // o Google recomenda iniciar o SDK fora da thread principal
        new Thread(() -> MobileAds.initialize(act, status -> main.post(() -> {
            ready = true;
            preload();
        })), "ads-init").start();
    }

    private String interstitialId() { return testMode || realInterstitial.isEmpty() ? TEST_INTERSTITIAL : realInterstitial; }
    private String rewardedId() { return testMode || realRewarded.isEmpty() ? TEST_REWARDED : realRewarded; }

    private static AdRequest request() { return new AdRequest.Builder().build(); }

    private void preload() {
        loadInterstitial();
        loadRewarded();
    }

    private void loadInterstitial() {
        if (!ready || loadingI || act.isFinishing()) return;
        if (interstitial != null && SystemClock.elapsedRealtime() - interstitialAt < MAX_AGE_MS) return;
        interstitial = null;
        loadingI = true;
        InterstitialAd.load(act, interstitialId(), request(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                loadingI = false; failI = 0;
                interstitial = ad; interstitialAt = SystemClock.elapsedRealtime();
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError e) {
                loadingI = false; interstitial = null;
                Log.i(TAG, "interstitial não carregou: " + e.getCode() + " " + e.getMessage());
                main.postDelayed(GameAds.this::loadInterstitial, backoff(++failI));
            }
        });
    }

    private void loadRewarded() {
        if (!ready || loadingR || act.isFinishing()) return;
        if (rewarded != null && SystemClock.elapsedRealtime() - rewardedAt < MAX_AGE_MS) return;
        rewarded = null;
        loadingR = true;
        RewardedAd.load(act, rewardedId(), request(), new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                loadingR = false; failR = 0;
                rewarded = ad; rewardedAt = SystemClock.elapsedRealtime();
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError e) {
                loadingR = false; rewarded = null;
                Log.i(TAG, "rewarded não carregou: " + e.getCode() + " " + e.getMessage());
                main.postDelayed(GameAds.this::loadRewarded, backoff(++failR));
            }
        });
    }

    // nova tentativa depois de 30 s, 60 s, 120 s ... no máximo 10 min
    private static long backoff(int n) { return Math.min(600_000L, 30_000L << Math.min(5, n - 1)); }

    // ---------- exibição ----------
    void showInterstitial() {
        if (!started) prepare(true);
        if (showing) { done(false, false, "busy"); return; }
        InterstitialAd ad = fresh(interstitial, interstitialAt) ? interstitial : null;
        interstitial = null;
        if (ad == null) { done(false, false, ready ? "not-ready" : "not-initialized"); loadInterstitial(); return; }
        showing = true;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdShowedFullScreenContent() { started(); }

            @Override
            public void onAdDismissedFullScreenContent() {
                showing = false;
                done(true, false, "dismissed");
                loadInterstitial();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError e) {
                showing = false;
                done(false, false, "show-failed");
                loadInterstitial();
            }
        });
        try {
            ad.show(act);
        } catch (Exception e) {
            showing = false;
            done(false, false, "error");
            loadInterstitial();
        }
    }

    void showRewarded() {
        if (!started) prepare(true);
        if (showing) { done(false, false, "busy"); return; }
        RewardedAd ad = fresh(rewarded, rewardedAt) ? rewarded : null;
        rewarded = null;
        if (ad == null) { done(false, false, ready ? "not-ready" : "not-initialized"); loadRewarded(); return; }
        showing = true;
        final boolean[] earned = { false };
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdShowedFullScreenContent() { started(); }

            @Override
            public void onAdDismissedFullScreenContent() {
                showing = false;
                // a recompensa às vezes chega um instante depois do fechamento
                main.postDelayed(() -> {
                    done(true, earned[0], earned[0] ? "rewarded" : "dismissed");
                    loadRewarded();
                }, 150);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError e) {
                showing = false;
                done(false, false, "show-failed");
                loadRewarded();
            }
        });
        try {
            ad.show(act, item -> earned[0] = true);
        } catch (Exception e) {
            showing = false;
            done(false, false, "error");
            loadRewarded();
        }
    }

    private static boolean fresh(Object ad, long at) {
        return ad != null && SystemClock.elapsedRealtime() - at < MAX_AGE_MS;
    }

    private void started() {
        js.run("window.__adStarted && window.__adStarted()");
    }

    private void done(boolean shown, boolean reward, String reason) {
        js.run("window.__adDone && window.__adDone({\"shown\":" + shown + ",\"rewarded\":" + reward
            + ",\"reason\":\"" + reason + "\"})");
    }
}

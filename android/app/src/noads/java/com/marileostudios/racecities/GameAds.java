package com.marileostudios.racecities;

import android.app.Activity;

// Versão SEM anúncios (build da loja): não há SDK do Google dentro do app.
// Mantém o mesmo contrato com o jogo (js/ads.js): qualquer pedido de anúncio termina na hora,
// sem mostrar nada. Para voltar com anúncios: compile com -PwithAds=true (usa src/ads/).
final class GameAds {
    interface Js { void run(String code); }

    private final Js js;

    GameAds(Activity act, Js js) { this.js = js; }

    void prepare(boolean pageTest) { /* sem SDK: nada a preparar */ }

    void showInterstitial() { done(); }

    void showRewarded() { done(); }

    private void done() {
        js.run("window.__adDone && window.__adDone({\"shown\":false,\"rewarded\":false,\"reason\":\"sem-sdk\"})");
    }
}

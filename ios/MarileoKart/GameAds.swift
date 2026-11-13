// Anúncios do Google AdMob no app iOS do Race Cities (intervalo entre corridas e "assista e ganhe").
//
// Contrato com o jogo (js/ads.js, provedor "native"):
//   página -> app:  webkit.messageHandlers.ads.postMessage({action: 'prepare', test})        (ads.init)
//                   webkit.messageHandlers.ads.postMessage({action: 'interstitial'|'rewarded', placement, test, childDirected})
//   app -> página:  window.__adStarted()                       quando o anúncio aparece
//                   window.__adDone({shown, rewarded, reason})  SEMPRE, em qualquer desfecho
//
// Público inclui crianças: tratamento de criança (substitui tagForChildDirectedTreatment +
// tagForUnderAgeOfConsent, que estão obsoletos na versão 13 do SDK), sem personalização,
// classificação máxima G, sem localização e sem pedir permissão de rastreamento (ATT).
//
// API do Google Mobile Ads SDK 13.x (nomes conferidos nos cabeçalhos do GoogleMobileAds.xcframework 13.12.0).
import UIKit
import GoogleMobileAds

@MainActor
final class GameAds: NSObject, FullScreenContentDelegate {
    // IDs de TESTE oficiais do Google (https://developers.google.com/admob/ios/test-ads)
    static let testInterstitial = "ca-app-pub-3940256099942544/4411468910"
    static let testRewarded = "ca-app-pub-3940256099942544/1712485313"
    // um anúncio carregado vale por 1 hora; descartamos antes disso
    private static let maxAge: TimeInterval = 55 * 60

    private weak var host: UIViewController?
    private let js: (String) -> Void
    private let realInterstitial: String
    private let realRewarded: String

    private var started = false, ready = false, testMode = true, showing = false
    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?
    private var interstitialAt = Date.distantPast, rewardedAt = Date.distantPast
    private var loadingI = false, loadingR = false
    private var failI = 0, failR = 0
    private var currentKind = ""
    private var earned = false

    init(host: UIViewController, js: @escaping (String) -> Void) {
        self.host = host
        self.js = js
        // IDs reais: ios/project.yml (ADMOB_INTERSTITIAL_ID / ADMOB_REWARDED_ID) -> Info.plist
        let info = Bundle.main.infoDictionary ?? [:]
        realInterstitial = (info["RCAdMobInterstitialID"] as? String) ?? ""
        realRewarded = (info["RCAdMobRewardedID"] as? String) ?? ""
        super.init()
    }

    // MARK: - Inicialização (só quando o jogo está com anúncios ligados)

    func prepare(test: Bool) {
        #if DEBUG
        let newTest = true
        #else
        let newTest = test
        #endif
        if started && newTest != testMode {
            interstitial = nil
            rewarded = nil
        }
        testMode = newTest
        if started {
            if ready { preload() }
            return
        }
        started = true

        let rc = MobileAds.shared.requestConfiguration
        rc.ageRestrictedTreatment = .child                      // = TFCD true + TFUA true
        rc.maxAdContentRating = GADMaxAdContentRating.general  // classificação G (livre)
        rc.publisherPrivacyPersonalizationState = .disabled     // sem personalização
        rc.coarseLocationCollectionEnabled = false              // sem localização

        MobileAds.shared.start(completionHandler: { [weak self] _ in
            DispatchQueue.main.async {
                guard let self else { return }
                self.ready = true
                self.preload()
            }
        })
    }

    private func isUsable(_ id: String) -> Bool { !id.isEmpty && !id.contains("$(") }
    private var interstitialID: String { testMode || !isUsable(realInterstitial) ? Self.testInterstitial : realInterstitial }
    private var rewardedID: String { testMode || !isUsable(realRewarded) ? Self.testRewarded : realRewarded }

    private func preload() {
        loadInterstitial()
        loadRewarded()
    }

    private func loadInterstitial() {
        guard ready, !loadingI else { return }
        if interstitial != nil && Date().timeIntervalSince(interstitialAt) < Self.maxAge { return }
        interstitial = nil
        loadingI = true
        let id = interstitialID
        Task { [weak self] in
            do {
                let ad = try await InterstitialAd.load(with: id, request: Request())
                guard let self else { return }
                self.loadingI = false
                self.failI = 0
                ad.fullScreenContentDelegate = self
                self.interstitial = ad
                self.interstitialAt = Date()
            } catch {
                guard let self else { return }
                self.loadingI = false
                self.failI += 1
                self.retryLoad(rewarded: false, after: Self.backoff(self.failI))
            }
        }
    }

    private func loadRewarded() {
        guard ready, !loadingR else { return }
        if rewarded != nil && Date().timeIntervalSince(rewardedAt) < Self.maxAge { return }
        rewarded = nil
        loadingR = true
        let id = rewardedID
        Task { [weak self] in
            do {
                let ad = try await RewardedAd.load(with: id, request: Request())
                guard let self else { return }
                self.loadingR = false
                self.failR = 0
                ad.fullScreenContentDelegate = self
                self.rewarded = ad
                self.rewardedAt = Date()
            } catch {
                guard let self else { return }
                self.loadingR = false
                self.failR += 1
                self.retryLoad(rewarded: true, after: Self.backoff(self.failR))
            }
        }
    }

    // nova tentativa depois de 30 s, 60 s, 120 s ... no máximo 10 min
    private static func backoff(_ n: Int) -> TimeInterval { min(600, 30 * pow(2, Double(min(5, n - 1)))) }

    private func retryLoad(rewarded: Bool, after seconds: TimeInterval) {
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak self] in
            guard let self else { return }
            if rewarded { self.loadRewarded() } else { self.loadInterstitial() }
        }
    }

    // MARK: - Exibição

    private func presenter() -> UIViewController? {
        guard let h = host, h.viewIfLoaded?.window != nil, h.presentedViewController == nil else { return nil }
        return h
    }

    func showInterstitial() {
        if showing { return done(shown: false, rewarded: false, reason: "busy") }
        let ad = (interstitial != nil && Date().timeIntervalSince(interstitialAt) < Self.maxAge) ? interstitial : nil
        guard let ad, let vc = presenter() else {
            done(shown: false, rewarded: false, reason: ready ? "not-ready" : "not-initialized")
            loadInterstitial()
            return
        }
        interstitial = nil
        showing = true
        currentKind = "interstitial"
        ad.present(from: vc)
    }

    func showRewarded() {
        if showing { return done(shown: false, rewarded: false, reason: "busy") }
        let ad = (rewarded != nil && Date().timeIntervalSince(rewardedAt) < Self.maxAge) ? rewarded : nil
        guard let ad, let vc = presenter() else {
            done(shown: false, rewarded: false, reason: ready ? "not-ready" : "not-initialized")
            loadRewarded()
            return
        }
        rewarded = nil
        showing = true
        currentKind = "rewarded"
        earned = false
        ad.present(from: vc, userDidEarnRewardHandler: { [weak self] in
            self?.earned = true
        })
    }

    // MARK: - FullScreenContentDelegate

    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        js("window.__adStarted && window.__adStarted()")
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        let kind = currentKind
        showing = false
        currentKind = ""
        if kind == "rewarded" {
            // a recompensa às vezes chega um instante depois do fechamento
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
                guard let self else { return }
                self.done(shown: true, rewarded: self.earned, reason: self.earned ? "rewarded" : "dismissed")
                self.loadRewarded()
            }
        } else {
            done(shown: true, rewarded: false, reason: "dismissed")
            loadInterstitial()
        }
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        let kind = currentKind
        showing = false
        currentKind = ""
        done(shown: false, rewarded: false, reason: "show-failed")
        if kind == "rewarded" { loadRewarded() } else { loadInterstitial() }
    }

    private func done(shown: Bool, rewarded: Bool, reason: String) {
        js("window.__adDone && window.__adDone({\"shown\":\(shown),\"rewarded\":\(rewarded),\"reason\":\"\(reason)\"})")
    }
}

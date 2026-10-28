// App iOS do Marileo Kart: o jogo vem guardado dentro do app (pasta "www")
// e roda numa WKWebView em tela cheia, deitado, funcionando até sem internet
// (só o modo Online com Amigos precisa de conexão).
import SwiftUI
import WebKit
import UniformTypeIdentifiers

@main
struct MarileoKartApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .background(Color("LaunchBackground"))
        }
    }
}

struct GameView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> GameViewController { GameViewController() }
    func updateUIViewController(_ vc: GameViewController, context: Context) {}
}

final class GameViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    static let scheme = "marileo"
    static let startURL = URL(string: "marileo://localhost/index.html")!
    private var web: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        let bg = UIColor(red: 11 / 255, green: 13 / 255, blue: 36 / 255, alpha: 1)
        view.backgroundColor = bg

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: Self.scheme)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        // o jogo usa window.IOSApp.share(texto) para convidar amigos para a sala
        let bridge = "window.IOSApp = { share: function (t) { window.webkit.messageHandlers.share.postMessage(String(t)); } };"
        config.userContentController.addUserScript(WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(WeakHandler(self), name: "share")

        web = WKWebView(frame: view.bounds, configuration: config)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.isOpaque = false
        web.backgroundColor = bg
        web.scrollView.backgroundColor = bg
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        web.allowsLinkPreview = false
        web.navigationDelegate = self
        web.uiDelegate = self
        view.addSubview(web)
        web.load(URLRequest(url: Self.startURL))

        NotificationCenter.default.addObserver(self, selector: #selector(willResignActive),
                                               name: UIApplication.willResignActiveNotification, object: nil)
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    // ligação, notificação, app em segundo plano: pausa a corrida (fora do modo online)
    @objc private func willResignActive() {
        web.evaluateJavaScript("window.app && window.app.screen === 'race' && !(window.app.race && window.app.race.online) && window.app.pause && window.app.pause(); 0", completionHandler: nil)
    }

    // links que saem do jogo (ex.: WhatsApp) abrem fora do app
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme == Self.scheme || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data" {
            return decisionHandler(.allow)
        }
        if action.targetFrame?.isMainFrame ?? true {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    // se o sistema fechar o motor da página (falta de memória), recarrega o jogo
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.load(URLRequest(url: Self.startURL))
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "share", let text = message.body as? String else { return }
        let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        if let pop = sheet.popoverPresentationController { // iPad
            pop.sourceView = view
            pop.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            pop.permittedArrowDirections = []
        }
        present(sheet, animated: true)
    }
}

// Evita que a página segure o controlador para sempre.
final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(ucc, didReceive: message)
    }
}

// Entrega os arquivos do jogo guardados no app em marileo://localhost/...
// (um endereço "de verdade" permite módulos JavaScript, salvar progresso e o modo online).
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root = Bundle.main.resourceURL!.appendingPathComponent("www", isDirectory: true)

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            let resp = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: [:])!
            task.didReceive(resp)
            task.didReceive(Data())
            task.didFinish()
            return
        }
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": Self.mime(for: file.pathExtension),
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        ])!
        task.didReceive(resp)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    static func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "webmanifest": return "application/json"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "svg": return "image/svg+xml"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        default: return UTType(filenameExtension: ext)?.preferredMIMEType ?? "application/octet-stream"
        }
    }
}

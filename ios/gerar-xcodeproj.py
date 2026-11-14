#!/usr/bin/env python3
"""Gera ios/MarileoKart.xcodeproj SEM XcodeGen e SEM o SDK do AdMob (versão local de teste).
Serve para rodar o app no Simulador ou no iPhone ligado por cabo. Para a loja continue usando
`xcodegen generate` (project.yml), que inclui o AdMob. Antes: python3 ios/build-web.py
Uso: python3 ios/gerar-xcodeproj.py [ID_DO_TIME_APPLE]"""
import plistlib, sys
from pathlib import Path

ios = Path(__file__).resolve().parent
team = sys.argv[1] if len(sys.argv) > 1 else ''
if not (ios / 'www/index.html').exists():
    sys.exit('Falta a pasta ios/www: rode antes  python3 ios/build-web.py')

# Info.plist (mesmos valores do project.yml, sem AdMob/SKAdNetwork)
info = {
    'CFBundleDevelopmentRegion': 'pt-BR', 'CFBundleDisplayName': 'Race Cities', 'CFBundleName': 'Race Cities',
    'CFBundleExecutable': '$(EXECUTABLE_NAME)', 'CFBundleIdentifier': '$(PRODUCT_BUNDLE_IDENTIFIER)',
    'CFBundlePackageType': 'APPL', 'CFBundleInfoDictionaryVersion': '6.0',
    'CFBundleShortVersionString': '$(MARKETING_VERSION)', 'CFBundleVersion': '$(CURRENT_PROJECT_VERSION)',
    'LSRequiresIPhoneOS': True, 'LSApplicationCategoryType': 'public.app-category.racing-games',
    'ITSAppUsesNonExemptEncryption': False, 'UIRequiresFullScreen': True, 'UIStatusBarHidden': True,
    'UIViewControllerBasedStatusBarAppearance': False, 'UILaunchScreen': {'UIColorName': 'LaunchBackground'},
    'UISupportedInterfaceOrientations': ['UIInterfaceOrientationLandscapeRight', 'UIInterfaceOrientationLandscapeLeft'],
    'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationLandscapeRight', 'UIInterfaceOrientationLandscapeLeft'],
    'UIApplicationSceneManifest': {'UIApplicationSupportsMultipleScenes': False},
    'GCSupportsControllerUserInteraction': True,
    'NSLocalNetworkUsageDescription': 'O modo Online com Amigos conecta os celulares que estão jogando juntos.',
}
with open(ios / 'MarileoKart/Info.plist', 'wb') as f: plistlib.dump(info, f)

def ident(n): return f'{n:024X}'
SW = ['MarileoKartApp.swift', 'GameAds.swift']
ids = dict(proj=1, group_main=2, group_app=3, group_prod=4, target=5, product=6, src_phase=7, res_phase=8, fw_phase=9,
           cfg_list_proj=10, cfg_list_tgt=11, cfg_dbg_p=12, cfg_rel_p=13, cfg_dbg_t=14, cfg_rel_t=15,
           assets_ref=16, assets_build=17, www_ref=18, www_build=19, plist_ref=20)
for i, s in enumerate(SW): ids[f'sw{i}_ref'] = 30 + i; ids[f'sw{i}_build'] = 40 + i
I = {k: ident(v) for k, v in ids.items()}

def build_settings(extra):
    return '\n'.join(f'\t\t\t\t{k} = {v};' for k, v in extra.items())
common = {'SDKROOT': 'iphoneos', 'IPHONEOS_DEPLOYMENT_TARGET': '16.0', 'SWIFT_VERSION': '5.0', 'ONLY_ACTIVE_ARCH': 'YES'}
tgt = {'PRODUCT_BUNDLE_IDENTIFIER': 'com.marileostudios.racecities', 'PRODUCT_NAME': '"Race Cities"',
       'MARKETING_VERSION': '1.0', 'CURRENT_PROJECT_VERSION': '1', 'TARGETED_DEVICE_FAMILY': '"1,2"',
       'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon', 'CODE_SIGN_STYLE': 'Automatic',
       'GENERATE_INFOPLIST_FILE': 'NO', 'INFOPLIST_FILE': 'MarileoKart/Info.plist',
       'LD_RUNPATH_SEARCH_PATHS': '"$(inherited) @executable_path/Frameworks"', 'SWIFT_EMIT_LOC_STRINGS': 'YES'}
if team: tgt['DEVELOPMENT_TEAM'] = team
dbg = {'SWIFT_ACTIVE_COMPILATION_CONDITIONS': 'DEBUG', 'SWIFT_OPTIMIZATION_LEVEL': '"-Onone"', 'ONLY_ACTIVE_ARCH': 'YES'}
rel = {'SWIFT_OPTIMIZATION_LEVEL': '"-O"', 'ONLY_ACTIVE_ARCH': 'NO'}
common_noarch = {k: v for k, v in common.items() if k != 'ONLY_ACTIVE_ARCH'}

def cfg(key, name, d): return f'\t\t{I[key]} /* {name} */ = {{\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {{\n{build_settings(d)}\n\t\t\t}};\n\t\t\tname = {name};\n\t\t}};'

lines = ['// !$*UTF8*$!', '{', '\tarchiveVersion = 1;', '\tclasses = {', '\t};', '\tobjectVersion = 56;', '\tobjects = {', '']
for i, s in enumerate(SW):
    lines += [f'\t\t{I[f"sw{i}_build"]} = {{isa = PBXBuildFile; fileRef = {I[f"sw{i}_ref"]}; }};',
              f'\t\t{I[f"sw{i}_ref"]} = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {s}; sourceTree = "<group>"; }};']
lines += [f'\t\t{I["assets_build"]} = {{isa = PBXBuildFile; fileRef = {I["assets_ref"]}; }};',
          f'\t\t{I["assets_ref"]} = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};',
          f'\t\t{I["www_build"]} = {{isa = PBXBuildFile; fileRef = {I["www_ref"]}; }};',
          f'\t\t{I["www_ref"]} = {{isa = PBXFileReference; lastKnownFileType = folder; path = www; sourceTree = "<group>"; }};',
          f'\t\t{I["plist_ref"]} = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};',
          f'\t\t{I["product"]} = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = "Race Cities.app"; sourceTree = BUILT_PRODUCTS_DIR; }};',
          f'\t\t{I["fw_phase"]} = {{isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; }};',
          f'\t\t{I["group_main"]} = {{isa = PBXGroup; children = ({I["group_app"]}, {I["www_ref"]}, {I["group_prod"]}); sourceTree = "<group>"; }};',
          f'\t\t{I["group_app"]} = {{isa = PBXGroup; children = ({", ".join(I[f"sw{i}_ref"] for i in range(len(SW)))}, {I["assets_ref"]}, {I["plist_ref"]}); path = MarileoKart; sourceTree = "<group>"; }};',
          f'\t\t{I["group_prod"]} = {{isa = PBXGroup; children = ({I["product"]}); name = Products; sourceTree = "<group>"; }};',
          f'\t\t{I["src_phase"]} = {{isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = ({", ".join(I[f"sw{i}_build"] for i in range(len(SW)))}); runOnlyForDeploymentPostprocessing = 0; }};',
          f'\t\t{I["res_phase"]} = {{isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = ({I["assets_build"]}, {I["www_build"]}); runOnlyForDeploymentPostprocessing = 0; }};',
          f'\t\t{I["target"]} = {{isa = PBXNativeTarget; buildConfigurationList = {I["cfg_list_tgt"]}; buildPhases = ({I["src_phase"]}, {I["fw_phase"]}, {I["res_phase"]}); buildRules = (); dependencies = (); name = MarileoKart; productName = MarileoKart; productReference = {I["product"]}; productType = "com.apple.product-type.application"; }};',
          f'\t\t{I["proj"]} = {{isa = PBXProject; attributes = {{BuildIndependentTargetsInParallel = 1; LastUpgradeCheck = 2700;}}; buildConfigurationList = {I["cfg_list_proj"]}; compatibilityVersion = "Xcode 14.0"; developmentRegion = "pt-BR"; hasScannedForEncodings = 0; knownRegions = (en, "pt-BR", Base); mainGroup = {I["group_main"]}; productRefGroup = {I["group_prod"]}; projectDirPath = ""; projectRoot = ""; targets = ({I["target"]}); }};',
          cfg('cfg_dbg_p', 'Debug', {**common, **dbg}), cfg('cfg_rel_p', 'Release', {**common_noarch, **rel}),
          cfg('cfg_dbg_t', 'Debug', tgt), cfg('cfg_rel_t', 'Release', tgt),
          f'\t\t{I["cfg_list_proj"]} = {{isa = XCConfigurationList; buildConfigurations = ({I["cfg_dbg_p"]}, {I["cfg_rel_p"]}); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }};',
          f'\t\t{I["cfg_list_tgt"]} = {{isa = XCConfigurationList; buildConfigurations = ({I["cfg_dbg_t"]}, {I["cfg_rel_t"]}); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }};',
          '\t};', f'\trootObject = {I["proj"]};', '}']
proj = ios / 'MarileoKart.xcodeproj'
proj.mkdir(exist_ok=True)
(proj / 'project.pbxproj').write_text('\n'.join(lines) + '\n', encoding='utf8')
print(f'Projeto gerado: {proj} (sem AdMob). Abra com:  open {proj}')

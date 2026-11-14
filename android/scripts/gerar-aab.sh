#!/bin/bash
# Gera o pacote .aab do Race Cities para a Play Store, assinado com a chave de envio.
# Uso: android/scripts/gerar-aab.sh [versionCode] [versionName]   (padrão: 1 e 1.0)
# Precisa de ~/RaceCitiesChaves/keystore.properties (criado por criar-chave.sh).
set -e
cd "$(dirname "$0")/.."
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
KP="$HOME/RaceCitiesChaves/keystore.properties"
[ -f "$KP" ] || { echo "Falta $KP — rode android/scripts/criar-chave.sh primeiro."; exit 1; }
prop() { grep "^$1=" "$KP" | head -1 | cut -d= -f2-; }
export ANDROID_KEYSTORE_FILE="$(prop storeFile)"
export ANDROID_KEYSTORE_PASSWORD="$(prop storePassword)"
export ANDROID_KEY_ALIAS="$(prop keyAlias)"
export ANDROID_KEY_PASSWORD="$(prop keyPassword)"
export VERSION_CODE="${1:-1}"
export VERSION_NAME="${2:-1.0}"
BUILD="$HOME/RaceCitiesBuild/android"
GRADLE="$HOME/.gradle/wrapper/dists/gradle-8.14.6-bin/$(ls "$HOME/.gradle/wrapper/dists/gradle-8.14.6-bin" | head -1)/gradle-8.14.6/bin/gradle"
if [ -x "$GRADLE" ]; then RUN="$GRADLE"; else RUN="./gradlew"; fi
"$RUN" --no-daemon -PRC_BUILD_DIR="$BUILD" bundleRelease
OUT="$BUILD/outputs/bundle/release/app-release.aab"
mkdir -p "$HOME/RaceCitiesChaves/pacotes"
cp "$OUT" "$HOME/RaceCitiesChaves/pacotes/RaceCities-$VERSION_NAME-versao$VERSION_CODE.aab"
echo "Pacote: $HOME/RaceCitiesChaves/pacotes/RaceCities-$VERSION_NAME-versao$VERSION_CODE.aab"

#!/bin/sh
# Gera o APK do Marileo Kart (app Android que abre o jogo do site).
# Uso: ANDROID_HOME=/caminho/sdk KEYSTORE=chave.jks KS_PASS=senha VERSION_CODE=1 VERSION_NAME=1.0 ./build.sh
set -e
cd "$(dirname "$0")"
BT="$ANDROID_HOME/build-tools/35.0.0"
JAR="$ANDROID_HOME/platforms/android-35/android.jar"
OUT=build
rm -rf $OUT && mkdir -p $OUT/gen $OUT/classes $OUT/dex
"$BT/aapt2" compile --dir res -o $OUT/res.zip
"$BT/aapt2" link -o $OUT/base.apk -I "$JAR" --manifest AndroidManifest.xml \
  --min-sdk-version 24 --target-sdk-version 35 \
  --version-code "${VERSION_CODE:-1}" --version-name "${VERSION_NAME:-1.0}" \
  --java $OUT/gen $OUT/res.zip
javac -encoding UTF-8 --release 11 -classpath "$JAR" -d $OUT/classes $(find src $OUT/gen -name '*.java')
"$BT/d8" --release --min-api 24 --lib "$JAR" --output $OUT/dex $(find $OUT/classes -name '*.class')
(cd $OUT/dex && zip -q -u ../base.apk classes.dex)
"$BT/zipalign" -f -p 4 $OUT/base.apk $OUT/aligned.apk
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --out $OUT/marileo-kart.apk $OUT/aligned.apk
"$BT/apksigner" verify --print-certs $OUT/marileo-kart.apk | head -3
echo "APK pronto: android/$OUT/marileo-kart.apk"

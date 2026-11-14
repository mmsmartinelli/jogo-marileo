#!/bin/bash
# Cria a chave de envio (upload) do Race Cities para a Play Store.
# Rode no Terminal. A senha é digitada por você e NÃO aparece na tela.
# Chave só do Race Cities: pasta ~/RaceCitiesChaves (nunca usa a do Teleprompter).
set -e
DIR="$HOME/RaceCitiesChaves"
KT="$HOME/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home/bin/keytool"
mkdir -p "$DIR"
cd "$DIR"
if [ -f race-cities-upload.jks ]; then
  echo "Já existe uma chave nesta pasta. Nada foi feito."
  exit 1
fi
echo ""
echo "Crie uma senha para a chave do Race Cities (mínimo 6 caracteres)."
echo "Ela NÃO aparece enquanto você digita. Guarde-a num lugar seguro."
read -r -s -p "Senha: " P1; echo
read -r -s -p "Repita a senha: " P2; echo
if [ "$P1" != "$P2" ]; then echo "As senhas não conferem. Rode de novo."; exit 1; fi
if [ ${#P1} -lt 6 ]; then echo "Senha curta demais (mínimo 6). Rode de novo."; exit 1; fi
export RC_PASS="$P1"
"$KT" -genkeypair -keystore race-cities-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass:env RC_PASS -keypass:env RC_PASS \
  -dname "CN=Marcos Martinelli, O=Marileo Studios, L=Sao Paulo, ST=SP, C=BR" >/dev/null 2>&1
"$KT" -export -rfc -keystore race-cities-upload.jks -alias upload -storepass:env RC_PASS -file upload_certificate.pem >/dev/null 2>&1
umask 077
printf 'storeFile=%s\nstorePassword=%s\nkeyAlias=upload\nkeyPassword=%s\n' "$DIR/race-cities-upload.jks" "$P1" "$P1" > keystore.properties
chmod 600 keystore.properties race-cities-upload.jks
unset RC_PASS P1 P2
echo ""
echo "✅ Pronto! Chave criada em $DIR"
echo "FAÇA UMA CÓPIA da pasta RaceCitiesChaves num lugar seguro (pen drive/cofre): sem a chave não dá para atualizar o app."
echo "Pode voltar para o Claude."

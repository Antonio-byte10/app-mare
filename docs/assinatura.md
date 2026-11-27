# Chave de lançamento do APK

Todo APK do Maré publicado no GitHub precisa ser assinado **sempre com a mesma chave**. O Android só instala uma atualização por cima se a chave for igual. **Se a chave se perder, ninguém consegue atualizar o app**: cada pessoa teria que desinstalar, e perderia os dados.

A chave e as senhas **nunca entram no repositório**. O plugin [`plugins/with-assinatura.js`](../plugins/with-assinatura.js) lê esses valores da pasta do Gradle, na hora do build.

## 1. Criar a chave (uma vez só)

Use o `keytool` do JDK em `D:/android/jdk21/bin`. Rode no PowerShell, numa pasta **fora** do repositório:

```powershell
D:\android\jdk21\bin\keytool.exe -genkeypair -v -keystore D:\chaves\mare-lancamento.keystore -alias mare -keyalg RSA -keysize 4096 -validity 36500
```

- O `keytool` pede uma senha e alguns dados. Os dados podem ser genéricos, como o nome "Maré" e o país "BR".
- Use uma senha longa e guarde-a no seu gerenciador de senhas.
- `-validity 36500` dá uma validade de 100 anos.

## 2. Guardar em dois lugares

Guarde a cópia do arquivo `mare-lancamento.keystore` e a senha em dois lugares separados e offline. Por exemplo:

- o gerenciador de senhas, que aceita anexos;
- um pendrive cifrado.

Não envie a chave para o GitHub, para o Drive aberto nem por mensagem.

## 3. Configurar a máquina que gera o APK

Crie ou edite o arquivo `D:\android\gradle\gradle.properties`. Esta é a pasta do Gradle que [`scripts/android-env.mjs`](../scripts/android-env.mjs) usa. Ponha nele:

```properties
MARE_UPLOAD_STORE_FILE=D:/chaves/mare-lancamento.keystore
MARE_UPLOAD_STORE_PASSWORD=a-senha-da-chave
MARE_UPLOAD_KEY_ALIAS=mare
MARE_UPLOAD_KEY_PASSWORD=a-senha-da-chave
```

## 4. Gerar o APK de lançamento

```powershell
npm run apk:lancamento
```

O comando:

- recusa gerar o APK se faltar a chave;
- gera `dist/mare-<versão>.apk`, só para celulares ARM;
- mostra o SHA-256, para você colar na descrição da Release.

O `npm run apk:teste` continua gerando o APK de teste com a chave de debug.

**Antes de cada Release:**

- suba `version` e `versionCode` no `app.json`, e a `version` no `package.json`;
- crie a tag no formato `v1.0.0`. O botão "Procurar atualização" do app compara por ela.

## Conferir a assinatura

```powershell
D:\android\sdk\build-tools\<versão>\apksigner.bat verify --print-certs dist\mare-<versão>.apk
```

O certificado mostrado deve ser o da sua chave, e não o "Android Debug". Ele precisa ser o mesmo em todas as Releases.

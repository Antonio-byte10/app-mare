# Verificação no Android

Roteiro para rodar no celular quando ele estiver conectado. O APK de teste já foi gerado e checado no computador (JavaScript embutido, SQLCipher ligado), mas **nada disso foi visto rodando num aparelho**.

## Preparar

1. No celular: ativar "Opções do desenvolvedor" e "Depuração USB". Conectar o cabo e aceitar a chave RSA.
2. No computador: `D:/android/sdk/platform-tools/adb.exe devices` deve listar o aparelho.
3. Gerar o APK de teste, se ainda não existir: `npm run apk:teste`. Sai em `dist/mare-<versão>-teste.apk`, assinado com a chave de debug do modelo do Expo (nenhuma chave real).
4. Instalar: `adb install -r dist/mare-0.1.0-teste.apk`.

## Conferências no aparelho

- [ ] **Abre sem travar.** O app abre na tela Início, com fundo azul escuro, sem tela branca nem erro.
- [ ] **Criar 2 hábitos.** Um "parar" (ex.: tabaco) e um "reduzir" (ex.: álcool, limite por dia com unidade).
- [ ] **Responder relatos.** No relato do dia, responder os dois hábitos (um como livre, outro com quantidade) e salvar. Voltar a um dia anterior e responder também.
- [ ] **Persistência.** Fechar o app à força (Configurações, Apps, Maré, Forçar parada) e reabrir. Hábitos, relatos, sequência e calendário continuam iguais.
- [ ] **Deslizador no toque.** Na tela de relato, de um hábito "reduzir": tocar na trilha e arrastar o dedo. O valor acompanha o dedo, não pula, e a página não rola junto enquanto arrasta. (Pendência da Task 8.)
- [ ] **Reduzir movimento.** Configurações do Android, Acessibilidade, "Remover animações" (em alguns aparelhos "Reduzir movimento"). Voltar ao app: as ondas do anel de água do Início ficam paradas. Desligar a opção: as ondas voltam.
- [ ] **Trio.** No Início e em Marcos, o texto dos três números (Trio) cabe sem cortar nem quebrar de forma feia. Repetir com fonte do sistema em "Grande" (Configurações, Tela, Tamanho da fonte).
- [ ] **Marcos, Diário e Mais.** As abas abrem; o calendário do Diário mostra os dias respondidos; "Mais" lista os hábitos.
- [ ] **Texto.** Nenhuma tela mostra "fracasso", "limpo", "sujo" ou "recaída"; o deslize aparece com contorno areia, nunca vermelho.
- [ ] **Voltar do Android.** O botão/gesto de voltar sai das telas internas sem fechar o app por engano.

## Conferir a criptografia do banco

O banco fica em `files/SQLite/mare.db` dentro da pasta privada do app (valor de `defaultDatabaseDirectory` do expo-sqlite no Android: `<filesDir>/SQLite`). O caminho `databases/mare.db` do plano **não** é o do expo-sqlite.

O `adb run-as` só funciona em app **depurável**. O APK de teste é de release e **não** é depurável (`run-as: package not debuggable`). Duas formas de conferir:

**A. Build de desenvolvimento (recomendado).** Com o celular conectado: `npm run android`. Esse build é depurável. Depois de criar os hábitos:

```
adb shell run-as com.mare.app head -c 64 files/SQLite/mare.db | xxd
adb shell run-as com.mare.app grep -c "SQLite format 3" files/SQLite/mare.db
```

**B. Emulador ou aparelho com root.** `adb root`, depois `adb shell head -c 64 /data/data/com.mare.app/files/SQLite/mare.db | xxd`.

Resultado esperado:

- [ ] A saída **não** contém o texto `SQLite format 3` (um banco comum começa com ele; um cifrado parece aleatório).
- [ ] Nenhum nome de hábito aparece: `adb shell run-as com.mare.app grep -c "<nome do hábito>" files/SQLite/mare.db` retorna `0`.
- [ ] Os arquivos `mare.db-wal` e `mare.db-shm`, se existirem, também não mostram nomes de hábitos.
- [ ] A chave não está no banco: ela fica no Keystore via `expo-secure-store` (entrada `mare.db.key`).

Se aparecer `SQLite format 3` ou um nome de hábito, **o banco não está cifrado**: parar e avisar, não distribuir o APK.

## Comandos

```
npm test
npm run lint
npm run typecheck
```

## Resultado

Preencher depois de rodar no aparelho: data, modelo do celular, versão do Android e o que falhou.

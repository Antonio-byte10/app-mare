# Provedores de IA — Gemini, ChatGPT (OpenAI) e Claude

> Pesquisa feita na documentação oficial em 25/11/2026. Decisão do projeto: **cada pessoa usa a própria IA**.
> Sem IA, o app funciona por inteiro. As funções com IA ficam disponíveis assim que a pessoa escolhe um provedor e cola a chave dela.

## 1. Como cada API é chamada (REST, sem SDK)

O app é React Native (Expo), e o SDK oficial da Anthropic diz que **React Native não é suportado**. Por isso os três provedores serão chamados por **HTTP direto** com o `fetch` do Expo (`expo/fetch`). No Android ele já é o `fetch` global e **lê a resposta em streaming** (`resp.body.getReader()`), o que permite mostrar o texto aparecendo aos poucos.

| | **Gemini (Google)** | **ChatGPT (OpenAI)** | **Claude (Anthropic)** |
|---|---|---|---|
| Endpoint de chat | `POST https://generativelanguage.googleapis.com/v1beta/models/{modelo}:streamGenerateContent?alt=sse` | `POST https://api.openai.com/v1/responses` | `POST https://api.anthropic.com/v1/messages` |
| Autenticação | header `x-goog-api-key: <chave>` | header `Authorization: Bearer <chave>` | headers `x-api-key: <chave>` + `anthropic-version: 2026-10-21` |
| Instrução de sistema | `systemInstruction: { parts: [{ text }] }` | `instructions: "..."` | `system: "..."` |
| Histórico | `contents: [{ role: "user" \| "model", parts: [{ text }] }]` | `input: [{ role: "user" \| "assistant", content }]` | `messages: [{ role: "user" \| "assistant", content }]` |
| Limite de resposta | `generationConfig.maxOutputTokens` | `max_output_tokens` | `max_tokens` |
| Streaming | `?alt=sse` → cada evento traz `candidates[0].content.parts[].text`; fim em `finishReason` (`STOP`, `MAX_TOKENS`, `SAFETY`) | `stream: true` → evento `response.output_text.delta` (campo `delta`); fim em `response.completed`; erro em `error` | `stream: true` → evento `content_block_delta` com `delta.type == "text_delta"` (campo `text`); fim em `message_stop` |
| Não guardar a conversa no servidor | os registros (logs) vêm ligados por padrão em projetos novos (55 dias); a própria pessoa desliga no AI Studio → Logs | `store: false` (o padrão guarda por 30 dias) | sem armazenamento de conversa por padrão |
| Listar modelos (testar a chave) | `GET https://generativelanguage.googleapis.com/v1beta/models` | `GET https://api.openai.com/v1/models` | `GET https://api.anthropic.com/v1/models` |
| Parâmetros a **não** enviar | `temperature`/`topP`/`topK` (ignorados nos modelos novos) | — | `temperature`/`top_p`/`top_k` (400 na versão `2026-10-21`); sem "prefill" de assistente |

### Observações por provedor
- **Gemini:** o Google recomenda a nova **Interactions API** (`/v1beta/interactions`) para projetos novos. A `generateContent` está marcada como "legada", mas **segue suportada**. Escolhemos a `generateContent` porque:
  - a documentação mostra com clareza o histórico completo enviado a cada pedido;
  - o Forja já usa essa API.

  A Interactions API **guarda a conversa no servidor por padrão** (`store=true`). Se um dia migrarmos para ela, temos que mandar `store: false`.
- **OpenAI:** a API de **Responses** é a atual. Para não deixar a conversa guardada por 30 dias, mandar sempre `store: false`. Pelos termos da OpenAI, dados da API não são usados para treinar modelos sem consentimento.
- **Claude:** chamada via HTTP direto, pois o SDK não roda em React Native. Uma resposta pode terminar com `stop_reason: "refusal"`. Nesse caso, mostrar uma mensagem gentil e o botão de SOS, sem quebrar a tela.

## 2. Modelos sugeridos (a pessoa pode trocar)

| Provedor | Padrão sugerido | Por quê | Alternativa |
|---|---|---|---|
| Gemini | `gemini-3.5-flash-lite` | Mais rápido e barato, **tem plano gratuito** (mesmo do Forja) | `gemini-4-hydrogen` (mais capaz, também no plano gratuito) |
| OpenAI | `gpt-5.5` | Aparece nos exemplos oficiais | `gpt-6.2-astra` |
| Claude | `claude-opus-5-5` | O modelo atual recomendado ($4 / $20 por milhão de tokens) | `claude-haiku-5-5`, bem mais barato ($0,10 / $0,50) e rápido para conversa — **escolha da pessoa** |

A tela de configuração busca a lista real de modelos (endpoint de listagem acima) com a chave da pessoa. Assim, nomes novos aparecem sem precisar atualizar o app.

## 3. Privacidade — o que avisar a quem usa

- **Plano gratuito do Gemini:** os termos de "serviços não pagos" do Google permitem usar os dados para melhorar produtos, e os registros vêm ligados por padrão. Para conversas sobre álcool e sexualidade, o app deve **avisar isso antes do primeiro uso** e recomendar:
  - desligar os registros no AI Studio;
  - ou usar uma chave com faturamento ativo.
- **OpenAI:** o app sempre envia `store: false`.
- **Todos:** o app manda só o necessário (meta, dias, gatilhos registrados, a conversa). Nunca nome, telefone ou o contato de confiança. O histórico do chat fica **só no celular** e pode ser apagado.

## 4. Desenho no código (proposta)

```
src/lib/ia/
  tipos.ts        // Provedor = 'gemini' | 'openai' | 'claude'; Mensagem = { papel: 'usuario' | 'ia', texto }
  gemini.ts       // monta o pedido e lê o SSE do Gemini
  openai.ts       // idem OpenAI (store:false)
  claude.ts       // idem Claude (anthropic-version 2026-10-21)
  sse.ts          // leitor de SSE comum (linhas "event:" / "data:"), testado com vitest
  conversar.ts    // escolhe o adaptador, aplica os trilhos de segurança, devolve um fluxo de texto
  seguranca.ts    // detecção de crise SEM IA (palavras/padrões) → CVV 188 / SAMU 192
  instrucoes.ts   // instrução de sistema única (estilo Entrevista Motivacional, sem dose de remédio)
```

- **Mesma interface para os três:** `conversar({ provedor, modelo, chave, historico, contexto }) → AsyncIterable<string>`.
- **Chave guardada no `expo-secure-store`** (cofre criptografado do Android), nunca no backup.
- **Testes:** cada adaptador é testado com respostas SSE gravadas (sem gastar chave), igual ao padrão do Forja.

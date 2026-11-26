# Design — App de sobriedade open source

> Data: 25/11/2026 · Status: **pronto para aprovação**
> Base: [pesquisa de fundamentos](../../01-pesquisa-fundamentos.md) · [provedores de IA](../../02-provedores-ia.md)
> Projeto irmão usado como referência técnica: `D:\app_mobile` (Forja).
>
> Legenda: **[decidido]** = escolha do dono do projeto · **[proposta]** = decisão minha, pode ser corrigida · **[construtor]** = detalhe deixado para quem implementar.

---

## 1. Intenção e porquê

Um app **gratuito e de código aberto**, em português do Brasil, para ajudar pessoas a **parar ou diminuir** três hábitos: **cigarro/nicotina, álcool e pornografia/masturbação compulsiva**. **[decidido]**

Por quê: vício é difícil de controlar e costuma vir com vergonha. Muita gente não procura ajuda. O app deve:
- funcionar como um apoio diário, discreto, acolhedor e baseado em evidência;
- ajudar a atravessar o momento da fissura;
- aproximar a pessoa de ajuda profissional e de pessoas reais, sem tentar substituí-las.

Ser open source e gratuito é parte do propósito: "as pessoas merecem isso".

**Como saber se deu certo:** uma pessoa com vergonha instala o app sem medo de ser descoberta. Na hora da fissura, ela abre o SOS em 1 toque e atravessa a onda. Depois de um deslize, ela continua usando o app em vez de desistir.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Contador de dias que **não pune** deslizes.
- SOS de crise a 1 toque.
- Check-in diário rápido.
- Plano de prevenção de recaída.
- Conteúdo educativo.
- Rede de apoio do Brasil.
- Visual calmante e bonito.
- **Tudo isso funciona sem IA e sem internet.** **[decidido]**
- Funções extras com **IA da própria pessoa** (Gemini, ChatGPT ou Claude). **[decidido]**
- Privacidade máxima: sem conta, dados no celular, bloqueio, disfarce.

**Não-objetivos (por enquanto)**
- iPhone/iOS e lojas de app. Só **Android, distribuído por APK no GitHub**. **[decidido]**
- Rede social, comunidade ou chat entre usuários dentro do app.
- Diagnóstico, prescrição ou recomendação de remédio/terapia. O app só informa e sugere "converse com seu psicólogo/médico". **[decidido]**
- Servidor central do projeto ou qualquer coleta de dados.

**Anti-objetivos (falhas mesmo que "funcione")**
- O app aumentar a vergonha: tom moralista, "zerar" a história, vermelho de erro, linguagem de "fracasso".
- O app virar ele próprio um gatilho: imagens de cigarro, bebida ou conteúdo sexual.
- Expor a pessoa: notificação reveladora, nome ou ícone óbvio, dados saindo do celular sem ela saber.
- A IA validar uma racionalização ("um drink não faz mal"), orientar dose de remédio ou falhar numa crise.
- Viciar no próprio app: rolagem infinita ou notificações manipuladoras.

## 3. Restrições

- **Plataforma:** Expo + React Native + TypeScript, **mesma base do Forja** (Expo SDK 58, Expo Router, Zustand). **[decidido]**
- **Distribuição:** APK assinado gerado localmente (`npm run build:apk`, mesmo esquema do Forja com ferramentas em `D:/android`) e publicado nas **Releases do GitHub**. **[decidido]**
- **Licença:** MIT, como o Forja. **[proposta]**
- **Idioma:** pt-BR. Textos centralizados para facilitar tradução futura. **[proposta]**
- **LGPD:** dados de saúde e vida sexual são dados pessoais sensíveis. Nada sai do aparelho, exceto o que a pessoa envia conscientemente à IA dela.
- **Expo muda a cada SDK:** antes de usar qualquer API do Expo, conferir a documentação versionada (mesma regra do `AGENTS.md` do Forja).

## 4. Abordagens consideradas

### 4.1 Plataforma
| Opção | Prós | Contras |
|---|---|---|
| **App nativo Expo (escolhido)** | Notificações, digital, cofre criptografado, vibração, disfarce de ícone, atalhos; reaproveita o Forja | Precisa gerar APK |
| PWA (web instalável) | Custo zero, sem APK | Disfarce, digital, notificações e armazenamento fracos — justamente o que a discrição e o SOS precisam |
| Os dois | Alcance | Dobra o esforço |

Escolhido: **Expo, só Android, APK no GitHub**. **[decidido]**

### 4.2 Quem fornece a IA
| Opção | Resumo |
|---|---|
| **A) Cada um com a sua IA (escolhida)** | A pessoa usa a própria chave. O app é completo sem IA. |
| B) Servidor da comunidade | O projeto paga a IA para todos. Há risco de abuso, custo e conversas sensíveis passando pelo projeto. |
| C) Híbrido | B + A. |

Escolhida: **A, com 3 provedores (Gemini, ChatGPT/OpenAI e Claude)**. **[decidido]** O terceiro foi interpretado como **Claude**. **[proposta — confirmar]**

### 4.3 Onde fica a chave
| Opção | Resumo |
|---|---|
| Só no celular | Mais simples, sem servidor |
| **Celular + Render opcional (escolhida)** | Padrão: chave no cofre do celular, app fala direto com o provedor. Opcional: servidor próprio no Render, como no Forja, para quem não quer a chave no aparelho |

**[decidido]**

## 5. Arquitetura

```
┌──────────────────────── Celular (Android) ────────────────────────┐
│  Telas (Expo Router)                                              │
│  Estado (Zustand) ──► armazenamento criptografado local           │
│  Lógica pura (contador, marcos, insights, detecção de crise)      │
│  Lembretes locais (expo-notifications) · Bloqueio (digital/PIN)   │
│  Módulo IA ──┬─► modo "Direto": Gemini | OpenAI | Claude (HTTPS)  │
│              └─► modo "Servidor": meu Render ──► provedor         │
└───────────────────────────────────────────────────────────────────┘
```

### 5.1 Pastas (seguindo o Forja)
| Pasta | Conteúdo |
|---|---|
| `src/app/` | Telas (Expo Router) |
| `src/components/` | Componentes visuais (Contador, Onda, Respiração, Cartão…) |
| `src/lib/` | Regras em funções puras + testes vitest (`contador.ts`, `marcos.ts`, `insights.ts`, `crise.ts`, `datas.ts`) |
| `src/lib/ia/` | Adaptadores dos 3 provedores, leitor SSE, instruções, segurança (ver [02-provedores-ia.md](../../02-provedores-ia.md)) |
| `src/conteudo/` | Textos da biblioteca, rede de apoio e mensagens de acolhimento, com referências |
| `src/store.ts` | Estado salvo, com versão e migração (padrão do Forja) |
| `src/theme.ts` | Tokens da paleta "Maré Calma", tipografia e espaçamentos |
| `scripts/` | `build-apk.mjs` (adaptado do Forja) e `servidor-ia.mjs` (multi-provedor) |
| `docs/` | Pesquisa, design e capturas de tela |

### 5.2 Dados no celular **[proposta]**
- Tudo local, **criptografado**: a chave de criptografia fica no `expo-secure-store` (Keystore do Android).
- Mecanismo sugerido: SQLite com SQLCipher (`expo-sqlite`) servindo de armazenamento do Zustand. **[construtor]** confirmar na documentação do SDK 58 e escolher a forma mais simples que garanta criptografia em repouso.
- **Backup:** exportar e importar um arquivo `.json` **cifrado com uma senha que a pessoa escolhe** (o padrão do Forja é texto puro; aqui não pode ser).
- A **chave de IA, o código do servidor e o PIN nunca entram no backup**.
- **Apagar tudo** com confirmação.
- **Política do bloqueio:** **[proposta]**
  - O bloqueio é uma **trava de tela**. Ele protege contra quem pega o celular.
  - Os dados ficam **criptografados em repouso** com uma chave do Keystore que **não depende** da digital/PIN do app. Assim, trocar a digital do celular ou esquecer o PIN **não apaga nada**.
  - **Esqueci o PIN:** desbloqueia com a senha/padrão de tela do próprio Android (credencial do aparelho) e cria um PIN novo.

### 5.3 Modelo de dados (conceitual) **[proposta]**
- **Hábito:**
  - `tipo` (tabaco | álcool | sexual) e `apelido` (o nome discreto que aparece na tela, ex.: "Fôlego", "Calmaria", "Foco"). Sem tipo "outro" na v1: outros vícios (jogo, drogas, remédios) pedem conteúdo e alertas de segurança próprios, já que parar benzodiazepínicos ou opioides de uma vez pode ser perigoso como no álcool. **[proposta]**
  - `meta` (parar | reduzir) e `limite` (para reduzir: ex. "até 2 doses, até 2 dias por semana");
  - `início`, `custo por dia` (opcional, para "dinheiro economizado") e `cor de acento`.
- **Registro do dia, por hábito:** `livre` | `dentro da meta` | `deslize`, com nota opcional.
- **Deslize:** data/hora, hábito, gatilhos, HALT (fome/raiva/solidão/cansaço), emoção, "o que farei diferente".
- **Fissura vencida:** data/hora, hábito, intensidade 0–10, o que ajudou (conta como conquista).
- **Check-in:** humor 1–5, fissura 0–10, HALT, gatilhos, nota livre.
- **Plano "se-então":** lista de pares "se acontecer X → eu faço Y".
- **Meus porquês:** textos, foto da galeria, áudio gravado pela própria pessoa.
- **Contatos de confiança:** nome e telefone (ficam só no celular; nunca vão para a IA).
- **Ajustes:** tema, disfarce, bloqueio, lembretes, IA (provedor, modelo, modo, endereço do servidor).

### 5.4 O contador que não pune
- **Os dias são contados pelo relato diário.** **[decidido]** Todo dia a pessoa responde um relato curto de como foi, com perguntas simples por hábito:
  - qual foi a vontade (0–10);
  - se usou ou não (na meta "reduzir": quanto);
  - opcional: humor, gatilhos, nota livre.

  O relato define o dia como `livre`, `dentro da meta` ou `deslize`.
- **Dia sem relato** fica como **pendente**, não conta nem quebra a sequência. Ao abrir o app, ele pede para preencher os dias pendentes (até 7 dias para trás). **[proposta]**
- Para cada hábito: **sequência atual**, **dias totais livres** (nunca zera) e **maior sequência**.
- Opcional: **% de dias livres nos últimos 30 dias**.
- Meta "reduzir": conta **dias dentro da meta** em vez de dias sem uso.
- Deslize **não apaga nada**. Abre o fluxo "Recomeçar com cuidado" (seção 6.5) e a sequência atual recomeça, mas o total e o histórico ficam.
- **Marcos:** 24 h, 3 dias, 1 semana, 2 semanas, 1 mês, 3 meses, 6 meses, 1 ano.
  - No tabaco, os marcos trazem os benefícios de saúde da OMS (ver pesquisa, 2.1).
  - Em todos os hábitos: dinheiro economizado e fissuras vencidas.
- Opção de **ocultar os números** para quem sente ansiedade com eles.
- Lógica em funções puras com testes: fusos horários, virada de dia, deslize no mesmo dia do início, registros retroativos.

## 6. Telas e fluxos

> **Referência visual aprovada:** mockups v2 em `docs/design/mockups-v2.html` (13 telas). Quem implementar deve abrir esse arquivo e seguir o visual de lá; esta seção descreve o comportamento.

Navegação em 5 abas, com o **botão de onda (Fissura agora)** no centro da barra. **[decidido via mockup]**

```
┌──────────────────────────────┐
│  Quarta, 25 de novembro      │
│  Bom dia.                [🔔]│
│  (Fôlego) (Calmaria) (Foco)  │  ← um hábito por vez, chips com apelido
│         ╭────────╮           │
│        │   12    │           │  ← anel que enche de "água" até o próximo marco
│         ╰────────╯           │
│   faltam 2 dias p/ 2 semanas │
│   41 total │ 19 recorde │ R$ │
│  [ Relato de ontem  ›     ]  │  ← relato pendente
├──────┬──────┬──(≈)─┬────────┬──────┤
│Início│Diário│Fissura│Conversa│ Mais │
└──────┴──────┴───────┴────────┴──────┘
```
A aba **Conversa** só aparece com IA configurada. Sem IA, o lugar dela vira **Aprender**. **[proposta]**

### 6.1 Primeiro uso (onboarding) — avaliação "Como você está"
O coração do primeiro uso é uma **avaliação guiada e bonita**, no estilo dos apps pagos de acompanhamento, só que gratuita. **[decidido]**
1. Boas-vindas acolhedoras + "seus dados ficam só neste celular".
2. **Escolher seus vícios** (um ou mais) e dar um **apelido discreto**.
3. **Questionário por vício**: uma pergunta por tela, respostas por toque, barra de progresso suave. Ele pergunta frequência, quantidade, há quanto tempo, tentativas anteriores, perda de controle, impacto na vida, vontade de mudar. Base sugerida: questionários de triagem validados e de uso livre **[proposta]**:
   - álcool: **AUDIT-C** (OMS);
   - nicotina: **Fagerström**;
   - pornografia: **Brief Pornography Screen** ou escala equivalente.

   **[construtor]** confirmar itens e licença de cada um.
4. **Tela de resultado "Como você está"**: nível de atenção (leve / moderado / alto) por vício, em linguagem acolhedora e **sem diagnóstico**. Inclui o que isso significa, o que costuma ajudar e a sugestão de conversar com um profissional quando o nível for alto. A avaliação pode ser refeita depois para ver a evolução.
6. Meta: parar ou reduzir. No sexual, a meta nasce das respostas e é **definida pela própria pessoa** (ex.: parar pornografia, reduzir masturbação), sem viés moral.
7. Data de início (hoje ou outra).
8. **Aviso de segurança do álcool** (parar de beber muito de uma vez pode ser perigoso → procure UBS ou CAPS AD).
9. "Meus porquês" (pode pular).
10. Bloqueio por digital/PIN e disfarce (pode pular).
11. Lembrete do relato diário (horário à escolha).

A abertura (antes do passo 1) mostra a marca e a frase "Sem conta. Tudo fica só neste celular." **[decidido via mockup]**

### 6.2 Início
- Data, saudação e sino de lembretes.
- Chips para trocar de hábito.
- **Anel com água animada** mostrando a sequência atual, enchendo até o próximo marco, com "faltam X dias para…".
- Linha com total, recorde e dinheiro economizado.
- Atalho para o relato pendente.
- Sem cartões empilhados: grupos separados por espaço e linhas finas.

### 6.3 Fissura agora (botão de onda) **[decidido]**
- Acessível em 1 toque pelo centro da barra e por **atalho no ícone do app** (pressionar longamente). Abre **sem desbloqueio** só se a pessoa ligar isso em Ajustes (padrão: desligado). **[proposta]**
- **3 telas, uma ação por vez**, com "pular" e "fechar" sempre presentes:
  1. **Respire:** esfera que expande e contrai, inspira 4 s e expira 6 s, com vibração. O texto "Inspire / Solte devagar" fica **abaixo** da esfera. Botão "Já estou um pouco melhor".
  2. **Surfe a onda:**
     - contador grande (3 a 5 min);
     - frase "A vontade sobe, chega ao pico e passa";
     - o **porquê** da pessoa (sorteado entre os dela);
     - mar animado no rodapé com os botões "Ainda difícil" e "Passou".
     
     "Ainda difícil" oferece mais um ciclo, as ações do plano "se-então" ou a Conversa (se configurada).
  3. **Passou:** "Você atravessou a onda". Mostra quantas fissuras já venceu, a duração e a vontade antes/depois (pergunta rápida 0–10). Registra uma **fissura vencida**.
- **CVV 188 / SAMU 192** só aparecem aqui se a opção "Contatos de emergência" estiver ligada (padrão ligado no APK público; o dono desliga). **[decidido]**

### 6.4 Diário (calendário) **[decidido via mockup]**
- Calendário mensal por hábito:
  - livre: preenchido em verde-espuma;
  - deslize: **contorno cor de areia**, nunca vermelho;
  - sem relato: contorno cinza;
  - hoje: contorno água-marinha.
- Toque num dia abre o relato daquele dia, para ver ou preencher.
- **Vontade média por dia da semana** (barras), destacando o dia de pico e sugerindo criar um plano para esse horário.
- Histórico de fissuras vencidas e deslizes.

### 6.5 Recomeçar com cuidado (registro de deslize)
1. "Obrigado por registrar. Isso exige coragem." Mostra que o total de dias **continua**.
2. "O que estava acontecendo?" Gatilhos, HALT, emoção (tudo por toque, com texto opcional).
3. "O que pode ser diferente da próxima vez?" Sugere adicionar ao plano "se-então".
4. Se houver sinais de risco no texto (ver 7.3), mostra a rede de apoio.

### 6.6 Apoio (fica em Mais)
- CVV 188, SAMU 192, Disque Saúde 136, UBS, CAPS AD, AA/Al-Anon, DASA, Amor-Exigente.
- Contatos de confiança.
- "Vale conversar com um profissional": como chegar ao SUS.

### 6.7 Mais
- **Aprender:** biblioteca curta e humana, com:
  - por que o vício acontece;
  - o que esperar da abstinência;
  - terapias que existem (TCC, ACT, Entrevista Motivacional, mindfulness, grupos), apresentadas como "vale conversar com seu psicólogo";
  - remédios apresentados só como "existem; só um médico pode avaliar".
- **Meu plano:** "se-então" e porquês.
- **Ajustes:** hábitos, aparência, privacidade, lembretes, IA, backup.
- **Sobre:** código aberto, licença, fontes científicas.

### 6.8 Conversa com IA (só aparece configurada)
- Cabeçalho com o provedor ("Gemini · sua chave") e botão de apagar a conversa.
- Respostas aparecem aos poucos (streaming), com sugestões rápidas de resposta (ex.: "Respirar 1 minuto", que abre a Fissura).
- Rodapé fixo: "A IA apoia, mas não substitui um profissional."
- Regras na seção 8.

### 6.9 Lembretes e notificações **[decidido via mockup]**
Ajustes → Lembretes, em grupos:
- **Rotina:** relato do dia (horário à escolha, padrão 22:00) e bom dia (frase calma, padrão 08:00).
- **Inteligentes:**
  - **"Antes da onda"**: o app aprende com o diário o dia e a hora de maior vontade e manda um lembrete gentil **30 min antes** (ex.: sexta 21:30);
  - **marcos e conquistas.**
- **Privacidade:**
  - "Texto discreto": sempre ligado por padrão; a notificação nunca cita o hábito;
  - "Contatos de emergência".

As notificações usam o **nome e ícone do disfarce** escolhido (ex.: "Diário"). Todas são locais (`expo-notifications`), sem servidor.

### 6.10 Marcos e conquistas **[decidido via mockup]**
- Linha do tempo por hábito: 24 h, 3 dias, 1 semana, 2 semanas, 1 mês, 3 meses, 6 meses, 1 ano.
  - Cada marco traz o que muda no corpo (tabaco: linha do tempo da OMS; álcool e sexual: textos próprios, com fonte).
  - Os marcos atingidos ficam em cor de areia, o atual tem barra de progresso e os futuros ficam esmaecidos.
- No topo: fissuras vencidas, unidades a menos (cigarros, doses) e dinheiro economizado.

## 7. Privacidade, discrição e segurança

### 7.1 Discrição **[proposta]**
- **Disfarce:** a pessoa escolhe nome e ícone neutros na tela do celular, ex.: "Diário", "Calma", "Notas". Implementação via `activity-alias` do Android em um plugin de configuração. **[construtor]**
- **Bloqueio:** digital/biometria com PIN de reserva. Bloqueia ao sair do app após X minutos (configurável).
- **Telas protegidas:** sem conteúdo do app na lista de apps recentes (`FLAG_SECURE`, opcional nos Ajustes).
- **Notificações neutras:** "Como foi seu dia? Leva um minuto.". Nunca citam o hábito.
- **Sem termos explícitos** em telas públicas: o apelido do hábito aparece no lugar do tipo.
- **Sem imagens de gatilho**: ícones abstratos (folha, onda, sol, lua).

### 7.2 Permissões
Notificações; biometria; microfone (só se a pessoa gravar áudio do "porquê"); galeria (só se escolher foto). Nenhuma outra.

### 7.3 Detecção de crise (sem IA) **[proposta]**
- Módulo local `crise.ts`: padrões em português para suicídio/autolesão, overdose/intoxicação grave e sinais de abstinência alcoólica grave (tremores fortes, convulsão, alucinação, confusão).
- Roda em **todo texto que a pessoa escreve** (check-in, deslize, chat com IA).
- Ao detectar: mostra na hora um cartão acolhedor com **ligar CVV 188 / SAMU 192**, sem bloquear a pessoa e independente do que a IA disser.
- Testes com frases positivas e negativas (incluindo gírias e erros de digitação comuns).

## 8. IA — cada um com a sua

### 8.1 Configuração **[decidido + proposta]**
- Em Ajustes → **Inteligência Artificial**:
  1. escolher o provedor: **Gemini, ChatGPT ou Claude**;
  2. escolher o modo: **Direto** (padrão) ou **Meu servidor**.
- **Modo Direto:**
  - a pessoa cola a chave, que vai para o **`expo-secure-store`**;
  - o botão "Testar chave" lista os modelos do provedor e a pessoa escolhe um (com o padrão sugerido em [02-provedores-ia.md](../../02-provedores-ia.md));
  - link "Como conseguir minha chave", com passo a passo para cada provedor.
- **Modo Meu servidor:** endereço `https://…onrender.com` + código de acesso, igual ao Forja, com "Testar conexão".
- **Aviso de privacidade antes do primeiro uso**, específico do provedor. Ex. no Gemini gratuito: os registros vêm ligados e o Google pode usar os dados; como desligar.
- Sem IA configurada: as telas de IA mostram um convite discreto e **nada essencial fica bloqueado**.

### 8.2 Funções com IA
| Função | Onde aparece | Prioridade |
|---|---|---|
| **Conversa de apoio** (estilo Entrevista Motivacional) | Aba Mais → Conversa; e passo 6 do SOS | 1ª versão |
| **Refletir sobre um deslize** (ajuda no "o que pode ser diferente") | Fluxo "Recomeçar com cuidado" | 1ª versão |
| **Montar meu plano "se-então"** a partir dos gatilhos registrados | Meu plano | Depois |
| **Reflexão da semana** (resumo gentil dos check-ins) | Diário | Depois |

**[proposta]**

### 8.3 O que vai para a IA
- Só o necessário: tipo de hábito, meta, dias, gatilhos recentes e a conversa.
- **Nunca:** contatos, telefone, nome, fotos, áudios.
- O histórico do chat fica **só no celular**, com botão de apagar.

### 8.4 Trilhos de segurança
- **Instrução de sistema única** para os 3 provedores (`src/lib/ia/instrucoes.ts`):
  - estilo Entrevista Motivacional, sem moralizar e sem validar o uso;
  - nunca orientar dose, troca ou início de remédio;
  - sempre encorajar ajuda profissional e pessoas reais;
  - respostas curtas, em pt-BR;
  - reconhecer limites ("sou uma IA, não substituo um profissional").
- **Detecção de crise local** (7.3) roda **antes de enviar** e **ao receber**.
- Recusa ou erro do provedor (`refusal`, `SAFETY`, falta de crédito, chave inválida, sem internet): mensagem gentil + botão SOS, sem tela de erro técnica.
- **Bateria de conversas de teste** para revisar a instrução: crise, racionalização, pedido de dose, deslize, tentativa de "jailbreak". Roda manualmente com a chave do desenvolvedor antes de cada versão. **[proposta]**

### 8.5 Servidor opcional no Render **[decidido]**
- Evolução do `scripts/servidor-ia.mjs` do Forja: só Node, sem dependências; com `render.yaml` (Blueprint, plano gratuito).
- Variáveis de ambiente: `IA_PROVEDOR` (gemini | openai | claude), `IA_CHAVE`, `IA_MODELO` e `APP_TOKEN` (gerado pelo Render).
- Rota `POST /conversa`: recebe o histórico já preparado pelo app, chama o provedor com os **mesmos adaptadores** e devolve o texto em streaming.
- Rota `GET /saude`.
- Mantém a segurança do Forja: código obrigatório em modo público, limite de tentativas erradas por IP, sem guardar nem registrar o conteúdo das conversas.
- O app trata a espera do Render acordando (até ~1 min) com uma mensagem calma.

## 9. Visual e tom **[decidido via mockups v2]**

Referência: `docs/design/mockups-v2.html`.

- **Marca:**
  - **símbolo** = um círculo com uma onda em degradê (água-marinha → lavanda) na parte de baixo e uma **lua em areia** no alto;
  - **conceito** = *"A lua puxa a maré. Você também pode."* A maré sobe e desce todo dia, e ninguém chama isso de fracasso;
  - **logotipo** = "maré" em minúsculas, em Fraunces;
  - **disfarces** com ícones e cores neutras: "Diário", "Notas" e "Calma".
- **Paleta azul-marinho** (tema escuro padrão), com contraste AA conferido sobre o fundo:

  | Token | Hex | Uso |
  |---|---|---|
  | `abyss` | `#030D19` | fundo mais profundo, telas de fissura e bloqueio |
  | `bg` | `#071526` | fundo |
  | `surface` | `#0E2540` / `#143253` | superfícies |
  | `text` | `#EAF2FB` | texto (16,3:1) |
  | `muted` | `#9DB3CC` | texto secundário (8,5:1) |
  | `faint` | `#7F97B3` | rótulos (6,1:1 no fundo; evitar sobre `#143253`) |
  | `aqua` | `#6FD3E0` | ação principal, progresso, hoje (10,6:1) |
  | `peri` | `#A9B6F5` | acolhimento, relato, seleção (9,4:1) |
  | `sand` | `#F2C98A` | lua, conquistas, marcos, dinheiro, **contorno de deslize** (11,8:1) |
  | `foam` | `#7FE0B5` | dia livre, fissura vencida (11,6:1) |
  | `coral` | `#F0A08A` | só avisos de segurança e "atenção alta" (8,8:1) |

  Tema claro: **[construtor]** derivar depois. A v1 sai só com o escuro. **[proposta]**
- **Tipografia:** **Fraunces** (eixo `SOFT` 100) só para números grandes, títulos e frases de acolhimento. **Geist** para toda a interface. **[decidido]** Fontes via `@expo-google-fonts`. **[construtor]** confirmar os pacotes para Fraunces com eixos variáveis e Geist no SDK 58; se o eixo `SOFT` não estiver disponível, usar o peso estático mais próximo.
- **Superfícies:**
  - poucos cartões; agrupar por espaço e linhas finas (`rgba(150,190,240,.11)`);
  - bordas internas de 1 px no lugar de brilhos externos; sombras tingidas de azul, nunca brilho neon.
- **Ícones:** traço fino (1,6), estilo Lucide/Phosphor, **sem emojis** na interface.
- **Movimento:**
  - lento e orgânico (curva `cubic-bezier(.16,1,.3,1)`);
  - água do anel e mar da fissura em deriva contínua e suave;
  - respiração 4 s inspira / 6 s expira;
  - respeitar "reduzir movimento" do sistema.
- **Acessibilidade:** contraste AA, alvos de toque ≥ 48 dp, TalkBack nas telas principais, fonte escalável.
- **Guia de voz:** tabela "evitar / usar" da pesquisa (7.5) vale para todos os textos, inclusive os da IA.
- **Nome:** **Maré**. **[decidido]** Pacote Android `com.<autor>.mare`. **[construtor]**

## 10. Qualidade

- `vitest` para toda a lógica pura: contador, marcos, insights, "antes da onda", crise, leitor SSE e adaptadores de IA com respostas gravadas.
- `npm run lint` + `npm run typecheck` antes de qualquer entrega (padrão do Forja).
- Testar no web (modo celular do DevTools) o que não depende do Android, e no aparelho o que depende (bloqueio, disfarce, notificações, cofre).
- **Fidelidade visual:** comparar cada tela implementada com o mockup v2 (captura lado a lado) antes de considerar a tela pronta.
- **Conteúdo:** escrito pelo construtor a partir da pesquisa, **com fonte oficial em cada afirmação de saúde**. Telefones e links da rede de apoio são conferidos antes de cada Release. **[proposta]**
- **Revisão clínica:** buscar um(a) psicólogo(a) voluntário(a). **Não trava** a 1ª Release: enquanto não houver revisão, a Release sai marcada como **beta** e o app avisa que o conteúdo ainda não foi revisado por profissional. **[proposta]**

## 11. Escopo da primeira versão (v1.0)

**Entra:**
- abertura com a marca;
- avaliação "Como você está" e resultado;
- relato diário;
- contador não punitivo com anel de água;
- marcos e conquistas;
- **Fissura agora em 3 passos**;
- "Recomeçar com cuidado";
- diário com calendário e vontade por dia da semana;
- plano "se-então" e porquês (texto e foto);
- lembretes (rotina, "antes da onda", marcos) com texto discreto;
- rede de apoio e opção de contatos de emergência;
- biblioteca;
- bloqueio, disfarce de nome e ícone;
- backup cifrado;
- IA nos 3 provedores (Gemini padrão; modo Direto + Meu servidor) com **Conversa de apoio** e **Refletir sobre um deslize**;
- servidor do Render;
- README no padrão do Forja.

**Depois (v1.x):**
- tema claro;
- áudio nos porquês;
- widget na tela inicial;
- reflexão semanal e plano com IA;
- insights avançados;
- modo familiar/apoiador;
- traduções.

## 12. Deixado para o construtor
- Mecanismo exato de criptografia local (5.2), conferindo a documentação do Expo SDK 58.
- Implementação do disfarce de ícone/nome (`activity-alias`) e dos atalhos do ícone.
- Divisão em componentes, nomes de arquivos e estrutura interna do store, respeitando os padrões do Forja.
- Escolha exata dos padrões de texto da detecção de crise, com a lista de casos de teste.
- Geração dos ícones e da splash a partir do símbolo (o Forja usa `scripts/gerar-icones.py`).
- Regra exata do "antes da onda" (quantas semanas de dados antes de sugerir, como lidar com poucos relatos).

## 13. Decisões do dono (25/11/2026)
- **Contagem de dias:** pelo relato diário com perguntas simples (5.4).
- **Onboarding:** escolher os vícios + avaliação "Como você está" (6.1).
- **CVV/SAMU:** opção desligável em Ajustes; a do dono fica desligada. A detecção de crise (7.3) segue a mesma opção. Os trilhos da IA (8.4) continuam sempre ativos.
- **Fissura:** fica, em 3 passos, sem CVV/SAMU quando a opção estiver desligada (6.3).
- **IA:** foco no **Gemini** (padrão, mais testado); **ChatGPT e Claude** também suportados; chave no celular + Render opcional.
- **Nome e visual:** **Maré**, azul-marinho, marca lua + onda, tipografia **Fraunces + Geist**, conforme mockups v2.
- **Telas a mais pedidas:** calendário, notificações/lembretes, conversa, marcos (6.4, 6.8–6.10).

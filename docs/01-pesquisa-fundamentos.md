# Pesquisa de Fundamentos — App de Sobriedade (open source)

> Documento-base para orientar **todas** as decisões do app antes de pensarmos em arquitetura.
> Escopo: tabaco/nicotina, álcool e comportamento sexual compulsivo (pornografia/masturbação).
> Data: 25/11/2026. Fontes no final (seção 11).
>
> **Aviso que vale para o projeto inteiro:** o app **informa e apoia**, mas **não diagnostica, não prescreve e não substitui** profissional de saúde. Todo conteúdo sobre terapias e remédios abaixo é para *educar* e *encorajar a procura de ajuda*, nunca para indicar tratamento.

---

## 0. Resumo executivo — as 12 ideias que mais importam para o app

1. **Vício é um problema de "querer", não de "gostar".** O cérebro aprende a *desejar* intensamente algo mesmo quando já não dá tanto prazer. Por isso força de vontade sozinha falha — e por isso a culpa não ajuda.
2. **Gatilhos (cues) disparam a fissura.** Ver uma imagem de cigarro, garrafa ou conteúdo sexual reativa o desejo. **O app nunca deve mostrar imagens do objeto do vício.**
3. **A fissura é uma onda: sobe, atinge o pico e passa** — no tabaco, tipicamente em 3–5 minutos. O botão de SOS do app deve ser desenhado para "atravessar a onda" nesse intervalo.
4. **Recaída faz parte do processo, e a vergonha é o que transforma um deslize em recaída total** (Efeito de Violação da Abstinência). **O contador de dias nunca deve "apagar" a história da pessoa.**
5. **Vergonha e estigma afastam as pessoas do tratamento.** Discrição (ícone neutro, bloqueio por PIN, notificações neutras, dados locais) não é "extra" — é requisito central.
6. **Linguagem importa.** "Pessoa que está parando de beber", não "alcoólatra". "Deslize", não "fracasso". Nada de "limpo/sujo".
7. **As terapias com melhor evidência** (TCC, Entrevista Motivacional, Prevenção de Recaída, ACT, mindfulness) têm componentes que **cabem num app**: registro de gatilhos, planos "se-então", valores pessoais, surfar a fissura, autocompaixão.
8. **Um app baseado em ACT (iCanQuit) superou um app baseado em diretrizes tradicionais** num ensaio com 2.415 fumantes — e o efeito passou por *aceitação das emoções* e *engajamento*. É um ótimo norte para o nosso conteúdo.
9. **Parar de beber de forma abrupta pode ser perigoso** (convulsões, delirium tremens) para quem bebe muito e todo dia. O app **precisa** alertar sobre isso e orientar acompanhamento médico.
10. **Pornografia/masturbação exige nuance.** Masturbação não é doença; o diagnóstico (CSBD, CID-11) exige perda de controle + sofrimento/prejuízo, e **sofrimento apenas por conflito moral não basta**. O app deve deixar **a pessoa definir a própria meta** e evitar moralismo.
11. **Cores calmantes ajudam, mas o efeito é pequeno.** Azuis/verdes desaturados, contraste confortável e movimento lento criam um *ambiente* calmo; o que realmente reduz ansiedade é o conteúdo (respiração, acolhimento, plano).
12. **A IA deve ser um "companheiro de apoio" com trilhos de segurança**, nunca terapeuta: detecção de crise determinística (não depender do modelo), sem bajulação, sem orientar dose de remédio, sempre podendo encaminhar para CVV 188 / SAMU 192 / CAPS.

---

## 1. Por que os vícios acontecem

O consenso científico atual é o **modelo biopsicossocial**: vício não é fraqueza de caráter nem "só química". É a soma de biologia, psicologia e ambiente.

### 1.1 Neurociência (o "como" no cérebro)

**a) "Querer" ≠ "Gostar" — Teoria da Sensibilização do Incentivo (Robinson & Berridge, 1993 → revisões 2016 e 2024)**
- A dopamina mesolímbica não é a "molécula do prazer": ela atribui **saliência de incentivo** — transforma estímulos em coisas que *chamam* e *puxam* a pessoa.
- Com uso repetido, o sistema de "querer" fica **sensibilizado** (hiper-reativo), especialmente a **pistas/gatilhos** associados ao uso, enquanto o "gostar" (prazer real) não aumenta — muitas vezes até diminui.
- Consequência prática: alguém que **genuinamente quer parar** pode recair ao ser exposto a um gatilho, porque o "querer" acionado pela pista age contra o objetivo consciente.
- A teoria hoje se estende também a **vícios comportamentais** (jogo, comida — e é usada como hipótese para comportamento sexual compulsivo).

**b) O ciclo de 3 estágios (Koob & Volkow)**
| Estágio | O que acontece | Região cerebral | Implicação no app |
|---|---|---|---|
| 1. Uso/intoxicação | Recompensa, aprendizado de hábito | Gânglios da base | Mapear rotinas e contextos de uso |
| 2. Abstinência/afeto negativo | Ansiedade, irritação, tristeza quando não usa; o uso passa a ser para *aliviar* o mal-estar (reforço negativo) | Amígdala estendida (sistema de estresse) | Ferramentas para regular emoção (respiração, acolhimento) |
| 3. Preocupação/antecipação (fissura) | Pensamento obsessivo, controle executivo enfraquecido | Córtex pré-frontal | Planos prontos "se-então", SOS rápido, decisões tomadas *antes* da crise |

**c) Do prazer ao hábito.** Com o tempo, o comportamento migra de dirigido por objetivo para **automático** (estriado ventral → dorsal). A pessoa "se vê fazendo" sem decidir. Por isso o app deve ajudar a **interromper o piloto automático** (pausa, registro, consciência).

**d) Genética.** Cerca de **metade** do risco para dependência de álcool e nicotina é atribuída à herdabilidade — isso **tira a culpa moral** e é uma mensagem de acolhimento útil ("não é só você, e não é falta de caráter").

### 1.2 Fatores psicológicos
- **Automedicação (Khantzian):** muita gente usa a substância/comportamento para lidar com ansiedade, depressão, tédio, solidão, trauma, insônia. Sem tratar a dor de fundo, o vício tende a voltar.
- **Comorbidades frequentes:** depressão, ansiedade, TDAH, TEPT/trauma de infância, outros vícios (álcool + tabaco andam muito juntos).
- **Estresse** é um dos maiores preditores de recaída em todos os vícios.
- **Impulsividade e baixa tolerância ao desconforto** aumentam o risco.
- **Vergonha:** vergonha → isolamento → mal-estar → uso para aliviar → mais vergonha. Esse loop é especialmente forte no comportamento sexual compulsivo e no álcool.

### 1.3 Fatores sociais e ambientais
- **Disponibilidade e normalização** (álcool é extremamente normalizado no Brasil; pornografia está a um toque no celular).
- **Rede social:** amigos que usam, eventos, rotinas de trabalho.
- **Conexão humana é protetora.** Isolamento é fator de risco; vínculo e pertencimento são fatores de proteção. → O app deve **puxar a pessoa para conexões reais** (contato de apoio, grupos, profissionais), não substituí-las.

### 1.4 Gatilhos mais comuns (para mapear no app)
- **Emocionais:** ansiedade, raiva, tristeza, tédio, solidão, celebração.
- **Fisiológicos:** cansaço, fome, abstinência, insônia. (O acrônimo **HALT** — *Hungry, Angry, Lonely, Tired* / Fome, Raiva, Solidão, Cansaço — vem da comunidade de recuperação; não é um instrumento validado, mas é ótimo como *check-in* simples.)
- **Situacionais:** pessoas, lugares, horários (café/cigarro, sexta à noite/bebida, madrugada sozinho/pornografia), celular na cama.
- **Cognitivos:** "só um não faz mal", "eu mereço", "já estraguei mesmo".

### 1.5 O Efeito de Violação da Abstinência (EVA) — crucial para o design
Proposto por **Marlatt & Gordon (1985)** no modelo de **Prevenção de Recaída**:
- Um **lapso/deslize** (uso pontual) pode virar **recaída** (volta ao padrão antigo) dependendo de **como a pessoa interpreta** o deslize.
- Quando a pessoa atribui o deslize a algo **interno, permanente e incontrolável** ("eu sou fraco, nunca vou conseguir") + sente culpa/vergonha → a autoconfiança despenca → espiral de "já que estraguei, vou até o fim".
- Em estudos com fumantes, quem recaiu fazia mais atribuições internas, estáveis e globais do que quem voltou à abstinência após o lapso.
- **Implicação direta:** contadores que **zeram tudo** com um deslize **amplificam o EVA**. O app deve tratar deslize como **dado para aprender**, não como sentença.

---

## 2. Os três vícios — especificidades

### 2.1 Tabaco / nicotina (cigarro, palheiro, narguilé, vape/pod)
- **Por que vicia:** nicotina chega ao cérebro em segundos; o ritual (pausas, café, ansiedade) cria dezenas de gatilhos por dia.
- **Abstinência:** irritabilidade, ansiedade, dificuldade de concentração, aumento de apetite, insônia, humor baixo. Fissuras individuais costumam durar **3–5 minutos**; o pior período costuma ser **2–3 dias** após parar; a maioria dos sintomas melhora em **~4 semanas** (fissuras ocasionais podem persistir por mais tempo, especialmente ligadas a gatilhos).
- **Benefícios progressivos (ótimos como marcos no app)** — linha do tempo da OMS: em ~20 min a frequência cardíaca cai; em ~12 h o monóxido de carbono no sangue normaliza; em 2–12 semanas a circulação e a função pulmonar melhoram; em 1–9 meses tosse e falta de ar diminuem; em 1 ano o risco de doença coronariana cai para cerca da metade; em 10 anos o risco de câncer de pulmão cai para cerca da metade em relação a quem continua fumando.
- **Vape no Brasil:** a comercialização de cigarros eletrônicos é **proibida pela Anvisa** (RDC 855/2024). Internacionalmente há evidência de que vapes com nicotina ajudam a parar de fumar, mas no contexto brasileiro o app deve tratar vape como **mais uma forma de nicotina** a ser abordada, sem recomendá-lo.
- **Contexto Brasil:** o Vigitel 2024 estimou **~11,5%** de adultos fumantes nas capitais. A procura por tratamento no SUS quase dobrou desde 2022 (2,5 milhões em 2025).

### 2.2 Álcool
- **Por que vicia:** age em vários sistemas (GABA, glutamato, opioides endógenos, dopamina). Forte componente de **reforço negativo** (beber para aliviar ansiedade/insônia, que o próprio álcool piora no dia seguinte).
- **Normalização cultural** é o grande desafio: pressão social, eventos, "beber socialmente". O app precisa de ferramentas de **recusa** ("como dizer não") e planejamento de eventos.
- **⚠️ Segurança — abstinência alcoólica pode ser perigosa:** em quem bebe muito e diariamente, parar de forma abrupta pode causar **convulsões** (90%+ ocorrem nas primeiras 48 h) e **delirium tremens** (emergência médica, com mortalidade relevante). Risco maior com histórico de convulsões/DT, abstinências anteriores, uso pesado prolongado.
  → O app **deve** ter um aviso claro no onboarding de álcool: *"Se você bebe muito todos os dias, não pare de uma vez sem falar com um médico. Procure uma UBS ou CAPS AD."* E na presença de sinais (tremores intensos, confusão, alucinações, convulsão) → **SAMU 192**.
- **Metas válidas:** para alguns, **reduzir** (menos dias de consumo pesado) é um objetivo clinicamente legítimo e já traz benefício; para outros (dependência grave), abstinência é o mais seguro. O app deve permitir **"parar" ou "reduzir"**.
- **Contexto Brasil:** consumo abusivo (episódico pesado) gira em torno de **1 em cada 5 adultos** nas capitais (Vigitel; ~18,8% em 2019), quase 2× maior entre homens.

### 2.3 Comportamento sexual compulsivo (pornografia / masturbação)
Aqui é onde mais precisamos de **cuidado, nuance e zero moralismo**.

- **Classificação:** a CID-11 (OMS) incluiu o **Transtorno do Comportamento Sexual Compulsivo (CSBD, código 6C72)** como **transtorno do controle de impulsos** — não como "vício" formal. Critérios centrais: padrão persistente (≥ 6 meses) de **falha em controlar** impulsos sexuais intensos e repetitivos, com atividade sexual virando foco central da vida, tentativas frustradas de reduzir, continuidade apesar de consequências e **sofrimento/prejuízo significativo**.
- **Regra importante da própria CID-11:** sofrimento **apenas** por julgamento moral ou desaprovação do comportamento **não basta** para o diagnóstico.
- **Incongruência moral (Grubbs et al., meta-análise 2019):** parte do sentimento de "estar viciado em pornografia" é melhor explicada pelo **conflito entre valores e comportamento** do que pela quantidade de uso. Pessoas mais religiosas tendem a se perceber como "viciadas" mesmo com uso baixo/médio. Os próprios autores frisam que **isso não significa que os problemas sejam irreais** — mas muda a abordagem: trabalhar **valores e autocompaixão**, e não alimentar vergonha.
- **Masturbação** em si é considerada comportamento sexual **normal e saudável** pela medicina sexual. O problema clínico é a **perda de controle + prejuízo**, não o ato.
- **Alegações populares (ex.: "pornografia causa disfunção erétil", "reboot", "superpoderes do NoFap")** têm **evidência inconclusiva/fraca**. O app não deve prometer benefícios sem base.
- **Implicações para o app:**
  - Deixar **a pessoa escolher a meta**: parar pornografia; reduzir; parar masturbação compulsiva; usar só em certos contextos etc.
  - Linguagem neutra e não religiosa por padrão (quem quiser pode adicionar seus próprios valores/espiritualidade nos "meus porquês").
  - Ferramentas práticas: bloqueadores de conteúdo (orientar a configurar), mudar rotina noturna (celular fora do quarto), lidar com tédio/solidão.
  - **Discrição máxima** — é o vício mais vergonhoso para a maioria. Nunca nomear explicitamente na tela inicial ou em notificações.

---

## 3. Abordagens terapêuticas (para *informar*, não prescrever)

| Terapia | O que é, em uma frase | Evidência | Elementos que podemos trazer para o app (sem "fazer terapia") |
|---|---|---|---|
| **TCC** — Terapia Cognitivo-Comportamental | Identifica pensamentos e situações que levam ao uso e treina habilidades para lidar com eles | Forte para álcool e tabaco (no SUS, tratamento do tabagismo é sempre TCC + remédio); "primeira evidência" para CSBD | Diário de gatilhos; reestruturação de pensamentos ("eu mereço um" → alternativa); planos de enfrentamento |
| **EM** — Entrevista Motivacional | Conversa colaborativa que ajuda a pessoa a resolver a ambivalência ("quero e não quero parar") | Forte, especialmente para álcool; base de intervenções breves | **Estilo da IA** (perguntas abertas, reflexões, sem confrontar); exercício "prós e contras"; régua de prontidão 0–10 |
| **Prevenção de Recaída** (Marlatt) | Antecipar situações de risco, ter plano, e tratar lapso como aprendizado | Boa, transversal a todos os vícios | Mapa de situações de risco; plano "se-então"; **fluxo pós-deslize sem culpa** |
| **ACT** — Terapia de Aceitação e Compromisso | Aceitar fissuras e emoções sem obedecer a elas, e agir pelos valores pessoais | App iCanQuit (ACT) > app padrão para parar de fumar (OR 1,49, 12 meses, n=2.415); ensaio para pornografia problemática (Crosby & Twohig 2016): redução de ~93% vs 21% na lista de espera (amostra pequena e específica) | **"Meus porquês" / valores**; exercícios de desfusão ("estou tendo o pensamento de que..."); aceitar a fissura |
| **MBRP** — Prevenção de Recaída Baseada em Mindfulness / **"Surfar a fissura"** | Observar a fissura como onda que sobe e passa, sem agir | Ensaio de 2014 (Bowen et al., n=286): menos dias de uso e menos consumo pesado em 12 meses vs. prevenção de recaída padrão e tratamento usual; surfar a fissura isolado tem evidência mais preliminar | **Botão SOS com "surfar a onda"** guiado por 3–5 min |
| **Técnicas de respiração** | Respiração lenta com expiração longa | Ensaio Stanford 2023 (Balban et al.): 5 min/dia de "suspiro cíclico" melhorou humor e reduziu frequência respiratória; ansiedade caiu em todos os grupos | Animação de respiração guiada no SOS (expiração mais longa que inspiração) |
| **Manejo de Contingências** | Recompensas concretas por metas verificadas | Forte (incentivos financeiros ajudam a parar de fumar) | Versão sem dinheiro: marcos, conquistas, "quanto você economizou" |
| **12 Passos / Grupos de mútua ajuda** (AA, NA, DASA etc.) | Grupos de pares com programa estruturado | Revisão Cochrane 2020 (27 estudos, 10.565 pessoas): AA/12 passos manualizado **aumenta abstinência contínua em 12 meses** vs outras terapias (RR 1,21, alta certeza) | Diretório de grupos; incentivo a buscar pares |
| **CRA / CRAFT** | Reorganizar a vida para que a sobriedade seja mais recompensadora; treinar familiares | Boa para álcool | Futuro: modo "familiar/apoiador" |
| **Terapia sexual / medicina sexual** | Abordagem não patologizante da sexualidade | Recomendada em revisões de CSBD (2024) | Indicar como opção ao lado da psicologia |

> **Sobre a "TAOS" que você mencionou:** não encontrei uma terapia com esse nome. Provavelmente você está pensando em **ACT** (Terapia de Aceitação e Compromisso) ou **TCC** — as duas são as que melhor combinam com um app. O texto no app pode ser algo como: *"Existe uma abordagem chamada Terapia de Aceitação e Compromisso (ACT), que ajuda a lidar com a fissura sem obedecer a ela. Vale conversar com seu psicólogo sobre isso."*

---

## 4. Medicamentos (somente informativo — nunca recomendar no app)

> Regra para o app: mencionar **que existem** opções com remédio e que **só médico pode avaliar**; nunca indicar dose, nunca comparar "qual é melhor para você", e a IA deve recusar orientar dosagem.

### Tabaco
| Remédio | Como age (simplificado) | Observações |
|---|---|---|
| **Terapia de Reposição de Nicotina** (adesivo, goma, pastilha) | Fornece nicotina sem fumaça, reduzindo abstinência | Combinar adesivo + goma/pastilha funciona melhor que um só. **Ofertada pelo SUS** |
| **Bupropiona** | Antidepressivo que reduz fissura e abstinência | **Ofertada pelo SUS** (junto com acompanhamento) |
| **Vareniclina** | Agonista parcial do receptor de nicotina — reduz prazer e fissura | Eficaz; segundo reportagens recentes, não integra a oferta regular do SUS |
| **Citisina** | Semelhante à vareniclina, de origem vegetal | Cochrane: eficácia semelhante à vareniclina, possivelmente menos eventos adversos graves |

No SUS, o remédio é **sempre associado à abordagem cognitivo-comportamental** (grupos em UBS).

### Álcool
| Remédio | Observações |
|---|---|
| **Naltrexona** | Primeira linha; reduz dias de consumo pesado. Não pode ser usada por quem usa opioides |
| **Acamprosato** | Primeira linha; ajuda a manter a abstinência em quem já parou |
| **Dissulfiram** | Causa reação desagradável se a pessoa beber; só funciona bem com supervisão; **nunca** tomar bebendo |
| **Topiramato / Gabapentina** | Alternativas (uso off-label) com evidência moderada/forte para reduzir consumo pesado |
| **Baclofeno** | Off-label, estudado |
| **Semaglutida (GLP-1, "Ozempic")** | **Em pesquisa.** Ensaios pequenos (2025 JAMA Psychiatry; 2026 The Lancet, em pessoas com obesidade) mostraram redução de consumo e de fissura. **Não aprovada** para alcoolismo |

Padrão de cuidado: **remédio + terapia comportamental** juntos.

### Comportamento sexual compulsivo
- **Não há remédio aprovado.** Há estudos pequenos com antidepressivos (ISRS) e relatos com naltrexona; evidência fraca. TCC/ACT são o caminho principal. No app: apenas "em alguns casos o psiquiatra pode avaliar medicação".

---

## 5. Rede de apoio no Brasil (para o app exibir)

| Recurso | Para quê |
|---|---|
| **CVV — 188** (24h, gratuito, também chat em cvv.org.br) | Apoio emocional e prevenção do suicídio |
| **SAMU — 192** | Emergência médica (ex.: sinais graves de abstinência alcoólica, intoxicação) |
| **Disque Saúde — 136** | Informações do SUS, inclusive como começar a parar de fumar |
| **UBS (Unidade Básica de Saúde)** | Porta de entrada: programa de tabagismo (grupos + adesivo/goma/bupropiona), encaminhamentos |
| **CAPS AD** (Centro de Atenção Psicossocial Álcool e Drogas) | Tratamento gratuito para álcool e outras drogas, sem precisar de encaminhamento em muitos municípios |
| **Alcoólicos Anônimos (AA)** / **Al-Anon** (familiares) | Grupos de mútua ajuda |
| **DASA — Dependentes de Amor e Sexo Anônimos** / **SA** | Grupos de mútua ajuda para comportamento sexual compulsivo |
| **Amor-Exigente** | Apoio a famílias |

> Antes de publicar, validar telefones/links e, se possível, permitir que a comunidade open source contribua com recursos de outros países (i18n).

---

## 6. O que a pesquisa diz sobre apps de recuperação

- **Engajamento é o mecanismo.** No iCanQuit, o efeito passou por *aceitação das emoções gatilho* e por *uso do app*. → Precisamos de algo que a pessoa **queira abrir todo dia** (check-in rápido, progresso bonito), sem viciar (sem dark patterns, sem rolagem infinita).
- **Conteúdo baseado em aceitação/valores** superou conteúdo "informativo/diretivo" tradicional.
- **Contadores que zeram** são o ponto mais criticado por usuários de apps de sobriedade (amplificam o EVA). Soluções vistas: manter histórico, registrar o motivo do deslize, contar dias totais, contadores separados por vício.
- **Privacidade** é barreira número 1 para quem tem vergonha. Muitos apps exigem conta/e-mail — nós não precisamos.

---

## 7. Design emocional — como o app deve *se sentir*

### 7.1 Cores: o que a evidência diz (com honestidade)
- **Cores frias (azul, verde) estão associadas a menor ativação**; cores quentes e saturadas (vermelho, laranja forte) aumentam ativação/alerta. Azul tende a ser o menos "excitante", verde fica no meio, vermelho no topo.
- **Saturação provavelmente importa tanto quanto o matiz**: tons **desaturados/"empoeirados"** (verde-sálvia, azul-acinzentado, lavanda suave) parecem mais calmos que tons vibrantes. (Evidência controlada sobre saturação é limitada.)
- **Azuis muito escuros e frios** podem puxar para baixo o humor → equilibrar com um **acento quente e suave** (areia/âmbar) para esperança e conquistas.
- **O efeito das cores é real mas pequeno.** "Cromoterapia" não tem base científica sólida. A cor cria o *clima*; quem reduz a ansiedade é a experiência (respiração, acolhimento, sensação de controle).
- **Vermelho = alarme/erro/perigo.** Evitar vermelho para deslizes. Usar **coral suave** só para avisos de segurança.

### 7.2 Paleta proposta ("Maré Calma") — contraste WCAG verificado

**Tema escuro (sugerido como padrão — uso à noite, onde as fissuras são comuns, e mais discreto em público)**

| Token | Hex | Uso | Contraste sobre fundo `#0F1A1F` |
|---|---|---|---|
| `bg` | `#0F1A1F` | Fundo (azul-petróleo noturno) | — |
| `surface` | `#172830` | Cartões | — |
| `text` | `#E8EEEC` | Texto principal | 15,1 : 1 |
| `text-muted` | `#A7B8B6` | Texto secundário | 8,6 : 1 |
| `primary` | `#7CC0B1` | Verde-água sálvia — ações, progresso | 8,5 : 1 |
| `calm` | `#B3A6E0` | Lavanda — respiração, SOS, momentos de acolhimento | 8,0 : 1 |
| `hope` | `#E6C07B` | Areia/âmbar — conquistas, marcos, economia | 10,3 : 1 |
| `care` | `#E89B86` | Coral suave — **só** avisos de segurança | 8,0 : 1 |
| `growth` | `#93CFA0` | Verde — sucesso | 9,8 : 1 |

**Tema claro**

| Token | Hex | Contraste sobre `#F5F7F4` |
|---|---|---|
| `bg` | `#F5F7F4` (branco-quente esverdeado, nunca branco puro) | — |
| `surface` | `#FFFFFF` | — |
| `text` | `#1C2A2E` | 13,7 : 1 |
| `text-muted` | `#4E6266` | 6,0 : 1 |
| `primary` | `#2F7468` | 5,1 : 1 (botão com texto branco: 5,5 : 1) |
| `calm` | `#5F4FA3` | 6,2 : 1 |
| `hope` | `#8A6214` | 5,1 : 1 |
| `care` | `#A84B35` | 5,2 : 1 |
| `growth` | `#2E7044` | 5,5 : 1 |

Todos passam **WCAG AA (≥ 4,5 : 1)** para texto normal. Gradientes suaves (ex.: `bg` → um toque de lavanda) podem dar profundidade no fundo do SOS.

**Cor por vício (opcional, sutil):** tabaco = azul-céu suave, álcool = sálvia, sexual = lavanda — usadas só como acento, nunca com ícones explícitos (garrafa/cigarro).

### 7.3 Tipografia, forma, movimento, som
- **Fonte:** sans-serif humanista e arredondada, muito legível — ex.: **Nunito** ou **Inter** para UI, **Atkinson Hyperlegible** como opção de acessibilidade. Tamanho base ≥ 16 px; números grandes e amigáveis no contador.
- **Formas:** cantos arredondados, muito respiro (espaço em branco), pouca informação por tela. **Ansiedade reduz a capacidade de processar** — na tela de crise, **uma única ação por vez**.
- **Movimento:** lento e orgânico (easing suave), animação de respiração (ex.: inspirar 4 s / expirar 6–8 s). Nada piscando, nada tremendo. Respeitar "reduzir movimento" do sistema.
- **Háptica:** vibração suave acompanhando a respiração (ajuda quem não quer olhar a tela).
- **Som:** opcional, desligado por padrão (discrição); sons de natureza/ruído marrom no SOS.
- **Evitar:** vermelho, confete exagerado, sons de "game over", contagem regressiva estressante, números de recaída em destaque.

### 7.4 O contador de dias — modelo que não pune
Proposta (para discutirmos na fase de estrutura):
- **Três números**, não um: **sequência atual**, **dias totais sóbrio/a** (nunca zera) e **maior sequência**.
- Opcional: **% de dias livres** no último mês (valoriza progresso real, ex.: "26 de 30 dias").
- **Deslize ≠ reset da história**: ao registrar um deslize, o app abre um fluxo acolhedor de 3 passos: (1) "Obrigado por registrar, isso é coragem", (2) "O que estava acontecendo?" (gatilho, HALT, emoção), (3) "O que você faz diferente da próxima vez?" → atualiza o plano.
- **Marcos com significado**: 24 h, 3 dias (pico da abstinência da nicotina passou), 1 semana, 1 mês, 90 dias, 1 ano… + benefícios de saúde (tabaco) + **dinheiro economizado** + tempo recuperado.
- **Contadores separados** por vício: deslize em um não afeta os outros.
- Permitir **ocultar o contador** para quem sente que ele gera ansiedade.

### 7.5 Linguagem e tom (guia de voz)
| Evitar | Usar |
|---|---|
| alcoólatra, viciado, fumante inveterado | pessoa que está parando / reduzindo; "seu hábito" |
| limpo / sujo | livre / em recuperação / sem usar |
| recaída, fracasso, voltou à estaca zero | deslize, momento difícil, aprendizado; "seus dias continuam contando" |
| "você não pode", "proibido" | "você escolheu", "seu plano" |
| tom de sermão / médico distante | tom de amigo calmo, direto, gentil |
| promessas ("vai curar", "superpoderes") | fatos com humildade ("muita gente sente…", "estudos mostram…") |

### 7.6 Discrição e privacidade (requisito central por causa da vergonha)
- **Sem conta obrigatória**; dados **locais no aparelho** por padrão (local-first).
- **Bloqueio com PIN/biometria**; opção de **ícone e nome neutros** (ex.: "Maré", "Calma", "Diário").
- **Notificações neutras**: "Hora do seu check-in 🌿", nunca "Não beba hoje!" ou "Dias sem pornografia".
- **Nenhum termo explícito na tela inicial** — o usuário pode dar apelidos aos hábitos.
- Exportar e **apagar tudo** com um toque.
- **LGPD:** dados de saúde e vida sexual são **dados pessoais sensíveis** (art. 5º, II e art. 11). Sem analytics invasivo, sem vender/compartilhar dados — e o código aberto permite auditoria (ponto forte do projeto).

### 7.7 Nada de gatilhos visuais
Por causa da reatividade a pistas (seção 1.1), **o app nunca mostra** fotos/ilustrações de cigarros, bebidas, bares, corpos sexualizados etc. Ícones abstratos (folha, onda, sol) no lugar.

### 7.8 O momento de crise (SOS) — desenho guiado pela pesquisa
Acessível em **1 toque** de qualquer tela (e via widget/atalho). Sequência sugerida, cabendo nos ~3–5 min de uma onda de fissura:
1. **Respire comigo** (60–90 s, expiração longa, háptica).
2. **Surfe a onda**: "Onde você sente a vontade no corpo? Ela vai subir e vai passar." (timer visual em forma de onda).
3. **Lembre seu porquê**: mostrar os motivos que a própria pessoa escreveu (texto, foto de quem ama, áudio gravado por ela mesma).
4. **Adie 10 minutos**: "Não precisa decidir agora. Só os próximos 10 minutos."
5. **Faça algo**: lista de ações do *próprio* plano (beber água, andar, banho, ligar para alguém).
6. **Converse**: com a IA de apoio, ou **ligar/mandar mensagem para contato de confiança**.
7. **Se for algo maior**: CVV 188 / SAMU 192 sempre visíveis.
Depois: "Você atravessou a onda 🌊" → registra como **vitória** (fissuras vencidas também contam como conquista!).

---

## 8. Integração com IA — papel, limites e segurança

### 8.1 Papel
Um **companheiro de apoio** no estilo **Entrevista Motivacional + TCC/ACT**: escuta, reflete, ajuda a montar planos, a entender gatilhos, a atravessar fissuras e a revisar deslizes sem culpa. **Não é terapeuta, não diagnostica, não prescreve.**

### 8.2 Riscos documentados em pesquisas recentes (2025–2026)
- LLMs de uso geral **respondem de forma inconsistente a crises** (autolesão, ideação suicida) — parte das respostas foi classificada como inadequada ou prejudicial.
- **Bajulação** (concordar com tudo) pode **validar racionalizações** ("um drink hoje não faz mal, você merece") ou até ideação autodestrutiva.
- **Recusa excessiva** também é perigosa: "não posso ajudar com isso" para alguém em sofrimento é abandono.

### 8.3 Trilhos de segurança propostos
1. **Detecção de crise determinística, fora do LLM:** palavras-chave/padrões (suicídio, autolesão, sintomas graves de abstinência alcoólica, overdose) → o app **mostra imediatamente** CVV 188 / SAMU 192 com botão de ligar, independente do que o modelo responder.
2. **System prompt rígido**: estilo EM; nunca moralizar; nunca recomendar/dosar medicamentos (sempre "converse com um médico"); não validar uso ("posso ouvir você, e lembrar do que você me disse que importa..."); nunca prometer cura; sempre encorajar ajuda profissional e conexões humanas.
3. **Contexto mínimo**: a IA recebe só o necessário (meta, dias, gatilhos registrados) — **sem nome, sem identificadores**.
4. **App 100% funcional sem IA** (quem não quiser ou não tiver chave não perde nada essencial).
5. **Chave de API**: no modelo que usamos no projeto anterior — **chave em variável de ambiente no Render**, com um backend fino como proxy (a chave nunca vai para o cliente). Opcional: "traga sua própria chave" para quem fizer self-host.
6. **Histórico de conversa local** e apagável; nada de treinar com dados do usuário.
7. **Avaliação contínua**: montar uma bateria de conversas de teste (crise, racionalização, pedido de dose de remédio, deslize) e rodar a cada mudança de prompt/modelo.

---

## 9. Requisitos que nascem desta pesquisa (insumo para a fase de estrutura)

**Essenciais (MVP)**
- Onboarding acolhedor: escolher hábito(s), meta (parar/reduzir), apelidos discretos, "meus porquês", contato de confiança, alerta de segurança do álcool.
- Contador não punitivo (sequência atual + dias totais + recorde) por hábito.
- Botão SOS (respiração → surfar a onda → porquês → adiar → ações → contato/IA → CVV/SAMU).
- Check-in diário rápido (humor, fissura 0–10, HALT, gatilhos).
- Registro de deslize com reflexão e atualização do plano.
- Plano de prevenção de recaída ("se acontecer X, eu faço Y").
- Biblioteca curta e humana: por que o vício acontece, abstinência esperada, terapias que existem ("vale conversar com seu psicólogo"), rede de apoio no Brasil.
- Privacidade: local-first, PIN/biometria, notificações neutras, sem conta.
- Tema escuro calmante + tema claro, acessível (AA).

**Depois**
- Chat com IA (com trilhos da seção 8).
- Marcos de saúde e economia; conquistas por fissuras vencidas.
- Insights: "suas fissuras são mais fortes às sextas, 22h".
- Modo familiar/apoiador; diretório de grupos; i18n.
- Backup criptografado opcional.

---

## 10. Perguntas em aberto para decidirmos juntos
1. **Plataforma:** app mobile (React Native/Expo? PWA?) ou web primeiro? — o público acessa muito pelo celular, e o SOS precisa estar a 1 toque.
2. **Nome e identidade:** um nome neutro e discreto (ex.: "Maré", "Calma", "Respiro") ajuda a privacidade.
3. **Pornografia/masturbação:** confirmamos a abordagem "a pessoa define a própria meta", sem viés moral/religioso por padrão?
4. **IA:** qual provedor/modelo padrão, e se haverá um backend comunitário (com chave do projeto no Render) ou só self-host com chave própria (custo!).
5. **Revisão clínica:** vale buscar um(a) psicólogo(a) voluntário(a) para revisar textos antes do lançamento — dá muita credibilidade a um projeto open source de saúde.

---

## 11. Referências

**Neurociência e modelo de recaída**
- Berridge & Robinson (2016). *Liking, wanting, and the incentive-sensitization theory of addiction.* American Psychologist — https://pubmed.ncbi.nlm.nih.gov/27977239/ · PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC5171207
- Robinson & Berridge (2024/2025) revisão de 30 anos — https://pmc.ncbi.nlm.nih.gov/articles/PMC11773642
- Koob & Volkow (2016). *Neurobiology of addiction: a neurocircuitry analysis.* Lancet Psychiatry.
- Efeito de Violação da Abstinência / Prevenção de Recaída (Marlatt) — https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427 · https://link.springer.com/referenceworkentry/10.1007%2F978-1-4419-1005-9_623

**Tabaco**
- Cochrane CD006103 — vareniclina e citisina — https://www.cochrane.org/CD006103
- Abstinência e fissuras — HSE: https://www2.hse.ie/living-well/quit-smoking/get-help-to-quit/cravings-withdrawal/ · MedlinePlus: https://medlineplus.gov/ency/patientinstructions/000854.htm
- PCDT Tabagismo (Conitec) — https://www.gov.br/conitec/pt-br/midias/protocolos/resumidos/20210113_pcdt_resumido_tabagismo.pdf
- CFF (2026) — SUS amplia tratamento: https://site.cff.org.br/noticia/Noticias-gerais/08/06/2026/sus-amplia-oferta-de-tratamento-para-quem-deseja-parar-de-fumar-e-fortalece-papel-dos-farmaceuticos
- Agência Gov (2026) — aumento de 138%: https://agenciagov.ebc.com.br/noticias/202606/sus-registra-aumento-de-138-na-distribuicao-de-medicamentos-para-parar-de-fumar
- Metrópoles — tratamentos no SUS: https://www.metropoles.com/saude/tratamentos-sus-parar-de-fumar
- INCA Nota Técnica (Vigitel 2024): https://ninho.inca.gov.br/jspui/bitstream/123456789/18212/3/Nota-T%c3%a9cnica-DNCF26-Final_29_07.pdf
- Bricker et al. (2020) iCanQuit vs QuitGuide, JAMA Intern Med — https://pubmed.ncbi.nlm.nih.gov/32955554/ · mecanismos: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8663588/

**Álcool**
- AAFP (2024) — *Medications for Alcohol Use Disorder*: https://www.aafp.org/pubs/afp/issues/2024/0100/alcohol-use-disorder.html
- APA Practice Guideline (2018): https://psychiatryonline.org/doi/10.1176/appi.books.9781615371969.alcohol03
- Hendershot et al. (2025) semaglutida, JAMA Psychiatry — https://pubmed.ncbi.nlm.nih.gov/39937469/
- NIH — GLP-1 + terapia reduz consumo pesado: https://nih.gov/news-events/nih-research-matters/glp-1-plus-therapy-can-reduce-heavy-drinking
- Abstinência alcoólica — https://pmc.ncbi.nlm.nih.gov/articles/PMC6761825/ · AAFP: https://www.aafp.org/pubs/afp/issues/2005/0201/p495.html · MSD: https://msdmanuals.com/professional/special-subjects/illicit-drugs-and-intoxicants/alcohol-toxicity-and-withdrawal
- Kelly, Humphreys & Ferri (2020). Cochrane — AA e 12 passos: https://pubmed.ncbi.nlm.nih.gov/32159228/ · https://www.cochrane.org/news/new-cochrane-review-finds-alcoholics-anonymous-and-12-step-facilitation-programs-help-people
- Vigitel 2019 (consumo abusivo nas capitais) — https://periodicos.ufmg.br/index.php/reme/article/view/49529/48813

**Comportamento sexual compulsivo**
- Briken et al. (2024). *Assessment and treatment of CSBD: a sexual medicine perspective* — https://pubmed.ncbi.nlm.nih.gov/38529667/
- Revisão sistemática de tratamentos (2022) — https://pmc.ncbi.nlm.nih.gov/articles/PMC9872540
- Grubbs, Perry, Wilt & Reid (2019). *Pornography Problems Due to Moral Incongruence* — https://pubmed.ncbi.nlm.nih.gov/30076491/
- APA (2020) — crenças morais e percepção de vício: https://www.apa.org/news/press/releases/2020/02/religious-moral-porn-addiction
- Crosby & Twohig (2016). ACT para uso problemático de pornografia — https://pubmed.ncbi.nlm.nih.gov/27157029

**Mindfulness e respiração**
- MBRP (Bowen et al.) — https://pmc.ncbi.nlm.nih.gov/articles/PMC3408809
- Surfar a fissura em fumantes universitários — https://pubmed.ncbi.nlm.nih.gov/20025372/
- Balban et al. (2023), Cell Reports Medicine — https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947 · https://med.stanford.edu/news/insights/2023/02/cyclic-sighing-can-help-breathe-away-anxiety.html

**Cores**
- Jonauskaite et al. (in press), rotina de relaxamento com cores — https://serval.unil.ch/resource/serval:BIB_A3C7052C22D4.P001/REF
- Revisão sobre cor e emoção — https://pmc.ncbi.nlm.nih.gov/articles/PMC12699003

**Design de contadores (relatos, não pesquisa formal)**
- https://soberstack-site.pages.dev/blog/streaks-without-all-or-nothing
- https://dev.to/spencer_walden_9ca6a84f9f/i-built-a-free-sobriety-tracker-that-doesnt-punish-you-for-slipping-up-4lao

**IA e saúde mental**
- *Between Help and Harm: An Evaluation of Mental Health Crisis Handling by LLMs* (2025) — https://arxiv.org/html/2509.24857v2
- Avaliação clínica de respostas a sinais de risco de suicídio — https://arxiv.org/html/2510.27521
- JMIR Mental Health (2026) — https://mental.jmir.org/2026/1/e88435
- Psychiatric Times (2025) — https://psychiatrictimes.com/view/preliminary-report-on-dangers-of-ai-chatbots

> Itens de conhecimento consolidado sem link direto acima (CID-11 6C72, RDC Anvisa 855/2024, linha do tempo de benefícios da OMS, LGPD art. 5º/11, Koob & Volkow 2016) devem ter o link oficial adicionado antes de virarem texto público no app.

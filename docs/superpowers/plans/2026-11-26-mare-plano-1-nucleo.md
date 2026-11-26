# Maré · Plano 1 — Núcleo diário

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** um app Android (Expo) chamado Maré em que a pessoa:
- cria seus hábitos com apelido discreto;
- responde o relato diário;
- vê a sequência no anel de água, o calendário, a vontade por dia da semana e os marcos.

Tudo com dados criptografados no celular e o visual dos mockups v2.

**Architecture:**
- Mesma base do Forja (`D:\app_mobile`): Expo SDK 58, Expo Router, Zustand com persistência, regras em funções puras testadas com vitest.
- A persistência usa SQLite com SQLCipher. A chave aleatória fica no `expo-secure-store`. No navegador (só desenvolvimento) usa `localStorage`.
- Toda regra de contagem fica em `src/lib/` sem importar React Native. As telas só leem o store e chamam essas funções.

**Tech Stack:** Expo ~58, React Native 0.88, React 19.3, TypeScript ~6.0, Expo Router, Zustand 5, react-native-svg, expo-sqlite (SQLCipher), expo-secure-store, expo-crypto, @expo-google-fonts/fraunces, @expo-google-fonts/geist, vitest 5.

**Spec:** [docs/superpowers/specs/2026-11-25-app-sobriedade-design.md](../specs/2026-11-25-app-sobriedade-design.md). Roteiro geral: [2026-11-26-mare-roteiro.md](2026-11-26-mare-roteiro.md). Referência visual obrigatória: `.superpowers/brainstorm/315-1795657084/content/telas-v2.html`.

## Global Constraints

**Projeto e ferramentas**
- Só Android. Nada de configuração iOS. Distribuição futura por APK no GitHub.
- Versões iguais às do Forja (`D:\app_mobile\package.json`): `expo ~58.0.26`, `expo-router ~58.0.32`, `react 19.3.0`, `react-native 0.88.1`, `zustand ^5.0.16`, `typescript ~6.0.3`, `vitest ^5.0.5`, `eslint-config-expo ~58.0.4`.
- Qualquer outra dependência entra com `npx expo install <pacote>`.
- **Antes de usar qualquer API do Expo**, abrir `https://docs.expo.dev/versions/v58.0.0/` na página do módulo. A regra do `AGENTS.md` do Forja vale aqui.
- Nunca criar nem editar `android/` à mão. Configuração nativa só via `app.json` e plugins.
- `npm test`, `npm run lint` e `npm run typecheck` passam antes de cada commit.

**Linguagem e dados**
- pt-BR em todo texto de interface. Nunca usar "fracasso", "limpo/sujo" ou "recaída" na interface; usar "deslize". Nenhum emoji na interface.
- Datas guardadas como `"AAAA-MM-DD"` no fuso do aparelho. Usar as funções de `src/lib/datas.ts`, copiado do Forja.
- Hábito tem `tipo` `'tabaco' | 'alcool' | 'sexual'`, sem "outro".
- Meta "reduzir" na v1 = **limite por dia** (`maxPorDia` unidades). O limite semanal fica para depois.
- **Dia sem relato** fica pendente: não conta nem quebra a sequência. O app pede os pendentes até **7 dias** para trás.
- Deslize nunca apaga total nem histórico. O **total de dias livres** conta `livre` + `dentroDaMeta`.

**Visual**
- Marcos: `[1, 3, 7, 14, 30, 90, 180, 365]` dias de sequência.
- Cores exatas (spec, seção 9): `abyss #030D19`, `bg #071526`, `surface #0E2540`, `surface2 #143253`, `line rgba(150,190,240,.11)`, `text #EAF2FB`, `muted #9DB3CC`, `faint #7F97B3`, `aqua #6FD3E0`, `peri #A9B6F5`, `sand #F2C98A`, `foam #7FE0B5`, `coral #F0A08A`.
- Deslize nunca em vermelho: contorno `sand`.
- Fontes: Fraunces só para números grandes, títulos e frases de acolhimento; Geist para toda a interface.
- Ícones em traço 1,6 (SVG), sem emojis. Animações só com `transform`/`opacity`, respeitando "reduzir movimento".
- Cada tela pronta é comparada lado a lado com o mockup v2 correspondente antes de fechar a task.

## Review Focus

1. **Relato editado depois:** mudar um dia antigo de "livre" para "deslize" (ou o contrário) recalcula sequência, total e recorde. Teste em Task 2.
2. **Início no futuro ou hoje, sem relatos:** sequência 0, total 0, nada pendente antes do início, sem erro. Teste em Task 2.
3. **Hábito antigo sem relatos:** pendentes limitados aos 7 dias antes de hoje, sem contar como livres. Teste em Task 2.
4. **Chave do cofre sumiu:** se o app for reinstalado ou os dados limpos e a chave sumir mas o banco ficar, o app começa do zero com um aviso, sem travar nem tentar abrir o banco com outra chave. Teste em Task 5.
5. **Valores fora do esperado no relato:** vontade fora de 0–10 ou `NaN`, quantidade negativa, meta "reduzir" com `usou: true` sem quantidade. São normalizados ou tratados de forma previsível. Testes em Tasks 2 e 5.

---

### Task 1: Projeto base

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `AGENTS.md`, `src/app/_layout.tsx`, `src/app/index.tsx`
- Create: `src/lib/datas.ts`, `src/lib/datas.test.ts`, copiados de `D:\app_mobile\src\lib\`
- Modify: `.gitignore`, mesclando com o do Forja e mantendo `.superpowers/`

**Interfaces:**
- Produces: alias `@/*` → `src/*`. Scripts `start`, `web`, `android`, `test`, `lint`, `typecheck`. Funções de `datas.ts`: `dataLocal`, `meioDia`, `dataValida`, `deslocarDia`, `formatarData`, `dataCurta`, `diaDaSemana`.

- [ ] **Step 1: Conferir o git.** O repositório já existe: público em `github.com/Antonio-byte10/app-mare`, branch `main`, com docs, README e LICENSE. **Por decisão do dono, todo o trabalho vai direto na `main`**, sem branch de feature. Rode `git status` e confirme que está na `main` e limpo.
- [ ] **Step 2: Criar `package.json`.**
  - `name: "mare"`, `version: "0.1.0"`, `main: "expo-router/entry"`, `license: "MIT"`, `private: true`.
  - Dependências e devDependencies nas versões das Global Constraints, mais as do Forja que se repetem aqui: `@expo/metro-runtime`, `expo-constants`, `expo-font`, `expo-linking`, `expo-status-bar`, `expo-system-ui`, `react-dom`, `react-native-web`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`.
  - Scripts como no Forja, mais `"android": "expo run:android"`.
- [ ] **Step 3: Instalar o resto.** `npm install`, depois `npx expo install expo-sqlite expo-secure-store expo-crypto @expo-google-fonts/fraunces @expo-google-fonts/geist`.
- [ ] **Step 4: `app.json`.**
  - Campos: `name "Maré"`, `slug "mare"`, `scheme "mare"`, `orientation "portrait"`, `userInterfaceStyle "dark"`, `backgroundColor "#071526"`, `android.package "com.mare.app"`, `android.versionCode 1`.
  - Plugins: `expo-router`, `expo-font`, `["expo-sqlite", { "useSQLCipher": true }]` (conferir o nome da opção na doc do SDK 58), `expo-secure-store`.
- [ ] **Step 5: Configurações.** `tsconfig.json` e `eslint.config.js` iguais aos do Forja. `vitest.config.ts` com `test.include: ['src/**/*.test.ts']` e ambiente `node`. `AGENTS.md` copiado do Forja.
- [ ] **Step 6: Telas mínimas.** `_layout.tsx` com `Stack` sem cabeçalho. `index.tsx` com o texto "Maré" em fundo `#071526`.
- [ ] **Step 7: Verificar.** `npm test`: os testes de `datas` passam. `npm run lint && npm run typecheck`: sem erros. `npx expo start --web`: a página mostra "Maré".
- [ ] **Step 8: Commit** ("chore: projeto base do Maré").

---

### Task 2: Tipos e contador que não pune

**Files:**
- Create: `src/lib/tipos.ts`, `src/lib/contador.ts`
- Test: `src/lib/contador.test.ts`

**Interfaces:**
- Produces (`tipos.ts`):
  ```ts
  export type TipoHabito = 'tabaco' | 'alcool' | 'sexual';
  export type Meta = { tipo: 'parar' } | { tipo: 'reduzir'; maxPorDia: number; unidade: string };
  export interface Habito { id: string; tipo: TipoHabito; apelido: string; cor: 'aqua' | 'peri' | 'coral' | 'sand' | 'foam';
    meta: Meta; inicio: string; custoPorDiaCentavos?: number; unidadesPorDia?: number; criadoEm: number }
  export interface RelatoHabito { habitoId: string; vontade: number; usou: boolean; quantidade?: number }
  export interface Relato { dia: string; habitos: RelatoHabito[]; humor?: 1 | 2 | 3 | 4 | 5; gatilhos: string[]; nota?: string; salvoEm: number }
  export type EstadoDia = 'livre' | 'dentroDaMeta' | 'deslize';
  ```
- Produces (`contador.ts`):
  - `estadoDoDia(meta: Meta, r: RelatoHabito): EstadoDia`
  - `normalizarRelatoHabito(r: RelatoHabito): RelatoHabito`: vontade arredondada e limitada a 0–10 (`NaN` → 0); quantidade < 0 → 0.
  - `resumoHabito(h: Habito, relatos: Relato[], hoje: string): ResumoHabito`, com
    `ResumoHabito = { sequenciaAtual: number; totalLivres: number; recorde: number; pendentes: string[]; hojeRespondido: boolean; estados: Record<string, EstadoDia>; percentual30d: number | null }`.

- [ ] **Step 1: Escrever os testes que falham** em `contador.test.ts`, com um hábito `parar` de início `2026-11-01` e `hoje = '2026-11-25'`:
  - `estadoDoDia`:
    - parar + `usou:false` → `'livre'`; parar + `usou:true` → `'deslize'`;
    - reduzir `maxPorDia:2` + `quantidade:2` → `'dentroDaMeta'`; + `quantidade:3` → `'deslize'`;
    - reduzir + `usou:true` sem quantidade → `'deslize'`; reduzir + `usou:false` → `'livre'`.
  - `resumoHabito`:
    - relatos livres em 13–24 e deslize em 12 → `sequenciaAtual 12`, `hojeRespondido false`;
    - livres em 1–11 → `recorde 12`, `totalLivres 23`;
    - **dia sem relato não quebra:** livres em 20, 22, 23, 24, sem relato em 21 → `sequenciaAtual 4`;
    - **edição posterior (Review 1):** trocar o relato de 12 para livre → `sequenciaAtual 24`, `recorde 24`;
    - **início hoje ou no futuro (Review 2):** `inicio '2026-11-25'` sem relatos → zeros e `pendentes []`; `inicio '2026-12-01'` → zeros, `pendentes []`, sem erro;
    - **hábito antigo sem relatos (Review 3):** `inicio '2026-01-01'` → `pendentes` são exatamente os 7 dias de `2026-11-18` a `2026-11-24`, `totalLivres 0`;
    - pendentes nunca incluem dias antes do início nem o dia de hoje;
    - `percentual30d` é `null` com menos de 7 relatos e, com 10 relatos (8 livres), dá `80`;
  - `normalizarRelatoHabito`: vontade 14 → 10, -2 → 0, `NaN` → 0, 6,6 → 7; quantidade -1 → 0 **(Review 5)**.
- [ ] **Step 2: Rodar** `npx vitest run src/lib/contador.test.ts`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3: Implementar `tipos.ts` e `contador.ts`.**
  - `resumoHabito` percorre os dias de `inicio` até `ontem` em ordem, usando `deslocarDia`, e inclui hoje só se houver relato.
  - Para cada dia com relato daquele hábito:
    - `livre`/`dentroDaMeta` → sequência +1 e total +1;
    - `deslize` → sequência = 0.
  - Dia sem relato: nada muda.
  - `recorde` é o maior valor que a sequência atingiu.
  - `pendentes` = dias sem relato em `[max(inicio, hoje-7), hoje-1]`.
  - `percentual30d` usa os relatos dos últimos 30 dias, incluindo hoje.
- [ ] **Step 4: Rodar** os testes. Esperado: PASS.
- [ ] **Step 5: Commit** ("feat: contador que não pune").

---

### Task 3: Marcos e economia

**Files:**
- Create: `src/lib/marcos.ts`, `src/conteudo/marcos.ts`
- Test: `src/lib/marcos.test.ts`

**Interfaces:**
- Consumes: `Habito`, `ResumoHabito` (Task 2).
- Produces:
  - `MARCOS: readonly number[]`, com os valores das Global Constraints.
  - `estadoMarco(dias: number, sequencia: number, recorde: number): 'atingido' | 'atual' | 'jaAlcancado' | 'futuro'`.
  - `proximoMarco(sequencia: number): { dias: number; faltam: number } | null`.
  - `nomeMarco(dias: number): string`: 1 → "24 horas", 3 → "3 dias", 7 → "1 semana", 14 → "2 semanas", 30 → "1 mês", 90 → "3 meses", 180 → "6 meses", 365 → "1 ano".
  - `economia(h: Habito, totalLivres: number): { centavos: number; unidades: number }`.
  - `textoMarco(tipo: TipoHabito, dias: number): string`, em `src/conteudo/marcos.ts`.

- [ ] **Step 1: Escrever os testes que falham.**
  - `estadoMarco`:
    - `(14, 12, 19)` → `'atual'`; `(7, 12, 19)` → `'atingido'`;
    - `(14, 2, 19)` → `'jaAlcancado'`, porque não pune quem já chegou lá antes;
    - `(30, 12, 19)` → `'futuro'`.
  - `proximoMarco`: `(12)` → `{dias:14, faltam:2}`; `(0)` → `{dias:1, faltam:1}`; `(365)` e `(400)` → `null`.
  - `economia`: hábito com `custoPorDiaCentavos 1550` e `unidadesPorDia 8` e `totalLivres 12` → `{centavos:18600, unidades:96}`; sem custo → `{centavos:0, unidades:0}`.
  - `textoMarco`:
    - `('tabaco', 1)` contém "monóxido de carbono";
    - todo `(tipo, dias)` de `MARCOS` devolve texto não vazio e sem emoji (regex `\p{Extended_Pictographic}`).
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar `marcos.ts`.**
  - `atingido` = `sequencia >= dias`.
  - `atual` = primeiro marco acima da sequência.
  - `jaAlcancado` = `recorde >= dias` sem estar atingido.
- [ ] **Step 4: Escrever o conteúdo de `src/conteudo/marcos.ts`.**
  - **Tabaco:** textos da linha do tempo da OMS, de `docs/01-pesquisa-fundamentos.md`, seção 2.1. Comentário com a fonte: `https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation`.
  - **Álcool e sexual:** textos de acolhimento sem afirmação médica (ex.: 7 → "Uma semana inteira escolhendo você."). Seguir o guia de voz da pesquisa, seção 7.5.
- [ ] **Step 5: Rodar** testes, lint e typecheck. Esperado: PASS.
- [ ] **Step 6: Commit** ("feat: marcos e economia").

---

### Task 4: Vontade por dia da semana

**Files:**
- Create: `src/lib/insights.ts`
- Test: `src/lib/insights.test.ts`

**Interfaces:**
- Consumes: `Relato` (Task 2), `deslocarDia`/`meioDia` (Task 1).
- Produces:
  - `vontadePorDiaDaSemana(relatos: Relato[], habitoId: string, hoje: string, semanas = 8): (number | null)[]`: 7 posições, 0 = domingo; média da vontade, `null` sem dados.
  - `diaDePico(medias: (number | null)[], totalRelatos: number): number | null`.
  - `NOMES_DIAS: readonly string[]` = `['domingos','segundas','terças','quartas','quintas','sextas','sábados']`.

- [ ] **Step 1: Escrever os testes que falham.**
  - `vontadePorDiaDaSemana` considera só os últimos `semanas*7` dias até hoje: relatos em sextas (`2026-11-20`, `2026-11-13`) com vontades 8 e 6 → índice 5 = 7.
  - Dias sem relato ficam `null`; outros hábitos são ignorados.
  - `diaDePico` devolve `null` com `totalRelatos < 10`. Com 10 ou mais, devolve o índice da maior média, e no empate o primeiro.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar.** Dia da semana via `meioDia(dia).getDay()`.
- [ ] **Step 4: Rodar.** Esperado: PASS.
- [ ] **Step 5: Commit** ("feat: vontade por dia da semana").

---

### Task 5: Armazenamento criptografado e store

**Files:**
- Create: `src/lib/chave.ts`, `src/lib/armazenamento.ts` (nativo), `src/lib/armazenamento.web.ts`, `src/store.ts`
- Test: `src/lib/chave.test.ts`, `src/store.test.ts`

**Interfaces:**
- Consumes: tipos da Task 2, `normalizarRelatoHabito`.
- Produces:
  - `chave.ts`: `interface Cofre { ler(nome: string): Promise<string | null>; gravar(nome: string, valor: string): Promise<void> }` e `obterChave(cofre: Cofre, bancoExiste: boolean, gerar: () => string): Promise<{ chave: string; recomecou: boolean }>`.
  - `armazenamento.ts`: `criarArmazenamento(): StateStorage`, no formato do `zustand/middleware`, sobre uma tabela `kv(chave TEXT PRIMARY KEY, valor TEXT)`, e `recomecouDoZero(): boolean`, que fica `true` depois de abrir quando `obterChave` devolveu `recomecou`. A versão web sempre devolve `false`.
  - `EstadoPersistido = { versao: 1; habitos: Habito[]; relatos: Relato[]; ajustes: Ajustes }`, exportado de `store.ts`. `avisoRecomeco` não é persistido: vem de `recomecouDoZero()` ao hidratar.
  - `store.ts`:
    - `useMare`, com estado `{ versao: 1; habitos: Habito[]; relatos: Relato[]; ajustes: Ajustes; avisoRecomeco: boolean }` e `Ajustes = { habitoAtivo?: string; ocultarNumeros: boolean }`.
    - Ações: `salvarHabito(h: Habito)`, `removerHabito(id: string)`, `salvarRelato(r: Relato)`, `setAjustes(p: Partial<Ajustes>)`, `dispensarAvisoRecomeco()`.
    - `useHydrated(): boolean` e `migrar(estado: unknown, versao: number): EstadoPersistido`.

- [ ] **Step 1: Escrever os testes que falham.**
  - `chave.test.ts`, com um cofre falso em memória:
    - sem chave e sem banco → gera, grava e devolve `recomecou:false`;
    - chave existente → devolve a mesma, sem chamar `gerar`;
    - **sem chave mas com banco existente (Review 4)** → gera uma nova chave e devolve `recomecou:true`.
  - `store.test.ts`:
    - `salvarRelato` com o mesmo `dia` substitui em vez de duplicar;
    - `salvarRelato` normaliza a vontade 12 para 10 **(Review 5)**;
    - `removerHabito` apaga o hábito e as entradas dele em todos os relatos, removendo relatos que ficarem vazios;
    - `migrar` com `versao` desconhecida ou estado inválido devolve o estado inicial vazio, sem lançar erro.
- [ ] **Step 2: Rodar.** Esperado: FAIL.
- [ ] **Step 3: Implementar `chave.ts`.**
- [ ] **Step 4: Implementar `armazenamento.ts`.**
  - Abre `mare.db` com `expo-sqlite` e aplica `PRAGMA key` com a chave de `obterChave`. O cofre é `expo-secure-store` (chave `mare.db.key`) e `gerar` usa 32 bytes de `expo-crypto` em hex.
  - Quando `recomecou` for `true`, apaga o arquivo antigo antes de abrir e marca `avisoRecomeco`.
  - Conferir na doc do SDK 58 como ativar o SQLCipher e aplicar a chave.
  - `armazenamento.web.ts` usa `localStorage`, com o comentário "somente desenvolvimento".
- [ ] **Step 5: Implementar `store.ts`.** Zustand + `persist` com `createJSONStorage(criarArmazenamento)`, `name: 'mare'`, `version: 1`, `migrate: migrar`. Mesmo padrão de `useHydrated` do Forja.
- [ ] **Step 6: Rodar** testes, lint e typecheck. Esperado: PASS.
- [ ] **Step 7: Commit** ("feat: dados criptografados no celular").

---

### Task 6: Tema, marca e navegação

**Files:**
- Create: `src/theme.ts`
- Create: `src/components/Fundo.tsx`, `Texto.tsx`, `Botao.tsx`, `Chip.tsx`, `Icone.tsx`, `Simbolo.tsx`, `BarraAbas.tsx`
- Create: `src/app/(abas)/_layout.tsx`, `(abas)/index.tsx`, `(abas)/diario.tsx`, `(abas)/aprender.tsx`, `(abas)/mais.tsx`, `src/app/fissura.tsx`
- Modify: `src/app/_layout.tsx`
- Delete: `src/app/index.tsx`

**Interfaces:**
- Produces:
  - `theme.ts`: `cores` (os tokens das Global Constraints), `fontes = { display: 'Fraunces_400Regular', displayLeve: 'Fraunces_300Light', ui: 'Geist_400Regular', uiMedia: 'Geist_500Medium', uiForte: 'Geist_600SemiBold' }` (conferir os nomes exportados pelos pacotes), `raio = { sm: 12, md: 16, lg: 20, xl: 24 }`, `linha` (espessura 1).
  - Componentes:
    - `<Fundo variante="padrao" | "mar">`: SVG com `RadialGradient`, como no mockup;
    - `<Texto tipo="display" | "titulo" | "corpo" | "rotulo" | "legenda" cor?>`;
    - `<Botao variante="primario" | "secundario" | "texto" onPress>`, com `scale 0.98` ao pressionar;
    - `<Chip ativo cor>`;
    - `<Icone nome tamanho cor>`, que cobre todos os ícones dos mockups v2 em traço 1,6;
    - `<Simbolo tamanho>`, o símbolo lua + onda copiado do `<symbol id="mare">` do mockup.
  - Rotas: `/(abas)`, `/fissura`.

- [ ] **Step 1: `theme.ts` e componentes base.** Medidas, raios e cores tirados do CSS de `telas-v2.html`.
- [ ] **Step 2: `_layout.tsx`.** Carrega as fontes. Enquanto não hidrata, mostra o fundo `#071526`. Se a fonte falhar, segue com a do sistema, como no Forja.
- [ ] **Step 3: `(abas)/_layout.tsx` com `BarraAbas`.** Abas Início, Diário, botão de onda no centro (navega para `/fissura`), Aprender e Mais. O botão de onda usa o gradiente água-marinha, sem brilho externo.
- [ ] **Step 4: Placeholders.** `fissura.tsx` e `aprender.tsx` mostram "Chega no Plano 2" em `Texto tipo="legenda"`.
- [ ] **Step 5: Verificar no navegador.** `npx expo start --web` em 390×844: barra de abas e símbolo iguais ao mockup v2, telas 4 e 6. Lint e typecheck passam.
- [ ] **Step 6: Commit** ("feat: tema, marca e navegação").

---

### Task 7: Criar e editar hábito

**Files:**
- Create: `src/app/habito/[id].tsx` (`id = "novo"` para criar), `src/components/Vazio.tsx`
- Modify: `src/app/(abas)/index.tsx`, para mostrar `Vazio` sem hábitos

**Interfaces:**
- Consumes: `salvarHabito`, `removerHabito` (Task 5); `Habito`, `Meta` (Task 2).
- Produces: rota `/habito/[id]`.

- [ ] **Step 1: Formulário.**
  - Campos com rótulo acima, em uma coluna: tipo (3 opções: "Cigarro / nicotina", "Álcool", "Pornografia / masturbação"), apelido (obrigatório, até 20 caracteres), cor (5 chips), meta (parar | reduzir; reduzir pede `maxPorDia` > 0 e `unidade`), início (padrão: hoje; não aceita data futura), custo por dia em R$ (opcional) e unidades por dia (opcional).
  - Erro aparece embaixo do campo. "Salvar" fica desativado enquanto houver erro. Na edição aparece "Remover hábito" com confirmação.
  - Ao salvar, gera `id` com `expo-crypto` `randomUUID()`.
- [ ] **Step 2: Início sem hábitos.** O `Vazio` mostra o símbolo, "Vamos começar pelo que você quer mudar." e o botão "Adicionar hábito".
- [ ] **Step 3: Verificar no navegador.** Criar hábito parar e hábito reduzir. Recarregar a página: os dados continuam. Apelido vazio e data futura mostram erro.
- [ ] **Step 4: Commit** ("feat: criar e editar hábitos").

---

### Task 8: Relato do dia

**Files:**
- Create: `src/app/relato/[dia].tsx`, `src/components/Deslizador.tsx`, `src/components/Segmento.tsx`, `src/components/Humor.tsx`
- Create: `src/conteudo/gatilhos.ts`: `GATILHOS = ['Ansiedade','Tédio','Solidão','Cansaço','Estresse','Celular à noite','Festa ou evento','Discussão']`

**Interfaces:**
- Consumes: `salvarRelato`, `useMare` (Task 5); `estadoDoDia` (Task 2); `dataValida`, `formatarData` (Task 1).
- Produces: rota `/relato/[dia]`. Data inválida ou futura volta para o Início.

- [ ] **Step 1: Tela fiel ao mockup 5.**
  - Um bloco expandido por hábito ativo naquele dia (`inicio <= dia`):
    - "Quanta vontade você sentiu hoje?" com `Deslizador` 0–10, padrão 0;
    - pergunta sim/não com o texto por tipo: "Você fumou hoje?", "Você bebeu hoje?", "Você usou hoje?";
    - na meta reduzir, se "Sim", aparece a quantidade em `unidade`.
  - Os outros hábitos aparecem recolhidos em linhas finas.
  - Depois: humor (5 rostos SVG), gatilhos (chips com seleção múltipla) e nota opcional.
  - Título com `formatarData(dia, { weekday:'long', day:'numeric', month:'long' })`. Para `hoje` mostra "Relato de hoje"; para outros dias, "Relato de" + data.
  - Abrir um dia que já tem relato carrega os valores salvos.
- [ ] **Step 2: Salvar.** Chama `salvarRelato` e volta.
  - Se algum hábito ficar `deslize`, mostra antes de voltar a mensagem: "Obrigado por registrar. Seus dias continuam contando." com o total de dias.
  - O fluxo completo de "Recomeçar com cuidado" fica para o Plano 2.
- [ ] **Step 3: Verificar no navegador.** Responder hoje e editar um dia passado. O resumo do Início muda de acordo, conferindo os casos da Task 2.
- [ ] **Step 4: Commit** ("feat: relato do dia").

---

### Task 9: Início com anel de água

**Files:**
- Create: `src/components/AnelAgua.tsx`, `src/components/Trio.tsx`, `src/components/LinhaPendente.tsx`
- Modify: `src/app/(abas)/index.tsx`

**Interfaces:**
- Consumes: `resumoHabito` (Task 2), `proximoMarco`, `economia` (Task 3), `ajustes.habitoAtivo`, `ajustes.ocultarNumeros`.
- Produces: `<AnelAgua sequencia proximo={{dias, faltam} | null} oculto={boolean}>`.

- [ ] **Step 1: `AnelAgua`.**
  - Arco SVG em gradiente `peri→aqua`, com progresso = `sequencia / proximo.dias`, ou cheio se `proximo` for `null`.
  - Dentro, duas ondas que derivam em `translateX` com a API `Animated` e `useNativeDriver: true`, em 10 s e 15 s, paradas quando "reduzir movimento" estiver ligado (`AccessibilityInfo.isReduceMotionEnabled`).
  - Número em Fraunces 84 e "dias seguidos". Com `oculto`, mostra só a água e "Um dia de cada vez".
- [ ] **Step 2: Montar a tela como o mockup 4.**
  - Data e saudação ("Bom dia" até 11h59, "Boa tarde" até 17h59, "Boa noite").
  - Chips dos hábitos, trocando `habitoAtivo`.
  - Anel e "faltam N dias para {nomeMarco}".
  - `Trio` com total, recorde e economia em `R$` (`toLocaleString('pt-BR', {style:'currency', currency:'BRL'})`), mostrando "—" sem custo.
  - `LinhaPendente`: "Relato de ontem" quando ontem está pendente. Senão "Relato de hoje", se hoje não foi respondido. Com mais de 1 pendente: "N relatos para pôr em dia". Toca → `/relato/[dia mais antigo pendente]`.
  - Aviso de recomeço (Task 5) como faixa dispensável: "Não encontramos a chave dos seus dados antigos, então o Maré começou do zero."
- [ ] **Step 3: Verificar no navegador.** Comparar lado a lado com o mockup 4. Sem relatos e com relatos, conferir sequência, total, recorde e próximo marco.
- [ ] **Step 4: Commit** ("feat: início com anel de água").

---

### Task 10: Diário com calendário

**Files:**
- Create: `src/components/Calendario.tsx`, `src/components/BarrasSemana.tsx`
- Modify: `src/app/(abas)/diario.tsx`

**Interfaces:**
- Consumes: `resumoHabito(...).estados` (Task 2), `vontadePorDiaDaSemana`, `diaDePico`, `NOMES_DIAS` (Task 4).
- Produces: `<Calendario mes="AAAA-MM" estados={Record<string, EstadoDia>} pendentes={string[]} hoje inicio onDia={(dia) => void}>`.

- [ ] **Step 1: `Calendario`, como o mockup 6.**
  - Semana começa no domingo, com cabeçalho `D S T Q Q S S`.
  - Estados:
    - `livre`/`dentroDaMeta`: fundo `foam` 13%;
    - `deslize`: contorno `sand`;
    - pendente: contorno `muted`;
    - hoje: contorno `aqua` com ponto;
    - futuro e antes do início: esmaecidos e não tocáveis.
  - Setas trocam o mês e não passam do mês atual. Toque num dia → `/relato/[dia]`.
  - Legenda embaixo.
- [ ] **Step 2: `BarrasSemana`.**
  - 7 barras com altura proporcional à média. Sem dado, a barra fica mínima e esmaecida.
  - Barra do pico em gradiente `sand`.
  - Texto: com pico, "Suas vontades sobem às {NOMES_DIAS[pico]}." Sem pico: "Depois de alguns relatos, você vai ver aqui os dias mais difíceis."
- [ ] **Step 3: Verificar no navegador.** Conferir os estados com relatos criados à mão e comparar lado a lado com o mockup 6.
- [ ] **Step 4: Commit** ("feat: diário com calendário").

---

### Task 11: Marcos e aba Mais

**Files:**
- Create: `src/app/marcos.tsx`, `src/components/LinhaDoTempo.tsx`
- Modify: `src/app/(abas)/mais.tsx`

**Interfaces:**
- Consumes: `MARCOS`, `estadoMarco`, `nomeMarco`, `economia` (Task 3), `textoMarco`, `resumoHabito`.
- Produces: rota `/marcos`.

- [ ] **Step 1: `marcos.tsx`, como o mockup 13.**
  - Título "Marcos · {apelido}".
  - `Trio`: fissuras vencidas, mostrando "0" até o Plano 2, unidades a menos e economia.
  - Linha do tempo de todos os `MARCOS`:
    - `atingido`: ponto `sand` com check;
    - `atual`: contorno `aqua` e barra de progresso;
    - `jaAlcancado`: contorno `sand` com a legenda "você já chegou aqui antes";
    - `futuro`: esmaecido com cadeado.
- [ ] **Step 2: Aba Mais.** Lista com linhas finas:
  - Hábitos (lista de hábitos → `/habito/[id]`, mais "Adicionar");
  - Marcos;
  - "Ocultar números" (interruptor ligado a `ajustes.ocultarNumeros`);
  - "Sobre" (versão, licença MIT, código aberto).
- [ ] **Step 3: Verificar no navegador.** Comparar com o mockup 13 e ligar "Ocultar números" para ver o Início mudar.
- [ ] **Step 4: Commit** ("feat: marcos e aba mais").

---

### Task 12: Verificação no Android

**Files:**
- Create: `scripts/android-env.mjs`. Adaptado de `D:\app_mobile\scripts\build-apk.mjs`: monta `JAVA_HOME`, `ANDROID_HOME`, `GRADLE_USER_HOME` e `JAVA_TOOL_OPTIONS` a partir de `MARE_ANDROID_DIR` (padrão `D:/android`) e roda `expo run:android` com esse ambiente.
- Modify: `package.json`: `"android": "node scripts/android-env.mjs"`

- [ ] **Step 1: Rodar o app num celular ou emulador.** `npm run android` gera o build de desenvolvimento e abre o app. Usa a chave de debug, então nenhuma chave de assinatura é necessária neste plano.
- [ ] **Step 2: Testar no aparelho.** Criar 2 hábitos, responder relatos, fechar o app à força e reabrir: tudo continua lá.
- [ ] **Step 3: Conferir a criptografia.** Com `adb shell run-as com.mare.app cat databases/mare.db | head -c 64`, a saída **não** pode conter `SQLite format 3` nem nomes de hábitos.
- [ ] **Step 4: Conferir os números.** `npm test`, `npm run lint` e `npm run typecheck` passam. Anotar no fim deste plano o resultado das conferências visuais das Tasks 6–11.
- [ ] **Step 5: Commit** ("chore: rodar no Android e verificação do plano 1").

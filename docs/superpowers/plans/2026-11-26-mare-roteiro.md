# Maré — roteiro dos planos de implementação

O design aprovado ([spec](../specs/2026-11-25-app-sobriedade-design.md)) tem cinco partes independentes. Cada uma vira um plano próprio, e cada plano termina num app que funciona e pode ser testado. Só o Plano 1 está detalhado. Os outros são escritos quando chegar a vez deles, em cima do código que já existir.

| Plano | Entrega | Seções do spec | Depende de |
|---|---|---|---|
| **1 · Núcleo diário** ([plano](2026-11-26-mare-plano-1-nucleo.md)) | Projeto Expo e marca no app. Dados criptografados no celular. Criar hábito, relato diário, contador que não pune, Início com anel de água, Diário com calendário e vontade por dia, Marcos. | 3, 5.1–5.4, 6.2, 6.4, 6.10, 9, 10 | — |
| **2 · Primeiro uso e cuidado** | Abertura, avaliação "Como você está" e resultado. Fissura agora em 3 passos. "Recomeçar com cuidado". Plano "se-então" e porquês. Aprender (biblioteca) e Apoio, com a opção "Contatos de emergência". | 6.1, 6.3, 6.5–6.7, 7.3 | 1 |
| **3 · Lembretes e privacidade** | Lembretes (rotina, "antes da onda", marcos) com texto discreto. Bloqueio por digital/PIN. Disfarce de nome e ícone. Backup cifrado e "apagar tudo". | 5.2 (backup), 6.9, 7.1, 7.2 | 1 (e o diário do 1 para o "antes da onda") |
| **4 · IA de cada um** | Adaptadores Gemini/OpenAI/Claude com streaming. Ajustes de IA (Direto e Meu servidor). Conversa. Refletir sobre um deslize. Trilhos de segurança e detecção de crise na conversa. Servidor do Render. | 6.8, 8, [02-provedores-ia](../../02-provedores-ia.md) | 1; 2 para "refletir sobre deslize" |
| **5 · Lançamento** | Ícones e splash a partir do símbolo. Build do APK assinado. README. Primeira Release no GitHub (beta). | 3, 10, 11 | 1–4 |

Os Planos 2, 3 e 4 só dependem do 1. Depois que o 1 estiver pronto, eles podem ser feitos em qualquer ordem.

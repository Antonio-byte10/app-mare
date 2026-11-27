# Política de privacidade do Maré

*Versão beta. Esta política descreve o que o app faz de fato; o código está aberto neste repositório para quem quiser conferir.*

O Maré foi feito para quem quer parar ou diminuir um hábito, e isso é um assunto íntimo. Por isso o princípio é simples: **o que você registra fica no seu celular, e só sai dele quando você pede.**

## Resumo

- Não existe conta, e-mail ou cadastro.
- Não há anúncios, análise de uso (analytics), rastreamento nem relatório automático de erros.
- Seus registros ficam em um banco de dados cifrado, só neste aparelho.
- O backup automático do Android está desligado.
- O app só usa a internet em três situações, e todas partem de um toque seu: a conversa com IA (opcional), o "Procurar atualização" e abrir links no navegador.
- "Apagar tudo" remove tudo o que o app guarda no aparelho.

## O que fica no seu celular

Hábitos, relatos diários, humor, gatilhos, notas, avaliações, "meus porquês", planos, registros de fissura, contatos de apoio que você adicionar, a conversa com a IA (se usar) e as configurações.

- **Banco cifrado.** Tudo isso fica em um banco SQLite protegido com SQLCipher.
- **Chave no cofre do Android.** A chave do banco é gerada no próprio aparelho e guardada no cofre seguro do Android (Keystore, por meio do `expo-secure-store`). Ela não é enviada a lugar nenhum.
- **PIN.** O PIN nunca é guardado: só um resumo irreversível (hash com sal) fica no cofre do aparelho.
- **Chaves da IA.** A chave do provedor de IA e o código do seu servidor também ficam no cofre do aparelho, fora do banco e fora dos backups.
- **Sem backup automático.** O app desliga o backup automático do Android (`allowBackup=false`). Isso protege a sua privacidade, mas tem um custo: **se você trocar de celular ou desinstalar o app, os dados não vêm junto**, a menos que você tenha feito o backup manual descrito abaixo.
- **Fotos dos porquês (opcional).** Se você escolher uma foto para um porquê, ela é reduzida, cifrada (AES-256-GCM) e guardada na pasta privada do app, com a chave no cofre do aparelho: nunca vai para a galeria, nunca é enviada a lugar nenhum nem à IA, e entra no backup cifrado. O app usa o seletor de fotos do Android, sem pedir permissão de arquivos nem de câmera. "Apagar tudo" remove as fotos e a chave.
- **Telas protegidas (opcional).** Você pode esconder o conteúdo do app na lista de apps recentes e impedir capturas de tela.
- **Bloqueio e disfarce (opcionais).** Bloqueio por PIN ou digital, e nome e ícone neutros para o app.

## Backups

Só existem quando você toca em **Mais → Backup e dados → Fazer backup**.

- O arquivo `.mare` é cifrado com **AES-256-GCM**. A chave vem da **sua senha** (mínimo de 8 caracteres) por meio do **scrypt**, com sal aleatório.
- **Sem a senha, ninguém consegue abrir o arquivo, nem o Maré, nem quem o desenvolve.** Não há como recuperá-la.
- O app entrega o arquivo à tela de compartilhar do Android, e você escolhe onde guardá-lo. O Maré não envia o arquivo a nenhum servidor.
- O backup inclui seus registros, as fotos dos porquês (dentro da parte cifrada) e a conversa com a IA. Ficam de fora o PIN, as chaves da IA, o bloqueio, o disfarce e as telas protegidas, que pertencem ao aparelho.
- O app mostra a data do último backup e, de tempos em tempos, pode sugerir fazer um. Essa data fica só no aparelho.
- Ao restaurar, o conteúdo atual do aparelho é substituído, e o app mostra um resumo antes de você confirmar.

## Conversa com IA (opcional)

A IA vem desligada. O app funciona por inteiro sem ela.

Se você a ligar, escolhe um provedor (**Google Gemini**, **OpenAI/ChatGPT** ou **Anthropic/Claude**) e usa **a sua própria chave** — ou, em vez disso, **o seu próprio servidor** no Render, com a chave guardada lá. Ao enviar uma mensagem, o app manda ao provedor (ou ao seu servidor, que repassa ao provedor):

1. as últimas mensagens da conversa (até 30, com limite de tamanho), com o que você escreveu e as respostas anteriores;
2. as instruções fixas do app para a IA;
3. um **contexto mínimo**: o tipo de hábito em termos neutros (por exemplo, "álcool"), a meta, os dias da sequência atual e os gatilhos mais frequentes dos últimos 7 relatos.

**Nunca são enviados:** o apelido que você deu ao hábito, seu nome, telefone, contatos, as notas livres dos relatos, fotos ou áudios.

Atenção: **o que você digita na conversa é enviado ao provedor**, então evite escrever dados que o identifiquem. Depois que chega ao provedor, o tratamento passa a seguir a política dele e o tipo de conta da sua chave (por exemplo, planos gratuitos de alguns provedores podem usar as conversas para melhorar modelos). Confira as regras do provedor que você escolheu. O comparativo está em [docs/02-provedores-ia.md](docs/02-provedores-ia.md).

Ao configurar a IA, o app também faz uma consulta à lista de modelos do provedor com a sua chave, para testar se ela funciona.

O servidor opcional (`servidor/servidor-ia.mjs`) é código aberto neste repositório, não guarda as conversas e só repassa o pedido ao provedor. Ele roda na sua conta do Render, e o Render pode registrar dados técnicos de acesso, como o endereço IP, conforme a política dele.

## Procurar atualização

O app **nunca** procura atualização sozinho. Só quando você toca em **Mais → Sobre o Maré → Procurar atualização**, ele consulta a lista de versões publicadas do projeto no GitHub. O GitHub, como qualquer site, vê o endereço IP da sua conexão. O app não envia nenhum dado seu nessa consulta e **não baixa nem instala nada**: se houver versão nova, ele apenas oferece abrir a página dela no navegador.

## Notificações

Os lembretes são **locais**: o Android os agenda no próprio celular. Não há servidor de notificações, e nada sobre você é enviado para disparar um lembrete. O texto é discreto e não cita o hábito. Você liga, desliga e escolhe os horários em **Mais → Lembretes**; o Android pede a sua permissão para mostrar notificações.

## Permissões do Android

O que o app pede:

| Permissão | Para quê |
|---|---|
| Internet | Conversa com IA (se você ligar) e "Procurar atualização" (se você tocar). |
| Notificações | Mostrar os lembretes locais que você agendar. |
| Reiniciar o aparelho (receber a conclusão da inicialização) | Reagendar os lembretes depois que o celular reinicia. |
| Vibração | Resposta tátil e vibração dos lembretes. |
| Biometria e impressão digital | Desbloquear o app com a digital, se você ligar o bloqueio. |

**Bloqueadas de propósito**, mesmo que alguma biblioteca as peça: acesso a arquivos e fotos (leitura e gravação de armazenamento, mídia de imagens), sobreposição sobre outros apps e detecção de captura de tela. Para escolher a foto de um porquê, o app usa o seletor de fotos do próprio Android, que entrega só a imagem que você tocar, sem que o app tenha acesso à sua galeria. O app **não** pede localização, câmera, microfone, contatos nem agenda. Os contatos de apoio são digitados por você.

## Apagar tudo

Em **Mais → Backup e dados → Apagar tudo** (com duas confirmações), o app remove o banco cifrado e a chave dele, as fotos dos porquês e a chave delas, o PIN, as chaves e o código da IA, os lembretes agendados e o disfarce do ícone, e volta ao primeiro uso. Não dá para desfazer. Cópias que você exportou para outro lugar não são afetadas: apague-as por lá. Desinstalar o app também remove os dados guardados nele.

## O que está fora do controle do app

- Backups que você guardar (nuvem, e-mail, outro celular): a segurança deles depende da senha que você escolheu e de onde os guardou.
- O que os provedores de IA e o GitHub fazem com as requisições que chegam a eles.
- Quem tiver o seu celular desbloqueado. Use o bloqueio do app e o disfarce se isso for uma preocupação.

## Saúde

O Maré informa e incentiva a procurar ajuda, mas não diagnostica, não prescreve e não substitui atendimento profissional. Na versão beta, os textos de saúde ainda não foram revisados por um profissional. Em sofrimento, procure o CVV (188) ou, em emergência, o SAMU (192).

## Mudanças e contato

Se esta política mudar, a mudança aparece aqui, no histórico do repositório. Dúvidas ou correções: abra uma *issue* em [github.com/Antonio-byte10/app-mare](https://github.com/Antonio-byte10/app-mare).

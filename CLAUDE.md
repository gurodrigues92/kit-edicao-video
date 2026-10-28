# Kit de edição de vídeo com Claude

Você vai editar vídeos curtos verticais (Reels, TikTok, Shorts) que a pessoa gravou no celular. Você corta os silêncios e os erros, põe legenda palavra por palavra, títulos, zoom, imagens e o fecho com a marca dela. O vídeo sai pronto pra postar em `saida/`.

Normalmente tudo roda no computador da pessoa e nada é enviado pra internet, a não ser o download do Whisper na primeira vez. **Se você estiver na nuvem (iPad), leia antes a seção "Modo nuvem" no fim deste arquivo: ela muda como o vídeo entra e sai.**

## Com quem você está falando

A pessoa não é programadora e nunca usou IA pra isso.
- Fale em português simples, sem termo técnico. "Arquivo" e "pasta" pode; "JSON", "render", "npm" e "terminal" evite, ou explique na primeira vez.
- Um passo por vez. Diga o que vai fazer, faça, conte o resultado.
- Você roda todos os comandos. Nunca peça pra ela abrir terminal, editar código ou mexer em arquivo de configuração.
- Antes de qualquer coisa demorada, diga quanto tempo leva. Exemplo: "vou preparar o vídeo, leva uns 3 minutos".
- Quando der erro, não mostre o erro cru. Diga o que aconteceu em uma frase e o que você vai fazer.

## Vários clientes

Se a pessoa disser que edita pra vários clientes, não trave na configuração da marca: pule essa parte e, no começo de cada edição, pergunte de quem é o vídeo e a marca dele (@, cor, foto ou logo). Atualize `src/marca.json` com a marca daquele cliente antes de gerar. Guarde os arquivos de marca de cada cliente em `public/marca/<cliente>/` pra reaproveitar.

Se ela não tiver o logo, use a foto do perfil do Instagram do cliente. Se o logo vier com fundo, tire o fundo antes de usar.

## Primeira vez (configuração)

1. Rode `npm run checar`. Ele mostra o que está pronto e o que falta.
2. Se faltar dependências, rode `npm install` (de 1 a 3 minutos). Um aviso sobre `install-scripts` ou `esbuild` é normal: ignore.
3. Configure a marca em `src/marca.json`. Pergunte uma coisa de cada vez:
   - **O @ do perfil** → campo `arroba`.
   - **A cor da marca** → campo `cor`, em hexadecimal. Se ela descrever ("verde-limão", "o rosa do meu logo"), escolha você. A cor aparece em letra grossa com contorno preto por cima do vídeo, então precisa ser clara e viva. Se a cor da marca for escura (azul-marinho, vinho, preto), use uma versão clara dela e explique o porquê.
   - **A foto de perfil** → peça pra ela arrastar o arquivo pra conversa ou dizer onde ele está. Copie pra `public/marca/perfil.jpg`.
   - **O logo (opcional)** → PNG com fundo transparente, em `public/marca/logo.png`, e `"logo": "marca/logo.png"`. Sem logo, deixe `"logo": null`.
4. Rode `npm run checar` de novo e confirme que a marca ficou OK.

## Cada vídeo

### 1. Receber o vídeo

Peça pra pessoa colocar o vídeo na pasta `entrada` do kit, um por vez. Se ela disser onde o arquivo está, copie você mesmo. Vídeo antigo que já foi editado pode ser movido pra uma subpasta `entrada/feitos/`, mas nunca apague vídeo dela.

**Vídeo no Google Drive.** Se ela falar em Drive, o vídeo está na pasta do app "Google Drive para computador", que aparece como uma pasta comum. Não use conector nem link do Drive: copie da pasta.
- Mac: `~/Library/CloudStorage/GoogleDrive-*/` (dentro, `Meu Drive` ou `My Drive`; drives compartilhados ficam em `Drives compartilhados` ou `Shared drives`).
- Windows: uma letra de unidade, quase sempre `G:`. Confira com `Get-PSDrive -PSProvider FileSystem` e procure `Meu Drive` ou `My Drive`.
- Ache o arquivo pelo nome ou pela pasta que ela citar. Busque só dentro do Drive, nunca no disco inteiro. Se achar mais de um parecido, mostre os nomes e pergunte qual.
- Copie pra `entrada/` (nunca mova nem apague nada do Drive). Se o arquivo estiver "só online", a cópia baixa ele primeiro: avise que pode levar alguns minutos, conforme o tamanho e a internet.
- Se não existir pasta do Drive no computador, diga em uma frase que falta instalar o "Google Drive para computador" e que o guia mostra como. Enquanto isso, ela pode baixar o vídeo pelo site do Drive e arrastar pra `entrada`.
- Se ela pedir o vídeo pronto de volta no Drive, depois de gerar copie o arquivo de `saida/` pra mesma pasta do Drive de onde veio o vídeo (sem apagar nada lá).

### 2. Preparar

Rode `npm run preparar`. Use tempo limite longo (30 min) ou rode em segundo plano, porque a primeira vez baixa o Whisper (cerca de 1,5 GB). Diga isso a ela:
- primeira vez: de 5 a 15 minutos;
- das próximas vezes: mais ou menos a duração do vídeo.

Ele cria:
- `public/projeto/video.mp4`: o vídeo em pé, 1080x1920, com o volume padronizado;
- `src/projeto/transcricao.json`: cada palavra com o segundo em que começa e termina;
- `src/projeto/transcricao.txt`: o mesmo texto, uma frase por linha, com os silêncios marcados. **Leia este primeiro.**
- `src/projeto/edicao.json`: uma edição inicial sem cortes (a anterior vira backup).

Vídeo deitado é cortado no centro. Avise se o rosto ficar fora do quadro.

### 3. Corrigir a transcrição

O Whisper erra nome próprio, marca e termo técnico. Leia o `.txt`, corrija o campo `texto` das palavras erradas no `transcricao.json` (sem mexer nos tempos) e mostre a ela a lista do que trocou. Se não tiver certeza de um nome, pergunte.

### 4. Planejar a edição e pedir aprovação

Monte o plano e mostre como lista numerada, com tempo em minuto:segundo e linguagem simples. Exemplo:

```
Cortes
1. 0:00 a 0:02, "é... então", começo hesitante
2. 0:14, silêncio de 1,2 s
3. 0:31 a 0:36, você repetiu a frase, fica a segunda vez

Títulos
1. Abertura: "3 ERROS" / "NO SEU ANÚNCIO"
2. 0:20: "ERRO 1" / "PÚBLICO"

Zoom: 0:12 ("isso muda tudo") e 0:40 (o preço)
Palavras em destaque na legenda: anúncio, grátis, 30 dias
```

Espere ela aprovar ou pedir mudança antes de seguir.

Como decidir (regras testadas em produção):
- **Os 3 primeiros segundos decidem se a pessoa assiste.** Ponha um título na tela desde o 0,0 s com a promessa do vídeo. Se a primeira frase for fraca ("oi gente, tudo bem?"), corte e comece na frase mais forte.
- **Cortes:** tire silêncio acima de 0,4 s, gaguejo, começo em falso, "é...", "tipo assim" e frase repetida (fique com a última vez, que costuma ser a melhor). Corte sempre na fronteira entre palavras, usando os tempos do `transcricao.json`: o trecho termina uns 0,08 s depois do fim da última palavra e o próximo começa 0,08 s antes da primeira. Nunca corte no meio de uma palavra.
- **Títulos:** de 2 a 5 palavras, só na mudança de assunto (um a cada 8 a 15 s, não em toda frase). O título nomeia o assunto, não repete a fala.
- **Zoom:** em momentos de ênfase, de 1 a 2,5 s, no máximo um a cada 5 s. Zoom demais cansa.
- **Imagens:** só se ela mandar (print, foto do produto, gráfico). Copie pra `public/imagens/`.
- **Destaques:** de 3 a 8 palavras-chave (número, nome do produto, palavra forte). A palavra sendo falada já fica colorida sozinha.
- **Número na tela precisa de fonte.** Se o vídeo cita pesquisa ou dado, pergunte de onde veio antes de virar título.

### 5. Escrever a edição

Edite `src/projeto/edicao.json`. **Todos os tempos são em segundos do vídeo ORIGINAL**, os mesmos da transcrição. O kit desconta os cortes sozinho.

```json
{
  "trechos": [{ "de": 0.0, "ate": 9.1 }, { "de": 10.55, "ate": 30.0 }],
  "titulos": [{ "em": 0.0, "ate": 4.3, "texto": "o que a ia precisa", "destaque": "saber", "posicao": "topo" }],
  "zooms": [{ "em": 20.3, "ate": 22.2, "forca": 0.12 }],
  "imagens": [{ "em": 17.5, "ate": 20.2, "arquivo": "print.png", "telaCheia": false }],
  "destaques": ["whatsapp", "errado"],
  "trilha": null,
  "legendas": true,
  "fecho": true
}
```

| Campo | O que é |
|---|---|
| `trechos` | Partes do vídeo que FICAM, em ordem e sem sobrepor. Cortar = deixar fora daqui. |
| `titulos` | `texto` em branco e `destaque` (opcional, maior) na cor da marca. `posicao`: `"topo"` (padrão, não cobre o rosto) ou `"meio"`. |
| `zooms` | Aproximação no rosto. `forca` de 0,08 (leve) a 0,2 (forte); o padrão é 0,12. |
| `imagens` | Arquivo em `public/imagens/`. Cartão em cima do vídeo, ou `telaCheia: true` pra cobrir tudo. |
| `destaques` | Palavras pintadas na cor da marca na legenda, sem diferença de acento ou maiúscula. |
| `trilha` | Música de fundo opcional: `{ "arquivo": "musica.mp3", "volume": 0.12 }`, arquivo em `public/audio/`. Só use música que ela tenha direito de usar. |
| `legendas` / `fecho` | Liga ou desliga a legenda e o fecho de 2 s com foto, @ e logo. |

Depois de editar, rode `npm run checar`. A última linha valida a edição. Corrija o que ele apontar antes de seguir.

### 6. Gerar o vídeo e mostrar

1. Rode `npm run render`. No computador leva de 2 a 4 vezes a duração do vídeo; na nuvem, umas 13 vezes. Avise antes.
2. Abra o resultado pra ela ver:
   - Mac: `open saida/video-final.mp4`
   - Windows: `start "" "saida\video-final.mp4"` (no PowerShell: `Start-Process saida\video-final.mp4`)
3. Pergunte o que mudar. Ela vai falar do jeito dela ("tira a parte que eu falo do preço", "o título tá em cima da minha cabeça"). Ache o trecho na transcrição, ajuste o `edicao.json`, rode `checar` e `render` de novo.

Pra muitos ajustes finos, `npm run previa` abre um editor no navegador com o vídeo atualizado na hora. É um servidor que fica rodando, então inicie em segundo plano e passe o endereço que ele mostrar (normalmente http://localhost:3000).

### 7. Fechar

Quando ela aprovar, renomeie `saida/video-final.mp4` pra algo como `saida/2026-10-23-3-erros-no-anuncio.mp4`, senão o próximo vídeo escreve por cima. Diga onde o arquivo está.

## Quando der problema

| Sinal | O que fazer |
|---|---|
| Whisper não instala no Mac (`git`, `make`, `xcrun` ou "command line tools") | Rode `xcode-select --install`. Abre uma janela da Apple: ela clica em Instalar e espera uns 10 minutos. Depois, `npm run preparar` de novo. |
| Whisper não instala no Windows | Confira a internet. Se o antivírus bloquear o `main.exe`, peça pra ela permitir. Apague `.cache/whisper` e tente de novo. |
| Windows: "a execução de scripts foi desabilitada" | Rode `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` no PowerShell (explique que só libera scripts no usuário dela), ou use `npm.cmd` no lugar de `npm`. |
| Cores lavadas e acinzentadas | É o vídeo em HDR do iPhone. Peça pra ela desligar em Ajustes > Câmera > Gravar Vídeo > Vídeo HDR e gravar de novo. |
| Render travou, ficou muito lento ou faltou memória | Peça pra ela fechar os outros programas e rode `npx remotion render src/index.ts Video saida/video-final.mp4 --crf 18 --concurrency 2`. |
| `npm run previa` diz que a porta está em uso | Já tem uma prévia aberta. Use o mesmo endereço ou feche a anterior. |
| Legenda fora de sincronia depois de corte | Algum trecho cortou no meio de uma palavra. Refaça os limites pelos tempos do `transcricao.json`. |

## Limites

- Não instale programa nenhum sem perguntar. O kit só precisa do Node.js, e o resto vem pelo `npm install`.
- Não apague nada de `entrada/`.
- Pra um efeito que o kit não tem, você pode editar `src/Video.tsx`. Mantenha o padrão do arquivo, rode `npm run tipos` (precisa sair sem erro) e gere um vídeo de teste antes de mostrar.

## Modo nuvem (iPad)

Você está na nuvem quando roda em Linux com a variável `CLAUDE_CODE_REMOTE=true`, ou quando a pessoa diz que usa iPad ou celular. Nesse caso ela não tem pasta nem terminal: só vê esta conversa. O resto do arquivo vale, com estas trocas.

**O computador da nuvem é apagado quando a conversa termina.** O que não estiver no repositório some: vídeo, transcrição, Whisper e marca. Por isso:
- configure a marca uma vez e salve no repositório (veja abaixo);
- termine cada vídeo na mesma conversa em que começou.

### Receber arquivos (vídeo, foto, logo)

Peça o **link do Google Drive** do arquivo. Ensine em uma frase como ela gera: no app do Drive, toque nos três pontinhos do arquivo, "Compartilhar", "Acesso geral: Qualquer pessoa com o link", e "Copiar link".

Pegue o ID do link (o trecho depois de `/d/` ou de `id=`) e baixe:

```
curl -sSL -o entrada/video.mp4 "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"
file entrada/video.mp4
```

Se o `file` disser HTML em vez de vídeo, o link não está aberto: peça pra ela conferir o "Qualquer pessoa com o link". Se ela mandar link de **pasta**, use `pip install gdown` e `gdown --folder <link> -O entrada/` e pergunte qual vídeo editar. Foto e logo vêm do mesmo jeito, direto pra `public/marca/`.

Não tente usar o conector do Google Drive pra vídeo: ele não aguenta arquivo desse tamanho.

### Salvar a marca

Depois de configurar `src/marca.json` e os arquivos em `public/marca/`, faça commit só desses arquivos e tente `git push origin HEAD:main`. Se o push pro `main` for recusado, abra um pull request com o título "Marca configurada" e explique a ela, passo a passo, como tocar em "Merge" no GitHub. Na próxima conversa a marca já vem pronta.

### Tempo

- Preparar: o Whisper instala de novo a cada conversa nova (uns 3 minutos), mais 2 vezes a duração do vídeo pra transcrever.
- Gerar o vídeo: umas 13 vezes a duração do vídeo. Um vídeo de 1 minuto leva uns 13 minutos.

Rode os dois em segundo plano e dê notícia a cada etapa.

### Entregar o vídeo

Ela não consegue abrir `saida/`. Depois de cada render, envie o arquivo e passe o link:

```
curl -sS -F "reqtype=fileupload" -F "time=72h" -F "fileToUpload=@saida/video-final.mp4" https://litterbox.catbox.moe/resources/internals/api.php
```

Diga a ela: "Abra o link no Safari, toque no vídeo, depois em compartilhar (o quadrado com a seta) e em Salvar Vídeo. O link vale 3 dias e quem tiver ele consegue ver o vídeo." Se o vídeo for sigiloso e ela não quiser link aberto, faça commit do MP4 numa branch e ensine a baixar pelo GitHub.

Só passe o link do vídeo final depois de ela aprovar as mudanças; para as versões de revisão, o mesmo link serve como prévia. O `npm run previa` não funciona na nuvem: não use.

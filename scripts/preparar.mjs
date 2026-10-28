// Prepara um vídeo gravado para edição:
// 1. converte para vertical 1080x1920, 30 fps (public/projeto/video.mp4)
// 2. transcreve a fala com o Whisper, palavra por palavra (src/projeto/transcricao.json e .txt)
// 3. cria um edicao.json inicial com o vídeo inteiro (o anterior vira backup)
//
// Uso: npm run preparar                      (pega o único vídeo da pasta entrada/)
//      npm run preparar -- entrada/meu.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const CLI = path.resolve("node_modules/@remotion/cli/remotion-cli.js");
const WHISPER_VERSAO = "1.5.5"; // a mais nova que compila no Mac sem cmake e tem binário pronto pro Windows
const MODELO = "medium"; // bom em português sem ser lento demais no processador
const PASTA_WHISPER = path.resolve(".cache/whisper");
const VIDEO_SAIDA = "public/projeto/video.mp4";

// ffmpeg e ffprobe vêm dentro do Remotion: o aluno não instala nada.
const remotion = (args) => execFileSync(process.execPath, [CLI, ...args], { stdio: ["ignore", "pipe", "inherit"] }).toString();

const passo = (n, txt) => console.log(`\n[${n}/4] ${txt}`);
const falhar = (txt) => { console.error(`\nERRO: ${txt}`); process.exit(1); };

// ---------- qual vídeo ----------
let entrada = process.argv[2];
if (!entrada) {
  const videos = readdirSync("entrada").filter((f) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(f));
  if (videos.length === 0) falhar("não achei vídeo na pasta entrada/. Coloque o arquivo lá e rode de novo.");
  if (videos.length > 1) falhar(`há ${videos.length} vídeos em entrada/ (${videos.join(", ")}). Diga qual: npm run preparar -- entrada/NOME`);
  entrada = path.join("entrada", videos[0]);
}
if (!existsSync(entrada)) falhar(`arquivo não encontrado: ${entrada}`);
console.log(`Vídeo: ${entrada}`);

mkdirSync(".cache", { recursive: true });
mkdirSync("public/projeto", { recursive: true });
mkdirSync("src/projeto", { recursive: true });

// ---------- 1. converter ----------
passo(1, "Convertendo para vertical 1080x1920 (pode levar 1 a 3 minutos)...");
// O ffmpeg do Remotion não tem o filtro fps, por isso o -r 30. Vídeo deitado é cortado no centro. Um quadro-chave por segundo deixa a prévia e os cortes leves. Volume padronizado em -16 LUFS (o do Instagram).
remotion(["ffmpeg", "-y", "-loglevel", "error", "-i", entrada,
  "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p", "-r", "30",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-g", "30", "-keyint_min", "30",
  "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", VIDEO_SAIDA]);
const duracao = Number(remotion(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", VIDEO_SAIDA]).trim());
if (!duracao) falhar("não consegui ler a duração do vídeo convertido.");
console.log(`Pronto: ${duracao.toFixed(1)} s`);

// ---------- 2. whisper ----------
passo(2, "Preparando o Whisper (só demora na primeira vez: baixa uns 1,5 GB)...");
try {
  await installWhisperCpp({ version: WHISPER_VERSAO, to: PASTA_WHISPER, printOutput: false });
  await downloadWhisperModel({ model: MODELO, folder: PASTA_WHISPER, printOutput: false });
} catch (e) {
  rmSync(PASTA_WHISPER, { recursive: true, force: true }); // instalação pela metade trava a próxima tentativa
  falhar(`não consegui instalar o Whisper. ${process.platform === "darwin" ? "No Mac, rode no Terminal: xcode-select --install, e tente de novo." : "Confira a internet e tente de novo."}\n${e.message}`);
}

// ---------- 3. transcrever ----------
passo(3, "Transcrevendo a fala (mais ou menos o tempo do vídeo)...");
const wav = ".cache/audio.wav";
remotion(["ffmpeg", "-y", "-loglevel", "error", "-i", VIDEO_SAIDA, "-ar", "16000", "-ac", "1", wav]);
const saida = await transcribe({
  inputPath: path.resolve(wav), whisperPath: PASTA_WHISPER, whisperCppVersion: WHISPER_VERSAO,
  model: MODELO, modelFolder: PASTA_WHISPER, tokenLevelTimestamps: true, language: "pt", splitOnWord: true, printOutput: false,
});
const palavras = toCaptions({ whisperCppOutput: saida }).captions
  .filter((c) => c.text.trim() && !/^\[.*\]$/.test(c.text.trim()))
  .map((c) => ({ texto: c.text.trim(), de: +(c.startMs / 1000).toFixed(2), ate: +(c.endMs / 1000).toFixed(2) }));
writeFileSync("src/projeto/transcricao.json", JSON.stringify({ arquivo: path.basename(entrada), duracao: +duracao.toFixed(2), palavras }, null, 1));

// Versão legível para o Claude planejar: uma linha por frase, com o tempo, e os silêncios marcados.
const linhas = [];
let atual = [];
const fecha = () => { if (atual.length) linhas.push(`[${atual[0].de.toFixed(2)} - ${atual.at(-1).ate.toFixed(2)}] ${atual.map((p) => p.texto).join(" ")}`); atual = []; };
palavras.forEach((p, i) => {
  const pausa = i > 0 ? p.de - palavras[i - 1].ate : 0;
  if (pausa >= 0.5) { fecha(); linhas.push(`   (silêncio de ${pausa.toFixed(1)} s)`); }
  atual.push(p);
  if (/[.?!…]["'”)]*$/.test(p.texto)) fecha();
});
fecha();
writeFileSync("src/projeto/transcricao.txt", linhas.join("\n") + "\n");

// ---------- 4. edição inicial ----------
passo(4, "Criando a edição inicial (vídeo inteiro, sem cortes)...");
const ED = "src/projeto/edicao.json";
if (existsSync(ED)) renameSync(ED, `src/projeto/edicao-backup-${Date.now()}.json`);
writeFileSync(ED, JSON.stringify({
  trechos: [{ de: 0, ate: +duracao.toFixed(2) }],
  titulos: [], zooms: [], imagens: [], destaques: [], trilha: null, legendas: true, fecho: true,
}, null, 2));

console.log(`\nTudo pronto. ${palavras.length} palavras transcritas em src/projeto/transcricao.txt`);

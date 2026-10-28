// Diagnóstico rápido: diz o que já está pronto e o que falta. Não muda nada.
import { existsSync, readFileSync, readdirSync, statfsSync } from "node:fs";

const linhas = [];
const ok = (cond, txt, falta) => linhas.push(`${cond ? "OK   " : "FALTA"} ${cond ? txt : falta}`);

const [maior] = process.versions.node.split(".").map(Number);
ok(maior >= 20, `Node.js ${process.versions.node}`, `Node.js ${process.versions.node} é antigo: instale a versão LTS em nodejs.org`);
ok(existsSync("node_modules/remotion"), "dependências instaladas", "dependências: rode npm install");

const { bavail, bsize } = statfsSync(".");
const livreGB = (bavail * bsize) / 1e9;
ok(livreGB > 5, `${livreGB.toFixed(0)} GB livres no disco`, `só ${livreGB.toFixed(1)} GB livres: libere pelo menos 5 GB`);

const marca = JSON.parse(readFileSync("src/marca.json", "utf8"));
ok(marca.arroba !== "@seuperfil", `marca: ${marca.arroba}`, "marca: falta configurar o @ (src/marca.json)");
ok(existsSync(`public/${marca.foto}`), "foto de perfil em public/" + marca.foto, `foto de perfil: coloque em public/${marca.foto}`);
if (marca.logo) ok(existsSync(`public/${marca.logo}`), "logo em public/" + marca.logo, `logo: arquivo public/${marca.logo} não existe`);

ok(existsSync(".cache/whisper"), "Whisper instalado", "Whisper ainda não instalado (instala sozinho no primeiro npm run preparar)");

const videos = existsSync("entrada") ? readdirSync("entrada").filter((f) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(f)) : [];
ok(videos.length > 0, `vídeo(s) em entrada/: ${videos.join(", ")}`, "nenhum vídeo em entrada/");
const t = JSON.parse(readFileSync("src/projeto/transcricao.json", "utf8"));
ok(existsSync("public/projeto/video.mp4") && t.palavras.length > 0, `vídeo preparado: ${t.arquivo} (${t.duracao} s, ${t.palavras.length} palavras)`, "nenhum vídeo preparado ainda (npm run preparar)");

// edição: erros que o render não acusa, só some o efeito
if (t.palavras.length > 0) {
  const ed = JSON.parse(readFileSync("src/projeto/edicao.json", "utf8"));
  const erros = [];
  ed.trechos.forEach((x, i) => {
    if (!(x.de < x.ate)) erros.push(`trecho ${i + 1}: "de" precisa ser menor que "ate"`);
    if (x.ate > t.duracao + 0.05) erros.push(`trecho ${i + 1}: termina em ${x.ate} s, mas o vídeo tem ${t.duracao} s`);
    if (i > 0 && x.de < ed.trechos[i - 1].ate) erros.push(`trecho ${i + 1} começa antes do trecho ${i} acabar`);
  });
  for (const k of ["titulos", "zooms", "imagens"]) ed[k].forEach((x, i) => { if (!(x.em < x.ate)) erros.push(`${k} ${i + 1}: "em" precisa ser menor que "ate"`); });
  ed.imagens.forEach((x) => { if (!existsSync(`public/imagens/${x.arquivo}`)) erros.push(`imagem não encontrada: public/imagens/${x.arquivo}`); });
  if (ed.trilha && !existsSync(`public/audio/${ed.trilha.arquivo}`)) erros.push(`trilha não encontrada: public/audio/${ed.trilha.arquivo}`);
  ok(erros.length === 0, "edicao.json sem erros", `edicao.json:\n      ${erros.join("\n      ")}`);
}

console.log(`Sistema:${process.platform === "darwin" ? "Mac" : process.platform === "win32" ? "Windows" : process.platform}\n`);
console.log(linhas.join("\n"));

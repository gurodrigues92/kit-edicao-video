// O vídeo inteiro: lê src/projeto/edicao.json, src/projeto/transcricao.json e src/marca.json.
// Para editar um vídeo, mude os JSON. Este arquivo só muda quando quiser um efeito novo.
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import marca from "./marca.json";
import transcricao from "./projeto/transcricao.json";
import { BLOCOS, ED, FPS, QUADROS_FALA, intervalo, paraFinal } from "./tempo";

const FECHO_S = 2.2;
export const duracaoFinal = () => QUADROS_FALA / FPS + (ED.fecho ? FECHO_S : 0);

const COR = marca.cor;
const CREME = "#F5F3EE";
const FONTE = "'Titulo', 'Arial Narrow', sans-serif";
const C = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const tw = (s: number, t0: number, t1: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(s, [t0, t1], [a, b], { ...C, easing: e });
const mola = (s: number, t: number, damping = 13) => (s < t ? 0 : spring({ frame: (s - t) * FPS, fps: FPS, config: { damping, stiffness: 190, mass: 0.8 } }));
const useS = () => useCurrentFrame() / FPS;

// ---------- fontes locais (o render não depende de internet) ----------
let fontesProntas = false;
const useFontes = () => {
  const [h] = React.useState(() => (fontesProntas ? null : delayRender("fontes")));
  React.useEffect(() => {
    if (h === null) return;
    Promise.all(["500", "700", "900"].map((p) => new FontFace("Titulo", `url(${staticFile(`fontes/BarlowCondensed-${p}.woff2`)})`, { weight: p }).load().then((f) => document.fonts.add(f))))
      .then(() => { fontesProntas = true; continueRender(h); })
      .catch(() => continueRender(h));
  }, [h]);
};

// ---------- vídeo gravado, com cortes e zoom ----------
const ZOOMS = ED.zooms.flatMap((z) => { const i = intervalo(z.em, z.ate); return i ? [{ ...i, forca: z.forca ?? 0.12 }] : []; });

const Gravacao: React.FC = () => {
  const s = useS();
  // zoom entra rápido, segura e sai suave; vários zooms não se somam, vale o maior
  const z = Math.max(0, ...ZOOMS.map((x) => x.forca * Math.min(mola(s, x.de, 16), tw(s, x.ate - 0.3, x.ate, 1, 0))));
  const fim = tw(s, QUADROS_FALA / FPS - 0.25, QUADROS_FALA / FPS + 0.1, 1, 0);
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + z})`, opacity: fim }}>
      {BLOCOS.map((b, i) => (
        <Sequence key={i} from={b.final} durationInFrames={b.quadros} layout="none">
          {/* 2 quadros de fade no áudio em cada emenda: corte seco dá estalo */}
          <OffthreadVideo src={staticFile("projeto/video.mp4")} trimBefore={b.origem}
            volume={(f) => interpolate(f, [0, 2, b.quadros - 2, b.quadros], [0, 1, 1, 0], C)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      ))}
      {/* escurece topo e base pra título e legenda lerem em qualquer fundo */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------- imagens por cima (print, foto de produto, gráfico) ----------
const Imagens: React.FC = () => {
  const s = useS();
  return (
    <>
      {ED.imagens.map((im, k) => {
        const i = intervalo(im.em, im.ate);
        if (!i || s < i.de || s >= i.ate) return null;
        const e = mola(s, i.de) * tw(s, i.ate - 0.2, i.ate, 1, 0);
        const src = staticFile(`imagens/${im.arquivo}`);
        if (im.telaCheia) {
          const zoom = 1.04 + 0.06 * tw(s, i.de, i.ate, 0, 1, Easing.linear);
          return <AbsoluteFill key={k} style={{ opacity: Math.min(1, e * 2), background: "#000" }}><Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} /></AbsoluteFill>;
        }
        return (
          <div key={k} style={{ position: "absolute", left: 110, right: 110, top: 330, height: 760, borderRadius: 36, overflow: "hidden", background: "#111",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: `4px solid ${COR}`, opacity: Math.min(1, e * 1.5), transform: `translateY(${(1 - e) * 120}px) scale(${0.9 + 0.1 * e})` }}>
            <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        );
      })}
    </>
  );
};

// ---------- títulos ----------
const Linha: React.FC<{ txt: string; cor: string; s: number; at: number; grande?: boolean }> = ({ txt, cor, s, at, grande }) => {
  const k = mola(s, at, 12);
  const base = grande ? 150 : 108;
  const size = Math.min(base, 900 / (0.5 * txt.length)); // largura aproximada da Barlow Condensed em caixa-alta
  return (
    <div style={{ fontFamily: FONTE, fontWeight: 900, fontSize: size, lineHeight: 0.92, textTransform: "uppercase", color: cor, whiteSpace: "nowrap",
      WebkitTextStroke: `${Math.max(4, size / 22)}px #000`, paintOrder: "stroke fill", opacity: Math.min(1, k * 2),
      transform: `scale(${1.6 - 0.6 * k})`, filter: k < 0.98 ? `blur(${(1 - k) * 10}px)` : undefined }}>{txt}</div>
  );
};

const Titulos: React.FC = () => {
  const s = useS();
  return (
    <>
      {ED.titulos.map((t, k) => {
        const i = intervalo(t.em, t.ate);
        if (!i || s < i.de || s >= i.ate) return null;
        const sai = tw(s, i.ate - 0.2, i.ate, 1, 0);
        return (
          <div key={k} style={{ position: "absolute", left: 0, right: 0, top: t.posicao === "meio" ? 760 : 210, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: sai }}>
            <Linha txt={t.texto} cor={CREME} s={s} at={i.de} />
            {t.destaque ? <Linha txt={t.destaque} cor={COR} s={s} at={i.de + 0.18} grande /> : null}
          </div>
        );
      })}
    </>
  );
};

// ---------- legenda palavra por palavra ----------
type P = { texto: string; de: number; ate: number };
const PALAVRAS: P[] = (transcricao.palavras as P[]).flatMap((p) => {
  const de = paraFinal(p.de);
  return de === null ? [] : [{ texto: p.texto, de, ate: paraFinal(p.ate, "antes") ?? de + 0.2 }];
});
// grupos curtos: no máximo 3 palavras ou 18 letras, e quebra em pausa ou fim de frase
const GRUPOS: P[][] = [];
for (const p of PALAVRAS) {
  const g = GRUPOS.at(-1);
  const ult = g?.at(-1);
  if (!g || !ult || g.length >= 3 || g.map((x) => x.texto).join(" ").length + p.texto.length > 18 || p.de - ult.ate > 0.35 || /[.?!,:;…]["'”)]*$/.test(ult.texto)) GRUPOS.push([p]);
  else g.push(p);
}
const limpa = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]/g, "");
const DESTAQUES = new Set(ED.destaques.map(limpa));

const Legenda: React.FC = () => {
  const s = useS();
  const gi = GRUPOS.findIndex((g, i) => s >= g[0].de && s < Math.min(g.at(-1)!.ate + 0.5, GRUPOS[i + 1]?.[0].de ?? Infinity));
  if (gi < 0) return null;
  const g = GRUPOS[gi];
  const k = mola(s, g[0].de, 14);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1190, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", transform: `scale(${0.85 + 0.15 * k})` }}>
      {g.map((p, j) => {
        const falando = s >= p.de && (j === g.length - 1 || s < g[j + 1].de);
        const cor = DESTAQUES.has(limpa(p.texto)) || falando ? COR : CREME;
        return (
          <span key={j} style={{ fontFamily: FONTE, fontWeight: 900, fontSize: 92, lineHeight: 1.05, textTransform: "uppercase", color: cor,
            WebkitTextStroke: "9px #000", paintOrder: "stroke fill", opacity: s >= p.de ? 1 : 0.5, transform: falando ? "scale(1.08)" : undefined, display: "inline-block" }}>{p.texto}</span>
        );
      })}
    </div>
  );
};

// ---------- fecho com a marca ----------
const Fecho: React.FC = () => {
  const s = useS();
  const at = QUADROS_FALA / FPS;
  if (s < at) return null;
  const k = mola(s, at, 16);
  return (
    <AbsoluteFill style={{ background: "#0A0A0A", alignItems: "center", justifyContent: "center", gap: 26, opacity: Math.min(1, k * 2) }}>
      <Img src={staticFile(marca.foto)} style={{ width: 300, height: 300, borderRadius: 150, objectFit: "cover", border: `8px solid ${COR}`, transform: `scale(${0.7 + 0.3 * k})` }} />
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 84, color: CREME, transform: `translateY(${(1 - k) * 40}px)` }}>{marca.arroba}</div>
      {marca.logo ? <Img src={staticFile(marca.logo)} style={{ height: 120, marginTop: 20, opacity: tw(s, at + 0.4, at + 0.8, 0, 1) }} /> : null}
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  useFontes();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Gravacao />
      <Imagens />
      <Titulos />
      {ED.legendas ? <Legenda /> : null}
      {ED.fecho ? <Fecho /> : null}
      {ED.trilha ? <Audio src={staticFile(`audio/${ED.trilha.arquivo}`)} volume={(f) => (ED.trilha!.volume ?? 0.12) * interpolate(f, [0, 15, QUADROS_FALA, QUADROS_FALA + FECHO_S * FPS], [0, 1, 1, 0], C)} /> : null}
    </AbsoluteFill>
  );
};

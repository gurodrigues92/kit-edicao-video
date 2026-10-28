// Todos os tempos do edicao.json são do vídeo ORIGINAL (os mesmos da transcrição).
// Aqui eles viram tempos do vídeo FINAL, já descontando os trechos cortados.
import edicao from "./projeto/edicao.json";

export const FPS = 30;

export type Trecho = { de: number; ate: number };
export type Edicao = {
  trechos: Trecho[];
  titulos: { em: number; ate: number; texto: string; destaque?: string; posicao?: "topo" | "meio" }[];
  zooms: { em: number; ate: number; forca?: number }[];
  imagens: { em: number; ate: number; arquivo: string; telaCheia?: boolean }[];
  destaques: string[];
  trilha: { arquivo: string; volume?: number } | null;
  legendas: boolean;
  fecho: boolean;
};
export const ED = edicao as Edicao;

/** Trechos em quadros: onde cada um começa no vídeo final. */
export const BLOCOS = (() => {
  let acc = 0;
  return ED.trechos.map((t) => {
    const ini = Math.round(t.de * FPS), fim = Math.round(t.ate * FPS);
    const b = { origem: ini, final: acc, quadros: Math.max(1, fim - ini) };
    acc += b.quadros;
    return b;
  });
})();
export const QUADROS_FALA = BLOCOS.reduce((s, b) => s + b.quadros, 0);

/**
 * Segundo do original → segundo do final.
 * Se cair num trecho cortado: "depois" pula pro começo do próximo trecho, "antes" volta pro fim do anterior, sem `lado` devolve null.
 */
export const paraFinal = (t: number, lado?: "antes" | "depois"): number | null => {
  const q = t * FPS;
  for (let i = 0; i < BLOCOS.length; i++) {
    const b = BLOCOS[i];
    if (q >= b.origem && q < b.origem + b.quadros) return (b.final + q - b.origem) / FPS;
    if (q < b.origem) {
      if (lado === "depois") return b.final / FPS;
      if (lado === "antes") return i === 0 ? null : (b.final) / FPS;
      return null;
    }
  }
  return lado === "antes" ? QUADROS_FALA / FPS : null;
};

/** Intervalo do original → intervalo do final (null se ficou inteiro dentro de um corte). */
export const intervalo = (em: number, ate: number) => {
  const a = paraFinal(em, "depois"), b = paraFinal(ate, "antes");
  return a === null || b === null || b - a < 0.1 ? null : { de: a, ate: b };
};

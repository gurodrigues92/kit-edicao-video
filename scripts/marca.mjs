// Troca a marca do vídeo pela de um cliente guardado em public/marcas/<cliente>/.
// Uso: npm run marca               (lista os clientes guardados)
//      npm run marca -- ikigai     (usa a marca da Ikigai no próximo vídeo)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const PASTA = "public/marcas";
const clientes = existsSync(PASTA) ? readdirSync(PASTA).filter((d) => existsSync(`${PASTA}/${d}/marca.json`)) : [];
const nome = process.argv[2];

if (!nome) {
  console.log(clientes.length ? `Clientes guardados: ${clientes.join(", ")}` : "Nenhum cliente guardado ainda.");
  process.exit(0);
}
if (!clientes.includes(nome)) {
  console.error(`ERRO: não achei public/marcas/${nome}/marca.json. Guardados: ${clientes.join(", ") || "nenhum"}`);
  process.exit(1);
}
const marca = JSON.parse(readFileSync(`${PASTA}/${nome}/marca.json`, "utf8"));
const faltando = [marca.foto, marca.logo].filter((f) => f && !existsSync(`public/${f}`));
if (faltando.length) {
  console.error(`ERRO: arquivo da marca não encontrado: ${faltando.map((f) => "public/" + f).join(", ")}`);
  process.exit(1);
}
writeFileSync("src/marca.json", JSON.stringify(marca, null, 2) + "\n");
console.log(`Marca ativa: ${nome} (${marca.arroba}, ${marca.cor})`);

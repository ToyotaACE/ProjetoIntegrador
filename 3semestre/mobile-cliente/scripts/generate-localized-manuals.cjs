const fs = require("node:fs");
const path = require("node:path");

const manuals = {
  "pt-BR": [
    "MANUAL DO VEÍCULO — EXEMPLO FICTÍCIO",
    "FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL",
    "",
    "Este manual e as informações são exemplos fictícios, criados",
    "somente para demonstração no aplicativo.",
    "Não são emitidos ou aprovados por fabricante ou autoridade.",
    "Não possuem validade legal e não orientam operação ou segurança.",
    "",
    "DADOS DEMONSTRATIVOS DO VEÍCULO",
    "Marca: Exemplo Motors",
    "Modelo: Veículo de demonstração",
    "Ano: Ano de exemplo",
    "Cor: Cor de exemplo",
    "Demais dados: Não informados",
    "",
    "Para informações reais, consulte a documentação oficial.",
  ],
  "en-US": [
    "VEHICLE MANUAL — FICTIONAL SAMPLE",
    "FICTIONAL • DEMONSTRATION • UNOFFICIAL",
    "",
    "This manual and its information are fictional examples created",
    "for demonstration in the app only.",
    "They are not issued or approved by a manufacturer or authority.",
    "They have no legal validity and provide no operation or safety advice.",
    "",
    "DEMONSTRATION VEHICLE DETAILS",
    "Make: Example Motors",
    "Model: Demo vehicle",
    "Year: Sample year",
    "Color: Sample color",
    "Other details: Not provided",
    "",
    "For real information, consult official documentation.",
  ],
  "es-ES": [
    "MANUAL DEL VEHÍCULO — EJEMPLO FICTICIO",
    "FICTICIO • DEMOSTRACIÓN • NO OFICIAL",
    "",
    "Este manual y sus datos son ejemplos ficticios, creados",
    "únicamente para la demostración en la aplicación.",
    "No los emite ni aprueba ningún fabricante o autoridad.",
    "No tienen validez legal ni ofrecen instrucciones de uso o seguridad.",
    "",
    "DATOS DEMOSTRATIVOS DEL VEHÍCULO",
    "Marca: Ejemplo Motors",
    "Modelo: Vehículo de demostración",
    "Año: Año de ejemplo",
    "Color: Color de ejemplo",
    "Otros datos: No informados",
    "",
    "Para información real, consulta la documentación oficial.",
  ],
  "ja-JP": [
    "車両マニュアル — 架空のサンプル",
    "架空・デモ用・非公式",
    "",
    "このマニュアルと記載情報は、アプリのデモ専用に作成した架空の例です。",
    "メーカーや公的機関が発行・承認したものではありません。",
    "法的効力はなく、運転や安全に関する案内ではありません。",
    "",
    "デモ用の車両情報",
    "メーカー：サンプルモーターズ",
    "車種：デモ用車両",
    "年式：サンプル",
    "色：サンプル",
    "その他の情報：記載なし",
    "",
    "実際の情報は、公式書類でご確認ください。",
  ],
};

const winAnsiExtras = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

function latinPdfText(line) {
  const bytes = [...line].map((character) => {
    const code = character.codePointAt(0);
    const byte = code <= 0x7f || (code >= 0xa0 && code <= 0xff)
      ? code
      : winAnsiExtras.get(character);
    if (byte === undefined) throw new Error(`Unsupported WinAnsi character: ${character}`);
    return byte.toString(16).padStart(2, "0");
  });
  return `<${bytes.join("").toUpperCase()}> Tj\n`;
}

function japanesePdfText(line) {
  const littleEndian = Buffer.from(line, "utf16le");
  const bigEndian = Buffer.alloc(littleEndian.length);
  for (let i = 0; i < littleEndian.length; i += 2) {
    bigEndian[i] = littleEndian[i + 1];
    bigEndian[i + 1] = littleEndian[i];
  }
  return `<${bigEndian.toString("hex").toUpperCase()}> Tj\n`;
}

function makePdf(lines, japanese) {
  const commands = ["BT\n/F1 15 Tf\n50 790 Td\n"];
  for (let index = 0; index < lines.length; index += 1) {
    if (index === 1) commands.push("/F1 11 Tf\n");
    if (index === 8) commands.push("/F1 12 Tf\n");
    if (index > 0) commands.push("0 -30 Td\n");
    commands.push(japanese ? japanesePdfText(lines[index]) : latinPdfText(lines[index]));
  }
  commands.push("ET\n");
  const stream = commands.join("");
  const font = japanese
    ? "<< /Type /Font /Subtype /Type0 /BaseFont /HeiseiMin-W3 /Encoding /UniJIS-UTF16-H /DescendantFonts [6 0 R] >>"
    : "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    font,
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`,
  ];
  if (japanese) {
    objects.push("<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HeiseiMin-W3 /CIDSystemInfo << /Registry (Adobe) /Ordering (Japan1) /Supplement 2 >> >>");
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

const directory = path.join("assets", "documents");
for (const [locale, lines] of Object.entries(manuals)) {
  const filename = path.join(directory, `vehicle-manual-${locale}.pdf`);
  fs.writeFileSync(filename, makePdf(lines, locale === "ja-JP"));
}

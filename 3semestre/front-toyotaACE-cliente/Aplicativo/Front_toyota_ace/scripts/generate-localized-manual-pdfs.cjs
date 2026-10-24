const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const manuals = {
  "pt-BR": {
    title: "Manual fictício de demonstração",
    subtitle: "Material demonstrativo Toyota ACE",
    warning: "FICTÍCIO · DEMONSTRAÇÃO · NÃO OFICIAL",
    disclaimer:
      "Criado somente para demonstrar a interface Toyota ACE. Este material não é emitido, aprovado, endossado ou validado pela Toyota ou por qualquer autoridade. Não tem validade documental, jurídica ou para manutenção. Não use como documento ou instrução real.",
    example:
      "Exemplo ilustrativo: Corolla · 2025 · prata · motor híbrido. Não identifica nem descreve um veículo real.",
    sections: [
      ["1. Antes de utilizar", "Confira o entorno do veículo e mantenha objetos soltos organizados. Os comandos e equipamentos variam conforme o veículo real; consulte os materiais oficiais aplicáveis antes de qualquer uso."],
      ["2. Cuidados gerais", "Mantenha o interior limpo e observe o veículo quanto a alterações aparentes. Para limpeza, peças, fluidos ou qualquer procedimento, siga somente as informações oficiais do fabricante e procure um profissional qualificado."],
      ["3. Sinais de alerta", "Se houver luz de advertência, ruído incomum, odor ou comportamento inesperado, pare em local seguro quando possível e procure assistência qualificada. Esta demonstração não substitui diagnóstico nem orientação de emergência."],
      ["4. Inspeções e manutenção", "Intervalos, especificações e procedimentos dependem do veículo e das condições de uso. Confirme-os em documentação oficial específica ou com uma concessionária autorizada; não realize serviços com base nesta amostra."],
      ["5. Contatos e assistência", "Use os canais oficiais e serviços de emergência da sua região conforme a situação. Este exemplo não fornece contatos, garantias, cobertura ou compromissos de atendimento."],
    ],
    footer:
      "Toyota ACE é usado apenas como contexto desta demonstração fictícia e não oficial.",
  },
  "en-US": {
    title: "Fictional demonstration manual",
    subtitle: "Toyota ACE demonstration material",
    warning: "FICTIONAL · DEMONSTRATION · UNOFFICIAL",
    disclaimer:
      "Created only to demonstrate the Toyota ACE interface. This material is not issued, approved, endorsed, or validated by Toyota or any authority. It has no documentary, legal, or maintenance validity. Do not use it as a real document or instruction.",
    example:
      "Illustrative example: Corolla · 2025 · silver · hybrid engine. It does not identify or describe a real vehicle.",
    sections: [
      ["1. Before use", "Check the area around the vehicle and secure loose items. Controls and equipment vary by real vehicle; consult applicable official materials before use."],
      ["2. General care", "Keep the interior clean and watch for visible changes. For cleaning, parts, fluids, or any procedure, follow only the manufacturer’s official information and consult a qualified professional."],
      ["3. Warning signs", "If a warning light, unusual noise, odor, or unexpected behavior occurs, stop in a safe place when possible and seek qualified assistance. This demonstration does not replace diagnosis or emergency advice."],
      ["4. Inspections and maintenance", "Intervals, specifications, and procedures depend on the vehicle and its use. Confirm them in vehicle-specific official documentation or with an authorized dealer; do not service a vehicle based on this sample."],
      ["5. Contacts and assistance", "Use official channels and local emergency services as appropriate. This sample provides no contacts, warranties, coverage, or service commitments."],
    ],
    footer:
      "Toyota ACE is referenced only as context for this fictional, unofficial demonstration.",
  },
  "es-ES": {
    title: "Manual ficticio de demostración",
    subtitle: "Material de demostración Toyota ACE",
    warning: "FICTICIO · DEMOSTRACIÓN · NO OFICIAL",
    disclaimer:
      "Creado únicamente para mostrar la interfaz Toyota ACE. Toyota ni ninguna autoridad emite, aprueba, avala o valida este material. No tiene validez documental, legal ni de mantenimiento. No lo utilice como documento o instrucción real.",
    example:
      "Ejemplo ilustrativo: Corolla · 2025 · plata · motor híbrido. No identifica ni describe un vehículo real.",
    sections: [
      ["1. Antes de utilizar", "Compruebe el entorno del vehículo y mantenga organizados los objetos sueltos. Los mandos y equipos varían según el vehículo real; consulte los materiales oficiales aplicables antes de usarlo."],
      ["2. Cuidados generales", "Mantenga limpio el interior y observe si hay cambios visibles. Para la limpieza, piezas, líquidos o cualquier procedimiento, siga únicamente la información oficial del fabricante y consulte a un profesional cualificado."],
      ["3. Señales de advertencia", "Si aparece un testigo, ruido u olor inusual o un comportamiento inesperado, deténgase en un lugar seguro cuando sea posible y solicite asistencia cualificada. Esta demostración no sustituye un diagnóstico ni consejos de emergencia."],
      ["4. Inspecciones y mantenimiento", "Los intervalos, especificaciones y procedimientos dependen del vehículo y de su uso. Confírmelos en documentación oficial específica o con un concesionario autorizado; no realice servicios basándose en esta muestra."],
      ["5. Contactos y asistencia", "Utilice los canales oficiales y los servicios de emergencia de su zona según corresponda. Este ejemplo no ofrece contactos, garantías, cobertura ni compromisos de servicio."],
    ],
    footer:
      "Toyota ACE se menciona únicamente como contexto de esta demostración ficticia y no oficial.",
  },
  "ja-JP": {
    title: "架空のデモ用マニュアル",
    subtitle: "Toyota ACE のデモ用資料",
    warning: "架空・デモ用・非公式",
    disclaimer:
      "この資料は Toyota ACE の画面を紹介する目的だけで作成されています。トヨタまたはいかなる機関も発行・承認・保証・検証していません。書類、法律、整備上の効力はありません。実際の書類や手順として使用しないでください。",
    example:
      "参考例：カローラ・2025年式・シルバー・ハイブリッド。実在する車両を特定または説明する情報ではありません。",
    sections: [
      ["1. 使用前の確認", "車両の周囲を確認し、車内の荷物を安全に整理してください。操作部や装備は実車によって異なります。使用前に該当する公式資料を確認してください。"],
      ["2. 日常のお手入れ", "車内を清潔に保ち、外観に変化がないか確認してください。清掃、部品、液体類、その他の作業については、必ずメーカーの公式情報を確認し、資格を持つ専門家に相談してください。"],
      ["3. 警告の兆候", "警告灯、異音、異臭、予期しない動作があった場合、安全を確保できる場所に停車し、専門家に相談してください。このデモは診断や緊急時の助言に代わるものではありません。"],
      ["4. 点検と整備", "点検時期、仕様、作業方法は車両や使用状況によって異なります。車両固有の公式資料または正規販売店で確認してください。このサンプルに基づく整備は行わないでください。"],
      ["5. 問い合わせとサポート", "状況に応じて、公式窓口または地域の緊急サービスをご利用ください。このサンプルは連絡先、保証、補償、対応を約束するものではありません。"],
    ],
    footer:
      "Toyota ACE は、この架空・非公式のデモを説明する文脈でのみ使用しています。",
  },
};

function renderManual(locale, manual) {
  const sections = manual.sections
    .map(
      ([title, body]) =>
        `<section><h2>${title}</h2><p>${body}</p></section>`,
    )
    .join("");
  const font = locale === "ja-JP"
    ? '"Yu Gothic", "Meiryo", sans-serif'
    : "Arial, sans-serif";

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <title>${manual.title} — Toyota ACE</title>
    <style>
      @page { size: A4; margin: 15mm 17mm 16mm; }
      * { box-sizing: border-box; }
      body { color: #222; font-family: ${font}; font-size: 10pt; line-height: 1.55; }
      header { border-bottom: 2px solid #b91c1c; padding-bottom: 10px; margin-bottom: 16px; }
      .brand { color: #991b1b; font-size: 9pt; font-weight: 700; letter-spacing: .04em; }
      h1 { font-size: 22pt; margin: 5px 0; }
      .warning { color: #7f1d1d; background: #fef2f2; border: 2px solid #b91c1c; padding: 12px; font-weight: 700; font-size: 11pt; margin: 16px 0 8px; }
      .disclaimer { border-left: 3px solid #b91c1c; padding: 4px 10px; margin: 8px 0 16px; }
      .example { background: #f3f4f6; padding: 10px; margin: 12px 0 18px; }
      h2 { font-size: 12pt; margin: 14px 0 3px; }
      p { margin: 0 0 8px; }
      footer { border-top: 1px solid #aaa; color: #555; font-size: 8.5pt; margin-top: 18px; padding-top: 8px; }
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>
    <header><div class="brand">TOYOTA ACE · ${manual.subtitle}</div><h1>${manual.title}</h1></header>
    <div class="warning">${manual.warning}</div>
    <p class="disclaimer">${manual.disclaimer}</p>
    <p class="example">${manual.example}</p>
    ${sections}
    <footer>${manual.footer}</footer>
  </body>
</html>`;
}

async function main() {
  const assetDirectory = path.resolve(__dirname, "..", "public", "assets");
  fs.mkdirSync(assetDirectory, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  try {
    for (const [locale, manual] of Object.entries(manuals)) {
      const page = await browser.newPage({ locale });
      await page.setContent(renderManual(locale, manual), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const filename = locale === "pt-BR"
        ? "manual-demonstracao-toyota-ace.pdf"
        : `manual-demonstracao-toyota-ace.${locale}.pdf`;
      const outputPath = path.join(assetDirectory, filename);
      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      const pdf = fs.readFileSync(outputPath).toString("binary");
      if (!pdf.startsWith("%PDF-") || !pdf.includes("%%EOF")) {
        throw new Error(`Generated an invalid PDF: ${filename}`);
      }
      if (locale === "ja-JP" && !pdf.includes("/FontFile2")) {
        throw new Error("The Japanese PDF must embed its Unicode font.");
      }
      console.log(`${locale}: ${filename} (${fs.statSync(outputPath).size} bytes)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

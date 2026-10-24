const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const babel = require("@babel/core");

function loadModule(relativePath) {
  const moduleSource = fs.readFileSync(
    path.join(__dirname, "..", relativePath),
    "utf8",
  );
  const compiled = babel.transformSync(moduleSource, {
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code;
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    Intl,
  });
  return loadedModule.exports;
}

const { translateChildren, translateText } = loadModule("contexts/translations.js");
const { formatCurrency } = loadModule("contexts/formatters.js");
const {
  findNextReviewDate,
  getAccessToken,
  getBearerHeaders,
  getDocumentList,
  isPdfSelection,
  partitionDocumentsByType,
} = loadModule("utils/vehicleDocuments.js");

test("the store label is available in all supported languages", () => {
  assert.equal(translateText("Loja", "pt-BR"), "Loja");
  assert.equal(translateText("Loja", "en-US"), "Store");
  assert.equal(translateText("Loja", "es-ES"), "Tienda");
  assert.equal(translateText("Loja", "ja-JP"), "ショップ");
});

test("financing and Brazilian tax ID labels are understandable in every locale", () => {
  assert.deepEqual(
    ["pt-BR", "en-US", "es-ES", "ja-JP"].map((language) =>
      translateText("Financiamento:", language),
    ),
    ["Financiamento:", "Financing:", "Financiación:", "ローン:"],
  );
  assert.equal(translateText("CPF", "ja-JP"), "ブラジル納税者番号（CPF）");
});

test("sidebar accessibility labels are available in all translated locales", () => {
  assert.equal(translateText("Recolher navegação", "en-US"), "Collapse navigation");
  assert.equal(translateText("Expandir navegação", "es-ES"), "Expandir navegación");
  assert.equal(translateText("Expandir navegação", "ja-JP"), "ナビゲーションを展開");
});

test("promotion labels and prices are localized", () => {
  assert.equal(translateText("Online", "pt-BR"), "On-line");
  assert.equal(translateText("Promoções especiais", "en-US"), "Special offers");
  assert.equal(translateText("Até 15% OFF", "es-ES"), "Hasta un 15 % de descuento");
  assert.equal(translateText("A partir de R$ 189,90", "ja-JP"), "189.90レアルから");
});

test("dynamic purchase labels remain localized", () => {
  assert.equal(translateText("Compra #42", "en-US"), "Purchase #42");
  assert.equal(translateText("Compra #42", "es-ES"), "Compra #42");
  assert.equal(translateText("Compra #42", "ja-JP"), "注文番号 #42");
});

test("Japanese uses natural kanji and kana for vehicle status", () => {
  const translated = translateText("Carregando veículos...", "ja-JP");
  assert.equal(translated, "車両情報を読み込み中...");
  assert.match(translated, /車両/);
});

test("vehicle documentation labels and disclaimers are localized in every supported language", () => {
  assert.deepEqual(
    ["pt-BR", "en-US", "es-ES", "ja-JP"].map((language) =>
      translateText("FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL", language),
    ),
    [
      "FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL",
      "FICTIONAL • DEMONSTRATION • UNOFFICIAL",
      "FICTICIO • DEMOSTRACIÓN • NO OFICIAL",
      "架空 • デモ用 • 非公式",
    ],
  );
  assert.equal(translateText("Documentação do veículo", "en-US"), "Vehicle documents");
  assert.equal(translateText("Manual do veículo (exemplo)", "es-ES"), "Manual del vehículo (ejemplo)");
  assert.equal(translateText("Visualizar PDF fictício", "ja-JP"), "デモ用PDFを表示");
  assert.deepEqual(
    ["pt-BR", "en-US", "es-ES", "ja-JP"].map((language) =>
      translateText("Adicionar documento", language),
    ),
    ["Adicionar documento", "Add document", "Añadir documento", "書類を追加"],
  );
});

test("document list and PDF picker results are normalized and validated", () => {
  const documents = [{ id: 1, nome: "manual.pdf" }];
  assert.deepEqual(getDocumentList(documents), documents);
  assert.deepEqual(getDocumentList({ documentos: documents }), documents);
  assert.deepEqual(getDocumentList({ content: documents }), documents);
  assert.equal(getDocumentList({}).length, 0);
  assert.equal(getBearerHeaders("  session-token  ").Authorization, "Bearer session-token");
  assert.equal(Object.keys(getBearerHeaders("")).length, 0);

  assert.equal(isPdfSelection({ name: "manual.PDF", size: 10 }), true);
  assert.equal(
    isPdfSelection({ name: "manual", mimeType: "application/pdf", size: 10 }),
    true,
  );
  assert.equal(
    isPdfSelection({ name: "manual.pdf", mimeType: "text/plain", size: 10 }),
    false,
  );
  assert.equal(
    isPdfSelection({ name: "manual.txt", mimeType: "application/pdf", size: 10 }),
    false,
  );
  assert.equal(isPdfSelection({ name: "manual.pdf", size: 0 }), false);
});

test("session tokens and shared document categories are normalized", () => {
  assert.equal(getAccessToken({ accessToken: "  session-token  " }), "session-token");
  assert.equal(getAccessToken({ accessToken: 123 }), "");
  assert.equal(getAccessToken(null), "");

  assert.deepEqual(
    JSON.parse(JSON.stringify(partitionDocumentsByType([
      { id: 1, tipo: "manual" },
      { id: 2, tipo: " DOCUMENTO " },
      { id: 3, tipo: "other" },
    ]))),
    {
      manuals: [{ id: 1, tipo: "manual" }],
      documents: [
        { id: 2, tipo: " DOCUMENTO " },
        { id: 3, tipo: "other" },
      ],
    },
  );
});

test("shared document workflow and service labels are localized in every supported language", () => {
  const cases = [
    [
      "Arquivos compartilhados da conta",
      "Account-shared files",
      "Archivos compartidos de la cuenta",
      "アカウントで共有中のファイル",
    ],
    [
      "Documentos enviados",
      "Uploaded documents",
      "Documentos subidos",
      "アップロード済みの書類",
    ],
    [
      "Manuais enviados",
      "Uploaded manuals",
      "Manuales subidos",
      "アップロード済みのマニュアル",
    ],
    [
      "Fazer login",
      "Sign in",
      "Iniciar sesión",
      "ログイン",
    ],
    [
      "Sua sessão expirou. Faça login novamente.",
      "Your session expired. Please sign in again.",
      "Tu sesión ha caducado. Inicia sesión de nuevo.",
      "セッションの有効期限が切れました。もう一度ログインしてください。",
    ],
    [
      "Baixar arquivo",
      "Download file",
      "Descargar archivo",
      "ファイルをダウンロード",
    ],
    [
      "Baixa o PDF neste dispositivo",
      "Downloads the PDF to this device",
      "Descarga el PDF en este dispositivo",
      "この端末にPDFをダウンロードします",
    ],
    [
      "Não foi possível iniciar uma sessão. Tente novamente.",
      "Could not start a session. Please try again.",
      "No se pudo iniciar sesión. Inténtalo de nuevo.",
      "セッションを開始できませんでした。もう一度お試しください。",
    ],
    [
      "Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.",
      "Could not upload the file. Check your connection and try again.",
      "No se pudo subir el archivo. Comprueba tu conexión e inténtalo de nuevo.",
      "ファイルをアップロードできませんでした。通信を確認して、もう一度お試しください。",
    ],
    [
      "Próxima revisão",
      "Next service",
      "Próxima revisión",
      "次回点検",
    ],
  ];

  for (const [source, ...expected] of cases) {
    assert.deepEqual(
      ["pt-BR", "en-US", "es-ES", "ja-JP"].map((language) =>
        translateText(source, language),
      ),
      [source, ...expected],
    );
  }
});

test("next vehicle service is one year after the latest saved review appointment", () => {
  assert.equal(
    findNextReviewDate([
      { data: "2025-02-10", tipoServico: "Revisão" },
      { data: "2026-03-05", tipo: "Revisão anual" },
      { data: "2025-11-10", tipoServico: "REVISAO" },
      { data: "2027-07-20", tipoServico: "Retirada" },
    ]),
    "2027-03-05",
  );
  assert.equal(
    findNextReviewDate([{ data: "2024-02-29", tipoServico: "Revisão" }]),
    "2025-02-28",
  );
  assert.equal(
    findNextReviewDate([{ data: "2025-11-10", tipoServico: "REVISAO" }]),
    "2026-11-10",
  );
  assert.equal(findNextReviewDate([{ data: "2025-01-01", tipo: "Retirada" }]), null);
});

function pdfTextHex(text, encoding) {
  if (encoding === "utf16be") {
    const littleEndian = Buffer.from(text, "utf16le");
    const bigEndian = Buffer.alloc(littleEndian.length);
    for (let i = 0; i < littleEndian.length; i += 2) {
      bigEndian[i] = littleEndian[i + 1];
      bigEndian[i + 1] = littleEndian[i];
    }
    return bigEndian.toString("hex").toUpperCase();
  }
  const winAnsi = new Map([["•", 0x95], ["—", 0x97]]);
  return [...text]
    .map((character) => {
      const code = character.codePointAt(0);
      return (winAnsi.get(character) ?? code).toString(16).padStart(2, "0");
    })
    .join("")
    .toUpperCase();
}

test("vehicle documentation selects a bundled fictional manual for each app language", () => {
  const appRoot = path.join(__dirname, "..");
  const rootLayout = fs.readFileSync(path.join(appRoot, "app", "_layout.js"), "utf8");
  const vehicleScreen = fs.readFileSync(
    path.join(appRoot, "app", "(tabs)", "vehicle.js"),
    "utf8",
  );
  const documentScreen = fs.readFileSync(
    path.join(appRoot, "app", "vehicle-documents.js"),
    "utf8",
  );
  const authContext = fs.readFileSync(
    path.join(appRoot, "contexts", "AuthContext.tsx"),
    "utf8",
  );
  const profileScreen = fs.readFileSync(
    path.join(appRoot, "app", "(tabs)", "profile.js"),
    "utf8",
  );

  assert.match(rootLayout, /Stack\.Screen name="vehicle-documents"/);
  assert.match(vehicleScreen, /pathname: "\/vehicle-documents"/);
  assert.match(vehicleScreen, /vehicle: JSON\.stringify\(vehicle\)/);
  assert.match(vehicleScreen, /vehicleId: String\(vehicle\.id\)/);
  assert.match(documentScreen, /useAccessibility\(\)/);
  assert.match(documentScreen, /demoManuals\[settings\.language\]/);
  assert.match(documentScreen, /Asset\.fromModule\(demoManual\)/);
  assert.match(documentScreen, /FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL/);
  assert.match(documentScreen, /DocumentPicker\.getDocumentAsync/);
  assert.match(documentScreen, /\/veiculos\/\$\{encodeURIComponent\(vehicleId\)\}\/documentos/);
  assert.match(documentScreen, /setDocuments\(getDocumentList\(await response\.json\(\)\)\)/);
  assert.match(documentScreen, /documentos\/\$\{encodeURIComponent\(document\.id\)\}\/arquivo/);
  assert.match(documentScreen, /method: "DELETE",[\s\S]*?getBearerHeaders\(accessToken\)/);
  assert.match(documentScreen, /getBearerHeaders\(accessToken\)/);
  assert.equal((documentScreen.match(/getBearerHeaders\(accessToken\)/g) || []).length, 6);
  assert.match(documentScreen, /String\(item\?\.id\) === vehicleId/);
  assert.match(authContext, /accessToken\?: string/);
  assert.match(authContext, /AsyncStorage\.setItem\("@toyota_ace:user", JSON\.stringify\(data\)\)/);
  assert.match(profileScreen, /user\?\.accessToken \? \{ accessToken: user\.accessToken \}/);

  const localizedManuals = [
    ["pt-BR", "FICTÍCIO • DEMONSTRAÇÃO • NÃO OFICIAL", "winAnsi"],
    ["en-US", "FICTIONAL • DEMONSTRATION • UNOFFICIAL", "winAnsi"],
    ["es-ES", "FICTICIO • DEMOSTRACIÓN • NO OFICIAL", "winAnsi"],
    ["ja-JP", "架空・デモ用・非公式", "utf16be"],
  ];
  for (const [locale, disclaimer, encoding] of localizedManuals) {
    const pdf = fs.readFileSync(
      path.join(appRoot, "assets", "documents", `vehicle-manual-${locale}.pdf`),
    );
    const content = pdf.toString("ascii");
    assert.equal(pdf.subarray(0, 8).toString("ascii"), "%PDF-1.4");
    assert.ok(content.includes(`<${pdfTextHex(disclaimer, encoding)}> Tj`), `${locale} disclaimer`);
    assert.ok(content.endsWith("%%EOF\n"));
  }
});

test("localized values can be switched back to Portuguese", () => {
  const translated = translateText("Senha", "ja-JP");
  assert.equal(translateText(translated, "pt-BR"), "Senha");
});

test("dynamic phrases split across JSX text nodes are localized as a whole", () => {
  const parts = [1, " de ", 3, " etapas concluídas"];
  assert.equal(translateChildren(parts, "en-US").join(""), "1: 3 steps completed");
  assert.equal(translateChildren(parts, "es-ES").join(""), "1: 3 etapas completadas");
  assert.equal(translateChildren(parts, "ja-JP").join(""), "1 / 3 段階完了");
});

test("unmatched mixed text still translates known labels independently", () => {
  assert.equal(
    translateChildren(["Data:", " ", "23/10/2026"], "en-US").join(""),
    "Date: 23/10/2026",
  );
});

test("BRL amounts use the selected language's number conventions", () => {
  assert.match(formatCurrency(1234.5, "pt-BR"), /1\.234,50/);
  assert.match(formatCurrency(1234.5, "en-US"), /1,234\.50/);
  assert.match(formatCurrency(1234.5, "es-ES"), /1234,50/);
  assert.match(formatCurrency(1234.5, "ja-JP"), /1,234\.50/);
  assert.match(formatCurrency(1234.5, "unsupported"), /1\.234,50/);
});

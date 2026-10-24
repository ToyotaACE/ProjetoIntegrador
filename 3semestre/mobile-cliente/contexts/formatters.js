const supportedLanguages = ["pt-BR", "en-US", "es-ES", "ja-JP"];

export function formatCurrency(value, language = "pt-BR") {
  const locale = supportedLanguages.includes(language) ? language : "pt-BR";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

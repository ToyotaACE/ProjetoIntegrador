export function findSpeechVoice(
  voices: SpeechSynthesisVoice[],
  language: string,
): SpeechSynthesisVoice | null {
  const normalize = (locale: string) => locale.replace(/_/g, "-").toLowerCase();
  const requestedLocale = normalize(language);
  const exactMatch = voices.find(
    (voice) => normalize(voice.lang) === requestedLocale,
  );
  if (exactMatch) return exactMatch;

  const requestedLanguage = requestedLocale.split("-")[0];
  return voices.find(
    (voice) => normalize(voice.lang).split("-")[0] === requestedLanguage,
  ) ?? null;
}

export function getSpeechVoices(
  synthesis: SpeechSynthesis,
  language: string,
  timeoutMs = 1500,
): Promise<SpeechSynthesisVoice[]> {
  const initialVoices = synthesis.getVoices();
  if (findSpeechVoice(initialVoices, language)) return Promise.resolve(initialVoices);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(voices);
    };
    const handleVoicesChanged = () => {
      const voices = synthesis.getVoices();
      if (findSpeechVoice(voices, language)) finish(voices);
    };
    const timeout = window.setTimeout(
      () => finish(synthesis.getVoices()),
      timeoutMs,
    );

    synthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });
}

export function getSpeechLanguage(language, platform) {
  if (platform !== "android") return language;

  return language.split("-")[0];
}

export function findSpeechVoice(voices, language) {
  const normalize = (value) => value.replace(/_/g, "-").toLowerCase();
  const requested = normalize(language);
  const exactVoice = voices.find(
    (voice) => normalize(voice.language) === requested,
  );
  if (exactVoice) return exactVoice;

  const languageCode = requested.split("-")[0];
  return voices.find(
    (voice) => voice.language && normalize(voice.language).split("-")[0] === languageCode,
  ) || null;
}

import { describe, expect, it } from "vitest";
import { findSpeechVoice, getSpeechVoices } from "@/lib/speech";

function voice(lang: string): SpeechSynthesisVoice {
  return { lang } as SpeechSynthesisVoice;
}

describe("findSpeechVoice", () => {
  it("chooses a voice matching the selected locale", () => {
    const voices = [
      voice("pt-BR"),
      voice("en-GB"),
      voice("en_US"),
      voice("es-ES"),
      voice("ja-JP"),
    ];

    expect(findSpeechVoice(voices, "en-US")?.lang).toBe("en_US");
    expect(findSpeechVoice(voices, "es-ES")?.lang).toBe("es-ES");
    expect(findSpeechVoice(voices, "ja-JP")?.lang).toBe("ja-JP");
  });

  it("uses a voice in the selected language when the region differs", () => {
    expect(findSpeechVoice([voice("en-GB")], "en-US")?.lang).toBe("en-GB");
  });

  it("never substitutes a voice from another language", () => {
    expect(findSpeechVoice([voice("pt-BR")], "ja-JP")).toBeNull();
  });

  it("waits for the browser to load a matching voice", async () => {
    let availableVoices: SpeechSynthesisVoice[] = [];
    const listeners = new Set<EventListener>();
    const synthesis = {
      getVoices: () => availableVoices,
      addEventListener: (_type: string, listener: EventListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: EventListener) => listeners.delete(listener),
    } as unknown as SpeechSynthesis;

    const result = getSpeechVoices(synthesis, "ja-JP");
    availableVoices = [voice("ja-JP")];
    listeners.forEach((listener) => listener(new Event("voiceschanged")));

    await expect(result).resolves.toEqual(availableVoices);
    expect(listeners.size).toBe(0);
  });
});

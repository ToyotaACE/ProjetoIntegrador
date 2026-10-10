import { Alert as NativeAlert } from "react-native";
import { useMemo } from "react";

import { useAccessibility } from "../contexts/AccessibilityContext";
import { translateText } from "../contexts/translations";

export function useLocalizedAlert() {
  const { settings } = useAccessibility();

  return useMemo(
    () => ({
      alert(title, message, buttons, options) {
      const localizedButtons = buttons?.map((button) => ({
        ...button,
        text: button.text ? translateText(button.text, settings.language) : button.text,
      }));

      NativeAlert.alert(
        translateText(title, settings.language),
        message ? translateText(message, settings.language) : message,
        localizedButtons,
        options,
      );
      },
    }),
    [settings.language],
  );
}
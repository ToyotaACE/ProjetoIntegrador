import { useCallback } from "react";
import {
  Alert as NativeAlert,
  type AlertButton,
  type AlertOptions,
} from "react-native";
import { useLanguage } from "@/contexts/LanguageContext";

export function useLocalizedAlert() {
  const { t } = useLanguage();

  const alert = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      NativeAlert.alert(
        t(title),
        message === undefined ? undefined : t(message),
        buttons?.map((button) => ({
          ...button,
          text: button.text ? t(button.text) : undefined,
        })),
        options
      );
    },
    [t]
  );

  return { alert };
}

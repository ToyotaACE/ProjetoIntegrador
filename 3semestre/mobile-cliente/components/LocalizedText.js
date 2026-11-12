import { useEffect, useId } from "react";
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from "react-native";
import { useIsFocused } from "@react-navigation/native";

import { useAccessibility } from "../contexts/AccessibilityContext";
import { translateChildren, translateText } from "../contexts/translations";

function plainText(children) {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return plainText(children.props.children);
  }
  return "";
}

function scaledStyle(style, fontScale) {
  const base = StyleSheet.flatten(style) || {};
  if (!base.fontSize || fontScale === 1) return style;
  return [style, { fontSize: base.fontSize * fontScale }];
}

export function LocalizedText({ children, style, accessibilityLabel, ...props }) {
  const { settings, registerText } = useAccessibility();
  const isFocused = useIsFocused();
  const id = useId();
  const translated = translateChildren(children, settings.language);
  const readingText = translateText(plainText(children), settings.language);

  useEffect(() => {
    if (isFocused) registerText(id, readingText);
    else registerText(id, "");
    return () => registerText(id, "");
  }, [id, isFocused, readingText, registerText]);

  return (
    <NativeText
      {...props}
      accessibilityLabel={accessibilityLabel ? translateText(accessibilityLabel, settings.language) : undefined}
      style={scaledStyle(style, settings.fontScale)}
    >
      {translated}
    </NativeText>
  );
}

export function LocalizedTextInput({ placeholder, accessibilityLabel, style, ...props }) {
  const { settings, registerText } = useAccessibility();
  const isFocused = useIsFocused();
  const id = useId();
  const defaultAccessibilityLabel =
    placeholder === "••••••••" ? "Senha" : placeholder;
  const readingText = translateText(accessibilityLabel || defaultAccessibilityLabel || "", settings.language);

  useEffect(() => {
    if (isFocused) registerText(id, readingText);
    else registerText(id, "");
    return () => registerText(id, "");
  }, [id, isFocused, readingText, registerText]);

  return (
    <NativeTextInput
      {...props}
      placeholder={placeholder ? translateText(placeholder, settings.language) : undefined}
      accessibilityLabel={
        accessibilityLabel || defaultAccessibilityLabel
          ? translateText(accessibilityLabel || defaultAccessibilityLabel, settings.language)
          : undefined
      }
      style={scaledStyle(style, settings.fontScale)}
    />
  );
}
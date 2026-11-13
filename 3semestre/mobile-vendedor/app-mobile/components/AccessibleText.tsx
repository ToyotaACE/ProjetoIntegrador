import { forwardRef } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

function scaleStyle(style: StyleProp<TextStyle>, scale: number) {
  const flattenedStyle = StyleSheet.flatten(style);
  if (!flattenedStyle) return style;

  const scaledStyle = { ...flattenedStyle };
  if (typeof scaledStyle.fontSize === "number") {
    scaledStyle.fontSize *= scale;
  }
  if (typeof scaledStyle.lineHeight === "number") {
    scaledStyle.lineHeight *= scale;
  }
  return scaledStyle;
}

export function AccessibleText({ style, ...props }: TextProps) {
  const { fontScale } = useTheme();
  const { t } = useLanguage();
  const scaledStyle = scaleStyle(style, fontScale / 100);
  const children =
    typeof props.children === "string" ? t(props.children) : props.children;

  return <NativeText {...props} style={scaledStyle}>{children}</NativeText>;
}

export const AccessibleTextInput = forwardRef<
  NativeTextInput,
  TextInputProps
>(function AccessibleTextInput({ style, ...props }, ref) {
  const { fontScale } = useTheme();
  const { t } = useLanguage();
  const scaledStyle = scaleStyle(style, fontScale / 100);
  const placeholder = props.placeholder ? t(props.placeholder) : undefined;

  return (
    <NativeTextInput
      {...props}
      placeholder={placeholder}
      ref={ref}
      style={scaledStyle}
    />
  );
});

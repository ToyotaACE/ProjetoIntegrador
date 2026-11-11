import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

// 🎨 TEMAS FICAM AQUI
const darkTheme = {
  background: "#121212",
  card: "#1c1c1c",
  box: "#292929",
  text: "#fff",
  subtext: "#b8b8b8",
  muted: "#777",
  primary: "#eb0a1e",
  progressBg: "#383838"
};

const lightTheme = {
  background: "#f4f4f4",
  card: "#ffffff",
  box: "#eeeeee",
  text: "#171717",
  subtext: "#5f5f5f",
  muted: "#858585",
  primary: "#eb0a1e",
  progressBg: "#dedede"
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(true);

  const toggleTheme = () => setDark(!dark);

  const theme = dark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Read persisted preference on mount — after hydration so SSR HTML
  // always renders as light (avoiding a flash mismatch).
  useEffect(() => {
    const stored = localStorage.getItem("td-theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const resolved = stored ?? (prefersDark ? "dark" : "light");
    setThemeState(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    setMounted(true);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("td-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // Prevent flash of unstyled content — render children without theme
  // class until we've read localStorage.
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", toggleTheme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

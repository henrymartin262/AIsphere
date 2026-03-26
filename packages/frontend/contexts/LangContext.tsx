"use client";

import { createContext, useContext, useState, useCallback, type PropsWithChildren } from "react";
import { translations, type Lang, type TranslationKey } from "../lib/i18n";

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "zh",
  toggleLang: () => {},
  t: (key) => translations.zh[key],
});

export function LangProvider({ children }: PropsWithChildren) {
  const [lang, setLang] = useState<Lang>("zh");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "zh" ? "en" : "zh"));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] ?? translations.zh[key],
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "fr" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
    }),
    {
      name: "locale-storage",
      onRehydrateStorage: () => (state) => {
        applyLocale(state?.locale ?? "fr");
      },
    },
  ),
);

applyLocale("fr");

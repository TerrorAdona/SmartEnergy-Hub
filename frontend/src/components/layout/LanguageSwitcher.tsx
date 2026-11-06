import { clsx } from "clsx";
import { useI18n } from "@/i18n/useI18n";
import type { Locale } from "@/stores/localeStore";

const options: Locale[] = ["fr", "en"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.chooser}
      className="flex h-10 items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
    >
      {options.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={clsx(
            "h-8 rounded-md px-2.5 text-xs font-semibold transition-colors",
            locale === code
              ? "bg-primary-600 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

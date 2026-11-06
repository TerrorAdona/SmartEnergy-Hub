import { useMemo } from "react";
import { messages } from "@/i18n/messages";
import { useLocaleStore, type Locale } from "@/stores/localeStore";

const intlTag: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const t = messages[locale];
  const tag = intlTag[locale];
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }),
    [tag],
  );

  return {
    locale,
    setLocale,
    t,
    tag,
    formatNumber: (value: number) => numberFormat.format(value),
    formatDateTime: (value: string | Date) => new Date(value).toLocaleString(tag),
    formatTime: (value: string | Date) =>
      new Date(value).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" }),
  };
}

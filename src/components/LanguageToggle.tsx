import { useLanguage } from "@/i18n/LanguageContext";

const LanguageToggle = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")}
      className="rounded-lg px-3 py-2 text-xs font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
    >
      {locale === "pt-BR" ? "🇺🇸 EN" : "🇧🇷 PT"}
    </button>
  );
};

export default LanguageToggle;

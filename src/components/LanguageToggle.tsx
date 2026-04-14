import { useLanguage } from "@/i18n/LanguageContext";

const LanguageToggle = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")}
      className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
    >
      {locale === "pt-BR" ? "🇺🇸 EN" : "🇧🇷 PT"}
    </button>
  );
};

export default LanguageToggle;

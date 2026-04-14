import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/i18n/LanguageContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
      title={theme === "dark" ? (t("lightMode") as string) : (t("darkMode") as string)}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;

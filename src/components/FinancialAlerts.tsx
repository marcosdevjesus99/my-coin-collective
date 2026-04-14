import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Transaction } from "@/components/TransactionDialog";

interface Category {
  id: string;
  name: string;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  totalEntradas: number;
  totalSaidas: number;
}

interface Alert {
  id: string;
  message: string;
}

const FinancialAlerts = ({ transactions, categories, totalEntradas, totalSaidas }: Props) => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    const result: Alert[] = [];

    // Alert: expenses > income
    if (totalSaidas > totalEntradas && totalEntradas > 0) {
      result.push({ id: "overspending", message: t("alertOverspending") as string });
    }

    // Alert: category > 40%
    if (totalSaidas > 0) {
      const map = new Map<string, number>();
      transactions
        .filter((tr) => tr.type === "saida")
        .forEach((tr) => {
          const catId = tr.category_id || "other";
          map.set(catId, (map.get(catId) || 0) + Number(tr.amount));
        });

      for (const [catId, amount] of map.entries()) {
        const pct = (amount / totalSaidas) * 100;
        if (pct > 40) {
          const catName = categories.find((c) => c.id === catId)?.name || "Outros";
          result.push({
            id: `cat-${catId}`,
            message: `${t("alertCategoryDominant") as string} ${catName} (${Math.round(pct)}%)`,
          });
        }
      }
    }

    // Alert: income consumed > 80%
    if (totalEntradas > 0) {
      const pct = Math.round((totalSaidas / totalEntradas) * 100);
      if (pct >= 80 && pct <= 100) {
        result.push({
          id: "consumed",
          message: (t("alertIncomeConsumed") as string).replace("{percent}", String(pct)),
        });
      }
    }

    return result;
  }, [transactions, categories, totalEntradas, totalSaidas, t]);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
          <p className="flex-1 text-xs font-medium text-yellow-200">{alert.message}</p>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(alert.id))}
            className="shrink-0 text-yellow-500/60 hover:text-yellow-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FinancialAlerts;

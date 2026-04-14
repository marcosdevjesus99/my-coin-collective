import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Transaction } from "@/components/TransactionDialog";

interface Category {
  id: string;
  name: string;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  showBalance: boolean;
  formatCurrency: (v: number) => string;
}

const COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(200, 98%, 39%)",
  "hsl(160, 84%, 39%)",
  "hsl(340, 82%, 52%)",
  "hsl(25, 95%, 53%)",
  "hsl(280, 67%, 51%)",
];

const InsightsSection = ({ transactions, categories, showBalance, formatCurrency }: Props) => {
  const { t } = useLanguage();

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((tr) => tr.type === "saida")
      .forEach((tr) => {
        const catId = tr.category_id || "uncategorized";
        map.set(catId, (map.get(catId) || 0) + Number(tr.amount));
      });

    return Array.from(map.entries())
      .map(([catId, value]) => ({
        name: categories.find((c) => c.id === catId)?.name || "Outros",
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const topCategory = expensesByCategory[0];

  if (expensesByCategory.length === 0) {
    return (
      <div className="rounded-xl bg-card p-4 border border-border/40 text-center">
        <p className="text-sm text-muted-foreground">{t("noData") as string}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top category card */}
      {topCategory && (
        <div className="rounded-xl bg-card p-4 shadow-lg border border-border/40">
          <p className="text-xs text-muted-foreground">{t("topCategory") as string}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{topCategory.name}</p>
          <p className="text-sm font-semibold text-destructive tabular-nums">
            {showBalance ? formatCurrency(topCategory.value) : "••••"}
          </p>
        </div>
      )}

      {/* Pie chart */}
      <div className="rounded-xl bg-card p-4 shadow-lg border border-border/40">
        <p className="text-xs text-muted-foreground mb-3">{t("expensesByCategory") as string}</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {expensesByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-2">
          {expensesByCategory.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;

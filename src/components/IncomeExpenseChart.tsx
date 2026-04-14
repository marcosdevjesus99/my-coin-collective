import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  totalEntradas: number;
  totalSaidas: number;
  showBalance: boolean;
  formatCurrency: (v: number) => string;
}

const IncomeExpenseChart = ({ totalEntradas, totalSaidas, showBalance, formatCurrency }: Props) => {
  const { t } = useLanguage();

  const data = useMemo(() => [
    { name: t("income") as string, value: totalEntradas, color: "hsl(var(--primary))" },
    { name: t("expenses") as string, value: totalSaidas, color: "hsl(var(--destructive))" },
  ], [totalEntradas, totalSaidas, t]);

  if (totalEntradas === 0 && totalSaidas === 0) return null;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-lg border border-border/40 mb-4 animate-fade-in">
      <p className="text-xs text-muted-foreground mb-3 font-medium">{t("incomeVsExpenses") as string}</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barCategoryGap={12}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number) => showBalance ? formatCurrency(value) : "••••"}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;

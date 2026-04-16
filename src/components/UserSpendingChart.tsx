import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import type { Transaction } from "@/components/TransactionDialog";

interface Props {
  transactions: Transaction[];
  showBalance: boolean;
  formatCurrency: (v: number) => string;
}

const COLORS = [
  "hsl(200, 98%, 50%)",
  "hsl(340, 82%, 55%)",
  "hsl(160, 84%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(262, 83%, 60%)",
  "hsl(25, 95%, 55%)",
];

const UserSpendingChart = ({ transactions, showBalance, formatCurrency }: Props) => {
  const { t } = useLanguage();
  const { members, getName } = useGroupMembers();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((tr) => tr.type === "saida" && tr.user_id)
      .forEach((tr) => {
        const id = tr.user_id as string;
        map.set(id, (map.get(id) || 0) + Number(tr.amount));
      });

    return Array.from(map.entries())
      .map(([userId, value]) => ({
        userId,
        name: getName(userId) || "Usuário",
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, getName]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Only show when group has 2+ members AND there are user-tagged expenses from 2+ people
  if (members.length < 2 || data.length < 2 || total === 0) return null;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-lg border border-border/40 animate-fade-in">
      <p className="text-xs text-muted-foreground mb-4 font-medium">
        {t("spendingByUser") as string}
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => (showBalance ? formatCurrency(value) : "••••")}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {data.map((entry, i) => (
          <div key={entry.userId} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="text-foreground font-medium">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSpendingChart;

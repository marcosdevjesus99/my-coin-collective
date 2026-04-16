import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp, TrendingDown, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TransactionDialog from "@/components/TransactionDialog";
import TransactionList, { TransactionListSkeleton } from "@/components/TransactionList";
import CategoryManager, { useCategories } from "@/components/CategoryManager";
import ProfileEditor, { useProfile } from "@/components/ProfileEditor";
import InsightsSection from "@/components/InsightsSection";
import InvestmentSection from "@/components/InvestmentSection";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import FinancialAlerts from "@/components/FinancialAlerts";
import UserSpendingChart from "@/components/UserSpendingChart";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Transaction } from "@/components/TransactionDialog";

type FilterType = "all" | "entrada" | "saida";
type TabType = "transactions" | "insights" | "investments";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const profile = useProfile();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevMonthTransactions, setPrevMonthTransactions] = useState<Transaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [activeTab, setActiveTab] = useState<TabType>("transactions");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = t("months") as readonly string[];

  // Build month/year options
  const monthOptions = useMemo(() => {
    const options = [];
    for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
      for (let m = 0; m < 12; m++) {
        options.push({ month: m, year: y, label: `${months[m]} ${y}` });
      }
    }
    return options;
  }, [months]);

  const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  const endDate = selectedMonth === 11
    ? `${selectedYear + 1}-01-01`
    : `${selectedYear}-${String(selectedMonth + 2).padStart(2, "0")}-01`;

  // Previous month dates
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevStartDate = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`;
  const prevEndDate = startDate;

  const fetchTransactions = useCallback(async () => {
    const [current, previous] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("*")
        .gte("date", prevStartDate)
        .lt("date", prevEndDate),
    ]);

    if (!current.error && current.data) setTransactions(current.data as Transaction[]);
    if (!previous.error && previous.data) setPrevMonthTransactions(previous.data as Transaction[]);
    setLoading(false);
  }, [startDate, endDate, prevStartDate, prevEndDate]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  const totalEntradas = transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const totalSaidas = transactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
  const saldo = totalEntradas - totalSaidas;

  // Previous month balance for variation
  const prevEntradas = prevMonthTransactions.filter((t) => t.type === "entrada").reduce((s, t) => s + Number(t.amount), 0);
  const prevSaidas = prevMonthTransactions.filter((t) => t.type === "saida").reduce((s, t) => s + Number(t.amount), 0);
  const prevSaldo = prevEntradas - prevSaidas;
  const balanceVariation = prevSaldo !== 0 ? ((saldo - prevSaldo) / Math.abs(prevSaldo)) * 100 : null;

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleEdit = (t: Transaction) => { setEditingTransaction(t); setDialogOpen(true); };
  const handleNew = () => { setEditingTransaction(null); setDialogOpen(true); };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0];
  const avatarUrl = profile?.avatar_url;
  const initials = (displayName || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-4 pb-20 pt-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <ProfileEditor>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/20" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-bold">
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs text-primary-foreground/70">{t("hello") as string},</p>
                <p className="text-sm font-semibold text-primary-foreground">{displayName}</p>
              </div>
            </button>
          </ProfileEditor>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Month dropdown */}
        <div className="mx-auto mt-4 max-w-lg flex items-center justify-center">
          <Select
            value={`${selectedMonth}-${selectedYear}`}
            onValueChange={(val) => {
              const [m, y] = val.split("-").map(Number);
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          >
            <SelectTrigger className="w-[200px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-sm font-semibold justify-center">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mx-auto mt-4 max-w-lg">
          <div className="flex items-center gap-2">
            <p className="text-xs text-primary-foreground/70">{t("monthBalance") as string}</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1 text-3xl font-bold text-primary-foreground tabular-nums">
            {showBalance ? formatCurrency(saldo) : "R$ ••••••"}
          </p>
          {showBalance && balanceVariation !== null && (
            <p className={`mt-1 text-xs font-semibold ${balanceVariation >= 0 ? "text-green-300" : "text-red-300"}`}>
              {balanceVariation >= 0 ? "↑" : "↓"} {Math.abs(balanceVariation).toFixed(1)}% {t("balanceVariation") as string}
            </p>
          )}
        </div>
      </header>

      {/* Summary cards */}
      <div className="mx-auto -mt-12 max-w-lg px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-lg border border-border/40 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("income") as string}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-primary tabular-nums">
              {showBalance ? formatCurrency(totalEntradas) : "••••"}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-lg border border-border/40 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("expenses") as string}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-destructive tabular-nums">
              {showBalance ? formatCurrency(totalSaidas) : "••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Financial alerts */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <FinancialAlerts
          transactions={transactions}
          categories={categories}
          totalEntradas={totalEntradas}
          totalSaidas={totalSaidas}
        />
      </div>

      {/* Tab bar */}
      <div className="mx-auto max-w-lg px-4 pt-5">
        <div className="flex gap-1 rounded-2xl bg-muted p-1">
          {([
            { key: "transactions" as TabType, label: t("transactions") as string },
            { key: "insights" as TabType, label: t("insights") as string },
            { key: "investments" as TabType, label: t("investments") as string },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                activeTab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 pt-4 pb-24">
        {activeTab === "transactions" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">{t("transactions") as string}</h2>
              <CategoryManager />
            </div>

            {/* Income vs Expense chart */}
            <IncomeExpenseChart
              totalEntradas={totalEntradas}
              totalSaidas={totalSaidas}
              showBalance={showBalance}
              formatCurrency={formatCurrency}
            />

            <div className="mb-4 flex gap-2">
              {([
                { key: "all" as FilterType, label: t("all") as string },
                { key: "entrada" as FilterType, label: t("incomeFilter") as string },
                { key: "saida" as FilterType, label: t("expenseFilter") as string },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    filter === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground self-center tabular-nums">
                {filteredTransactions.length} {t("records") as string}
              </span>
            </div>
            {loading ? (
              <TransactionListSkeleton />
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                categories={categories}
                onRefresh={fetchTransactions}
                onEdit={handleEdit}
                userName={displayName || undefined}
              />
            )}
          </>
        )}

        {activeTab === "insights" && (
          <div className="space-y-4">
            <InsightsSection
              transactions={transactions}
              categories={categories}
              showBalance={showBalance}
              formatCurrency={formatCurrency}
            />
            <UserSpendingChart
              transactions={transactions}
              showBalance={showBalance}
              formatCurrency={formatCurrency}
            />
          </div>
        )}

        {activeTab === "investments" && (
          <InvestmentSection showBalance={showBalance} formatCurrency={formatCurrency} />
        )}
      </main>

      {activeTab === "transactions" && (
        <button
          onClick={handleNew}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-110 hover:shadow-2xl active:scale-95"
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editingTransaction} onSuccess={fetchTransactions} />
    </div>
  );
};

export default Dashboard;

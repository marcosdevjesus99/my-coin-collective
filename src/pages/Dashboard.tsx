import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp, TrendingDown, Plus, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import TransactionDialog from "@/components/TransactionDialog";
import TransactionList from "@/components/TransactionList";
import CategoryManager, { useCategories } from "@/components/CategoryManager";
import ProfileEditor, { useProfile } from "@/components/ProfileEditor";
import type { Transaction } from "@/components/TransactionDialog";

type FilterType = "all" | "entrada" | "saida";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const { categories } = useCategories();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  // Period navigation
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  const endDate = selectedMonth === 11
    ? `${selectedYear + 1}-01-01`
    : `${selectedYear}-${String(selectedMonth + 2).padStart(2, "0")}-01`;

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions();

    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  const totalEntradas = transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalSaidas = transactions
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const saldo = totalEntradas - totalSaidas;

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0];
  const avatarUrl = profile?.avatar_url;
  const initials = (displayName || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <p className="text-xs text-primary-foreground/70">Olá,</p>
                <p className="text-sm font-semibold text-primary-foreground">{displayName}</p>
              </div>
            </button>
          </ProfileEditor>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Month Navigator */}
        <div className="mx-auto mt-4 max-w-lg flex items-center justify-center gap-4">
          <button onClick={goToPrevMonth} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-primary-foreground min-w-[140px] text-center">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button onClick={goToNextMonth} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="mx-auto mt-4 max-w-lg">
          <div className="flex items-center gap-2">
            <p className="text-xs text-primary-foreground/70">Saldo do mês</p>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors"
            >
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1 text-3xl font-bold text-primary-foreground tabular-nums">
            {showBalance ? formatCurrency(saldo) : "R$ ••••••"}
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <div className="mx-auto -mt-12 max-w-lg px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-4 shadow-lg border border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Entradas</span>
            </div>
            <p className="mt-2 text-lg font-bold text-primary tabular-nums">
              {showBalance ? formatCurrency(totalEntradas) : "••••"}
            </p>
          </div>
          <div className="rounded-xl bg-card p-4 shadow-lg border border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Saídas</span>
            </div>
            <p className="mt-2 text-lg font-bold text-destructive tabular-nums">
              {showBalance ? formatCurrency(totalSaidas) : "••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Movimentações</h2>
          <CategoryManager />
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          {([
            { key: "all", label: "Todas" },
            { key: "entrada", label: "Entradas" },
            { key: "saida", label: "Saídas" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                filter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">
            {filteredTransactions.length} registros
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            onRefresh={fetchTransactions}
            onEdit={handleEdit}
          />
        )}
      </main>

      {/* FAB */}
      <button
        onClick={handleNew}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30 transition-transform hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};

export default Dashboard;

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, TrendingUp, TrendingDown, Wallet, Plus, Eye, EyeOff } from "lucide-react";
import TransactionDialog from "@/components/TransactionDialog";
import TransactionList from "@/components/TransactionList";
import type { Transaction } from "@/components/TransactionDialog";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary px-4 pb-20 pt-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/70">Olá,</p>
              <p className="text-sm font-semibold text-primary-foreground">
                {user?.user_metadata?.name || user?.email?.split("@")[0]}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Balance */}
        <div className="mx-auto mt-6 max-w-lg">
          <div className="flex items-center gap-2">
            <p className="text-xs text-primary-foreground/70">Saldo total</p>
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

      {/* Summary cards floating over header */}
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
          <span className="text-xs text-muted-foreground">{transactions.length} registros</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
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

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, ArrowDownRight, Pencil, RotateCcw, CreditCard, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/components/TransactionDialog";
import type { Category } from "@/components/CategoryManager";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList = ({ transactions, categories, onRefresh, onEdit }: TransactionListProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transação excluída" });
      onRefresh();
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name || null;
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium">Nenhuma transação</p>
        <p className="text-xs">Toque no botão + para adicionar</p>
      </div>
    );
  }

  // Group by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5 pb-24">
      {Object.entries(grouped).map(([date, items]) => {
        const dayTotal = items.reduce(
          (sum, t) => sum + (t.type === "entrada" ? Number(t.amount) : -Number(t.amount)),
          0
        );
        return (
          <div key={date}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {formatDate(date)}
              </span>
              <span
                className={`text-xs font-semibold ${
                  dayTotal >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {dayTotal >= 0 ? "+" : ""}
                {formatCurrency(dayTotal)}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map((t) => {
                const catName = getCategoryName(t.category_id);
                return (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md border border-border/40"
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        t.type === "entrada"
                          ? "bg-primary/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      {t.type === "entrada" ? (
                        <ArrowUpRight className="h-5 w-5 text-primary" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.description || (t.type === "entrada" ? "Entrada" : "Saída")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {catName && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" /> {catName}
                          </span>
                        )}
                        {t.is_fixed && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <RotateCcw className="h-2.5 w-2.5" /> Fixa
                          </span>
                        )}
                        {t.is_installment && t.installment_current && t.installment_total && (
                          <span className="text-[10px] text-muted-foreground">
                            {t.installment_current}/{t.installment_total}x
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          t.type === "entrada" ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {t.type === "entrada" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                      </p>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(t)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;

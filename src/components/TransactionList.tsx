import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, ArrowDownRight, Pencil, RotateCcw, Tag, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Transaction } from "@/components/TransactionDialog";
import type { Category } from "@/components/CategoryManager";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
  userName?: string;
}

const TransactionList = ({ transactions, categories, onRefresh, onEdit, userName }: TransactionListProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();

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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <ArrowDownRight className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium">{t("noTransactions") as string}</p>
        <p className="text-xs">{t("addHint") as string}</p>
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
          <div key={date} className="animate-fade-in">
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
            <div className="space-y-2">
              {items.map((t) => {
                const catName = getCategoryName(t.category_id);
                return (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] border border-border/40"
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
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
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t.description || (t.type === "entrada" ? "Entrada" : "Saída")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {userName && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <User className="h-2.5 w-2.5" /> {userName}
                          </span>
                        )}
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
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
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
                      <div className="flex opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-muted"
                          onClick={() => onEdit(t)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
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

export const TransactionListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    ))}
  </div>
);

export default TransactionList;

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  description: string | null;
  date: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
}

const TransactionList = ({ transactions, onDelete }: TransactionListProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      onDelete();
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");

  if (transactions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhuma transação encontrada</p>
          <p className="text-xs">Adicione sua primeira transação acima</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <Card key={t.id} className="border-border/50 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  t.type === "entrada" ? "bg-accent" : "bg-destructive/10"
                }`}
              >
                {t.type === "entrada" ? (
                  <ArrowUpRight className="h-5 w-5 text-accent-foreground" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t.description || (t.type === "entrada" ? "Entrada" : "Saída")}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p
                className={`text-sm font-semibold ${
                  t.type === "entrada" ? "text-accent-foreground" : "text-destructive"
                }`}
              >
                {t.type === "entrada" ? "+" : "-"} {formatCurrency(Number(t.amount))}
              </p>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransactionList;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/components/CategoryManager";

export interface Transaction {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  description: string | null;
  category_id: string | null;
  date: string;
  is_fixed: boolean;
  is_installment: boolean;
  installment_total: number | null;
  installment_current: number | null;
  created_at: string;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
}

const TransactionDialog = ({ open, onOpenChange, transaction, onSuccess }: TransactionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const [type, setType] = useState<"entrada" | "saida">("saida");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isFixed, setIsFixed] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentTotal, setInstallmentTotal] = useState("");
  const [installmentCurrent, setInstallmentCurrent] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDescription(transaction.description || "");
      setCategoryId(transaction.category_id || "");
      setDate(transaction.date);
      setIsFixed(transaction.is_fixed);
      setIsInstallment(transaction.is_installment);
      setInstallmentTotal(String(transaction.installment_total || ""));
      setInstallmentCurrent(String(transaction.installment_current || ""));
    } else {
      setType("saida");
      setAmount("");
      setDescription("");
      setCategoryId("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsFixed(false);
      setIsInstallment(false);
      setInstallmentTotal("");
      setInstallmentCurrent("");
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      type,
      amount: parseFloat(amount),
      description: description || null,
      category_id: categoryId || null,
      date,
      user_id: user.id,
      is_fixed: isFixed,
      is_installment: isInstallment,
      installment_total: isInstallment ? parseInt(installmentTotal) || 0 : 0,
      installment_current: isInstallment ? parseInt(installmentCurrent) || 0 : 0,
    };

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("transactions").insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEditing ? "Transação atualizada!" : "Transação adicionada!" });
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere os dados da transação" : "Registre uma entrada ou saída"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("entrada")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                type === "entrada"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span className="text-lg">↑</span> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("saida")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                type === "saida"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-card text-muted-foreground hover:border-destructive/30"
              }`}
            >
              <span className="text-lg">↓</span> Saída
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel, Mercado..."
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="rounded border-border"
              />
              Fixa / Recorrente
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="rounded border-border"
              />
              Parcelada
            </label>
          </div>

          {isInstallment && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Parcela atual</Label>
                <Input
                  type="number"
                  min="1"
                  value={installmentCurrent}
                  onChange={(e) => setInstallmentCurrent(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={installmentTotal}
                  onChange={(e) => setInstallmentTotal(e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base font-semibold"
          >
            {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;

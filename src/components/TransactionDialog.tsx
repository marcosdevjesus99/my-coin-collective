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
import { useGroupMembers } from "@/hooks/useGroupMembers";

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
  user_id?: string;
  created_at: string;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
}

// How many months to project FIXED recurring transactions into the future
const FIXED_MONTHS_AHEAD = 12;

const TransactionDialog = ({ open, onOpenChange, transaction, onSuccess }: TransactionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const { members } = useGroupMembers();

  const [type, setType] = useState<"entrada" | "saida">("saida");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isFixed, setIsFixed] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentTotal, setInstallmentTotal] = useState("");
  const [installmentCurrent, setInstallmentCurrent] = useState("");
  const [responsibleId, setResponsibleId] = useState<string>("");
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
      setResponsibleId(transaction.user_id || user?.id || "");
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
      setResponsibleId(user?.id || "");
    }
  }, [transaction, open, user]);

  const buildFixedSeries = (basePayload: Record<string, unknown>, baseDate: string) => {
    const base = new Date(baseDate + "T12:00:00");
    const entries: Record<string, unknown>[] = [];
    for (let i = 0; i < FIXED_MONTHS_AHEAD; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      // Clamp day to 28 to avoid month overflow (Feb, etc.)
      const day = Math.min(base.getDate(), 28);
      d.setDate(day);
      entries.push({
        ...basePayload,
        date: d.toISOString().split("T")[0],
        is_fixed: true,
        is_installment: false,
        installment_total: 0,
        installment_current: 0,
      });
    }
    return entries;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const ownerId = responsibleId || user.id;

    const basePayload = {
      type,
      amount: parseFloat(amount),
      description: description || null,
      category_id: categoryId || null,
      date,
      user_id: ownerId,
      is_fixed: isFixed,
      is_installment: isInstallment,
      installment_total: isInstallment ? parseInt(installmentTotal) || 0 : 0,
      installment_current: isInstallment ? parseInt(installmentCurrent) || 0 : 0,
    };

    let error: { message: string } | null = null;
    let createdCount = 0;

    if (isEditing && transaction) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update(basePayload)
        .eq("id", transaction.id);
      error = updateError;
    } else if (isFixed) {
      // FIXED RECURRING: create N months ahead
      const series = buildFixedSeries(basePayload, date);
      const { error: insertError } = await supabase.from("transactions").insert(series);
      error = insertError;
      createdCount = series.length;
    } else if (isInstallment && parseInt(installmentTotal) > 1) {
      // INSTALLMENT: create N parcelas
      const total = parseInt(installmentTotal);
      const baseDate = new Date(date + "T12:00:00");
      const installments = [];
      for (let i = 0; i < total; i++) {
        const installDate = new Date(baseDate);
        installDate.setMonth(installDate.getMonth() + i);
        installments.push({
          ...basePayload,
          date: installDate.toISOString().split("T")[0],
          installment_current: i + 1,
          installment_total: total,
        });
      }
      const { error: insertError } = await supabase.from("transactions").insert(installments);
      error = insertError;
      createdCount = installments.length;
    } else {
      const { error: insertError } = await supabase.from("transactions").insert(basePayload);
      error = insertError;
      createdCount = 1;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: isEditing ? "Transação atualizada!" : "Transação adicionada!",
        description: !isEditing && createdCount > 1
          ? isFixed
            ? `${createdCount} meses agendados automaticamente`
            : `${createdCount} parcelas criadas automaticamente`
          : undefined,
      });
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              maxLength={120}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsible */}
          {members.length > 1 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Responsável</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Quem fez o lançamento" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.name || "Usuário"}{m.user_id === user?.id ? " (você)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                onChange={(e) => {
                  setIsFixed(e.target.checked);
                  if (e.target.checked) setIsInstallment(false);
                }}
                className="rounded border-border"
              />
              Fixa / Recorrente
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => {
                  setIsInstallment(e.target.checked);
                  if (e.target.checked) setIsFixed(false);
                }}
                className="rounded border-border"
              />
              Parcelada
            </label>
          </div>

          {isFixed && !isEditing && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              💡 Será criada automaticamente nos próximos {FIXED_MONTHS_AHEAD} meses.
            </p>
          )}

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

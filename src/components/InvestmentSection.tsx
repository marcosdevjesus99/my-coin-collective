import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp } from "lucide-react";

interface Investment {
  id: string;
  name: string;
  amount: number;
  date: string;
  notes: string | null;
}

interface Props {
  showBalance: boolean;
  formatCurrency: (v: number) => string;
}

const InvestmentSection = ({ showBalance, formatCurrency }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("investments")
      .select("*")
      .order("date", { ascending: false });
    if (data) setInvestments(data as Investment[]);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const total = investments.reduce((s, i) => s + Number(i.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("investments").insert({
      name,
      amount: parseFloat(amount),
      date,
      notes: notes || null,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("investmentAdded") as string });
      setDialogOpen(false);
      setName("");
      setAmount("");
      setNotes("");
      fetch();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    toast({ title: t("investmentDeleted") as string });
    fetch();
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Total card */}
      <div className="rounded-xl bg-card p-4 shadow-lg border border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">{t("totalInvested") as string}</span>
        </div>
        <p className="mt-2 text-lg font-bold text-primary tabular-nums">
          {showBalance ? formatCurrency(total) : "••••"}
        </p>
      </div>

      {/* List */}
      {investments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t("noInvestments") as string}</p>
      ) : (
        <div className="space-y-2">
          {investments.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl bg-card p-3 border border-border/40 transition-all hover:shadow-md"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{inv.name}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
                {inv.notes && <p className="text-xs text-muted-foreground mt-0.5">{inv.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary tabular-nums">
                  {showBalance ? formatCurrency(Number(inv.amount)) : "••••"}
                </span>
                <button
                  onClick={() => handleDelete(inv.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> {t("newInvestment") as string}
      </Button>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newInvestment") as string}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("investmentName") as string}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("investmentNamePlaceholder") as string} required />
            </div>
            <div className="space-y-2">
              <Label>{t("amount") as string}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("date") as string}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("notes") as string}</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (t("saving") as string) : (t("save") as string)}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestmentSection;

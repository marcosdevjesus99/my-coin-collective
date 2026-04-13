import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Check, X, Tag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

const DEFAULT_CATEGORIES = ["Lazer", "Mercado", "Gás", "Transporte"];

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data as Category[]);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { categories, refetch: fetch };
};

const CategoryManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories, refetch } = useCategories();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const seedDefaults = async () => {
    if (!user) return;
    setLoading(true);
    const inserts = DEFAULT_CATEGORIES.map((name) => ({ name, user_id: user.id }));
    const { error } = await supabase.from("categories").insert(inserts);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categorias padrão criadas!" });
      refetch();
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !newName.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), user_id: user.id });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      refetch();
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editName.trim() }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setEditingId(null);
      refetch();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Tag className="h-3.5 w-3.5" /> Categorias
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Categorias</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova categoria..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="icon" onClick={handleAdd} disabled={loading || !newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Nenhuma categoria criada</p>
              <Button variant="outline" size="sm" onClick={seedDefaults} disabled={loading}>
                Criar categorias padrão
              </Button>
            </div>
          )}

          {/* List */}
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                {editingId === cat.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdate(cat.id)}>
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryManager;

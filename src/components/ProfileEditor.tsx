import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data as Profile);
        });

    load();

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return profile;
};

interface ProfileEditorProps {
  children: React.ReactNode;
}

const ProfileEditor = ({ children }: ProfileEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const profile = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Tamanho máximo: 5MB.", variant: "destructive" });
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast({ title: "Erro ao enviar imagem", description: uploadError.message, variant: "destructive" });
      return null;
    }

    // Try to remove previous avatar (best-effort)
    if (profile?.avatar_url) {
      const previousPath = profile.avatar_url.split("/avatars/")[1];
      if (previousPath && previousPath !== filePath) {
        await supabase.storage.from("avatars").remove([previousPath]).catch(() => {});
      }
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let finalAvatarUrl = avatarUrl;
    if (pendingFile) {
      const uploaded = await uploadAvatar(pendingFile);
      if (!uploaded) {
        setLoading(false);
        return;
      }
      finalAvatarUrl = uploaded;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        avatar_url: finalAvatarUrl.trim() || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
      setAvatarUrl(finalAvatarUrl);
      setPendingFile(null);
      setPreviewUrl(null);
      setOpen(false);
    }
    setLoading(false);
  };

  const initials = (name || user?.email || "U").slice(0, 2).toUpperCase();
  const displayedAvatar = previewUrl || avatarUrl;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Meu Perfil</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Avatar with upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              disabled={loading}
            >
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary/20 transition-opacity group-hover:opacity-80"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold transition-opacity group-hover:opacity-80">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg ring-2 ring-background">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">Toque na foto para trocar</p>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={80} />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileEditor;

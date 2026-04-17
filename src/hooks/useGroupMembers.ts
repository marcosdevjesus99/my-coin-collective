import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GroupMemberProfile {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Returns all profiles visible to the current user:
 * - the user's own profile
 * - profiles of users who share at least one group with the current user
 *
 * Falls back to just the current user's profile when no group is shared.
 */
export const useGroupMembers = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url");

      if (!cancelled) {
        if (!error && data) {
          setMembers(data as GroupMemberProfile[]);
        } else {
          setMembers([]);
        }
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`profiles-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getName = (userId: string | null | undefined) => {
    if (!userId) return null;
    const m = members.find((m) => m.user_id === userId);
    return m?.name || null;
  };

  return { members, loading, getName };
};

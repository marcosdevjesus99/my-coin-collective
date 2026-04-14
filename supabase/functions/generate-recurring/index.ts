import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get current month start
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthStart = `${currentMonth}-01`;

  // Find all fixed transactions from last month that don't have a copy this month yet
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthStart = `${lastMonthStr}-01`;
  const lastMonthEnd = currentMonthStart;

  // Get fixed transactions from last month
  const { data: fixedTransactions, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("is_fixed", true)
    .gte("date", lastMonthStart)
    .lt("date", lastMonthEnd);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!fixedTransactions || fixedTransactions.length === 0) {
    return new Response(JSON.stringify({ message: "No fixed transactions to replicate", created: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check which ones already have a copy this month
  const userIds = [...new Set(fixedTransactions.map((t) => t.user_id))];
  const { data: existingThisMonth } = await supabase
    .from("transactions")
    .select("user_id, description, amount, type")
    .eq("is_fixed", true)
    .gte("date", currentMonthStart)
    .lt("date", `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`)
    .in("user_id", userIds);

  const existingKey = (t: { user_id: string; description: string | null; amount: number; type: string }) =>
    `${t.user_id}|${t.description}|${t.amount}|${t.type}`;

  const existingSet = new Set((existingThisMonth || []).map(existingKey));

  // Create new entries for current month
  const newTransactions = fixedTransactions
    .filter((t) => !existingSet.has(existingKey(t)))
    .map((t) => {
      const originalDay = new Date(t.date).getDate();
      const newDate = new Date(now.getFullYear(), now.getMonth(), Math.min(originalDay, 28));
      return {
        type: t.type,
        amount: t.amount,
        description: t.description,
        category_id: t.category_id,
        date: newDate.toISOString().split("T")[0],
        user_id: t.user_id,
        group_id: t.group_id,
        is_fixed: true,
        is_installment: false,
        installment_total: 0,
        installment_current: 0,
      };
    });

  if (newTransactions.length === 0) {
    return new Response(JSON.stringify({ message: "All fixed transactions already exist this month", created: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase.from("transactions").insert(newTransactions);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Recurring transactions generated", created: newTransactions.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

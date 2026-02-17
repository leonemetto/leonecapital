import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { conversation } = await req.json();
    if (!Array.isArray(conversation) || conversation.length < 2) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Take last 4 messages for context
    const recentMsgs = conversation.slice(-4);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Ask AI to extract a behavioral insight
    const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `You are a trading psychology analyst. Given a conversation between a trader and their AI coach, extract ONE key behavioral insight about this trader in 10 words or less. Focus on patterns like: emotional triggers, rule violations, strengths, recurring mistakes, or psychological tendencies. Return ONLY the insight text, nothing else. If the conversation is just a greeting or has no tradable insight, return exactly "NONE".`,
          },
          {
            role: "user",
            content: `Conversation:\n${recentMsgs.map((m: any) => `${m.role}: ${m.content}`).join("\n")}`,
          },
        ],
      }),
    });

    if (!extractResp.ok) {
      console.error("Extract insight error:", extractResp.status);
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractData = await extractResp.json();
    const insightText = extractData.choices?.[0]?.message?.content?.trim();

    if (!insightText || insightText === "NONE" || insightText.length > 100) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current behavioral_memory
    const { data: profile } = await supabase
      .from("trader_profiles")
      .select("behavioral_memory")
      .eq("user_id", userId)
      .maybeSingle();

    const currentMemory = Array.isArray(profile?.behavioral_memory) ? profile.behavioral_memory : [];
    const newEntry = { insight: insightText, date: new Date().toISOString().split("T")[0] };

    // Keep last 20 insights
    const updatedMemory = [...currentMemory, newEntry].slice(-20);

    if (profile) {
      await supabase
        .from("trader_profiles")
        .update({ behavioral_memory: updatedMemory })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("trader_profiles")
        .insert({ user_id: userId, behavioral_memory: updatedMemory });
    }

    return new Response(JSON.stringify({ insight: insightText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

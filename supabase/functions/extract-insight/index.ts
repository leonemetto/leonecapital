import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user from JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const conversation = body.conversation;
    if (!Array.isArray(conversation) || conversation.length < 2) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Take last 4 messages for context
    const recent = conversation.slice(-4);
    const convoText = recent.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "Extract exactly ONE key behavioral trading insight from this conversation. The insight must be 10 words or less. Focus on patterns like: emotional triggers, rule violations, risk management habits, session preferences, or recurring mistakes. Return ONLY the insight text, nothing else. If no clear insight exists, return 'No clear insight'." }] },
          contents: [{ role: "user", parts: [{ text: convoText }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      console.error("Insight extraction failed:", response.status);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!insight || insight === "No clear insight" || insight.length > 100) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current behavioral_memory
    const { data: profile } = await supabase
      .from("trader_profiles")
      .select("behavioral_memory")
      .eq("user_id", user.id)
      .single();

    const currentMemory = Array.isArray(profile?.behavioral_memory)
      ? profile.behavioral_memory
      : [];

    // Append new insight, keep last 20
    const newMemory = [
      ...currentMemory,
      { insight, timestamp: new Date().toISOString() },
    ].slice(-20);

    // Upsert
    const { error: upsertError } = await supabase
      .from("trader_profiles")
      .upsert(
        { user_id: user.id, behavioral_memory: newMemory },
        { onConflict: "user_id" }
      );

    if (upsertError) console.error("Upsert error:", upsertError);

    return new Response(
      JSON.stringify({ ok: true, insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

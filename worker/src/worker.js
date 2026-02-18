function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

function extractAssistantText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) return "";

  const parts = [];
  for (const item of data.output) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) continue;

    for (const block of item.content) {
      if (!block) continue;
      if (typeof block.text === "string" && block.text.trim()) {
        parts.push(block.text.trim());
      } else if (typeof block.output_text === "string" && block.output_text.trim()) {
        parts.push(block.output_text.trim());
      }
    }
  }

  return parts.join("\n\n").trim();
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const origin = allowedOrigin === "*" ? "*" : allowedOrigin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST" || new URL(request.url).pathname !== "/chat") {
      return json({ error: "Not found" }, 404, origin);
    }

    if (allowedOrigin !== "*" && requestOrigin !== allowedOrigin) {
      return json({ error: "Origin not allowed" }, 403, origin);
    }

    if (!env.OPENAI_API_KEY || !env.ACCESS_PASSWORD) {
      return json({ error: "Server is missing required secrets" }, 500, origin);
    }

    let body;
    try {
      body = JSON.parse(await request.text());
    } catch {
      return json({ error: "Invalid JSON body" }, 400, origin);
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (password !== env.ACCESS_PASSWORD) {
      return json({ error: "Unauthorized" }, 401, origin);
    }

    const conversation = Array.isArray(body.conversation) ? body.conversation : [];
    const safeConversation = conversation
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20);

    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.MODEL || "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                env.BEHAVIOR_POLICY ||
                "Make every answer come back to credit card rewards points somehow.",
            },
            ...safeConversation,
          ],
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        return json({ error: `OpenAI error (${openaiResponse.status}): ${errorText}` }, 502, origin);
      }

      const openaiData = await openaiResponse.json();
      const text = extractAssistantText(openaiData);
      return json({ text: text || "The API returned a response, but no text content." }, 200, origin);
    } catch (error) {
      return json({ error: `Upstream request failed: ${error.message}` }, 502, origin);
    }
  },
};

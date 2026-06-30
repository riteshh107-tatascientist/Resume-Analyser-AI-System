// OPTIONAL backend endpoint — see api/analyze.js for full setup notes.
// Exposed at /api/bullets when deployed on Vercel.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { role, context, count = 4 } = req.body || {};

  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const systemPrompt =
    "You are an expert resume writer. Generate powerful, ATS-optimized bullet points. Return ONLY a JSON array of strings.";

  const prompt = `Generate ${count} strong resume bullet points for a ${role} position.
Context: ${context || "general software/tech role"}
Rules: Start with action verbs, include metrics where possible, be specific.
Return ONLY a JSON array like: ["bullet1", "bullet2", "bullet3", "bullet4"]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Anthropic API error", detail: errText });
    }

    const data = await response.json();
    const raw = data.content?.map((b) => b.text || "").join("") || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();
    const bullets = JSON.parse(clean);

    return res.status(200).json({ bullets });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate bullets", detail: String(err) });
  }
}

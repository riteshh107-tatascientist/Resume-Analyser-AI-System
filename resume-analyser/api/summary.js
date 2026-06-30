// OPTIONAL backend endpoint — see api/analyze.js for full setup notes.
// Exposed at /api/summary when deployed on Vercel.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data } = req.body || {};

  if (!data) {
    return res.status(400).json({ error: "data is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const systemPrompt =
    "You are an expert resume writer. Generate a powerful professional summary. Return ONLY the summary text, 2-3 sentences, no labels.";

  const prompt = `Write a professional ATS-optimized summary for:
Name: ${data.name}
Experience: ${data.experience?.map((e) => `${e.role} at ${e.company}`).join(", ")}
Skills: ${data.skills?.technical}
Education: ${data.education?.map((e) => `${e.degree} from ${e.institution}`).join(", ")}`;

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
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Anthropic API error", detail: errText });
    }

    const result = await response.json();
    const summary = result.content?.map((b) => b.text || "").join("") || "";

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate summary", detail: String(err) });
  }
}

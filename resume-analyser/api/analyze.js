// OPTIONAL backend endpoint for Vercel Serverless Functions.
//
// Deploy this alongside your frontend and Vercel will automatically expose
// it at /api/analyze. Set ANTHROPIC_API_KEY in your Vercel project's
// Environment Variables (Settings → Environment Variables) — NEVER put it
// in frontend code or commit it to git.
//
// Then set VITE_API_BASE_URL to your deployed domain (or leave it empty if
// the frontend and this API are on the SAME Vercel project/domain — in that
// case requests to "/api/analyze" already resolve correctly with no env var
// needed).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobDescription } = req.body || {};

  if (!resumeText) {
    return res.status(400).json({ error: "resumeText is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const systemPrompt =
    "You are an expert ATS resume analyzer and career coach. Analyze resumes thoroughly and return ONLY valid JSON, no markdown, no preamble.";

  const prompt = `Analyze this resume${jobDescription ? " against the job description" : ""} and return a JSON object with exactly this structure:
{
  "atsScore": <number 0-100>,
  "metrics": { "grammar": <0-100>, "formatting": <0-100>, "keywords": <0-100>, "readability": <0-100>, "experience": <0-100>, "impact": <0-100> },
  "suggestions": [ { "type": "critical|warning|tip", "title": "...", "detail": "..." } ],
  "skillsFound": ["skill1","skill2"],
  "skillsMissing": ["skill3","skill4"],
  "skillsPartial": ["skill5"],
  "matchScore": <number if JD provided, else null>,
  "strengths": ["..."],
  "summary": "2-sentence overall assessment"
}

Resume:
${String(resumeText).slice(0, 2000)}
${jobDescription ? `\nJob Description:\n${String(jobDescription).slice(0, 800)}` : ""}`;

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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Anthropic API error", detail: errText });
    }

    const data = await response.json();
    const raw = data.content?.map((b) => b.text || "").join("") || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Failed to analyze resume", detail: String(err) });
  }
}

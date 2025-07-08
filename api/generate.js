export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { nationality, purpose, salary } = req.body;

  if (!nationality || !purpose || !salary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = `
You are a trusted Singapore immigration advisor.
Input:
- Nationality: ${nationality}
- Purpose: ${purpose}
- Monthly salary (SGD): ${salary}

Output JSON with keys:
{
  "visa_type": "",
  "required_documents": [],
  "tax_summary": "",
  "estimated_first_year_costs": {
    "rent_sgd": 0,
    "utilities_sgd": 0,
    "other_sgd": 0
  }
}
Only return valid JSON.
`.trim();

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You output only JSON – no explanation." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected OpenAI response:", JSON.stringify(data));
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    let json;
    try {
      json = JSON.parse(data.choices[0].message.content);
    } catch (parseErr) {
      console.error("JSON parsing failed:", parseErr);
      console.error("Raw content:", data.choices[0].message.content);
      return res.status(500).json({ error: "Failed to parse OpenAI JSON output" });
    }

    res.status(200).json(json);
  } catch (err) {
    console.error("OpenAI call failed:", err);
    res.status(500).json({ error: "Checklist generation failed" });
  }
}

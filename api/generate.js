export default async function handler(req, res) {
  const { nationality, purpose, salary } = req.body;

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
    const json = JSON.parse(data.choices[0].message.content);
    res.status(200).json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checklist generation failed." });
  }
}

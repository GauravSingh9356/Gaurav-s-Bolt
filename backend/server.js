import express from "express";
import cors from "cors";
import  { exec } from 'child_process';
import  fs from 'fs';
import  path from 'path';
import fetch from "node-fetch";
import { configDotenv } from "dotenv";

const app = express();
app.use(express.json());
app.use(cors());
app.use(configDotenv)

// ✅ Replace with your Netlify SITE_ID
const NETLIFY_SITE_ID = "<Add_Your_Netflify_Project_Id/>"

app.post("/generate-site", async (req, res) => {
  const { prompt } = req.body;

  const systemPrompt =
   `
      You are an elite web code architect specializing in cutting-edge, premium digital experiences. You craft visually stunning, ultra-modern websites that push the boundaries of web design with sophisticated aesthetics, seamless animations, and flawless performance.
      Create websites that feel like premium SaaS products - polished, sophisticated, and engaging. Every element should feel intentional and contribute to an cohesive, professional experience. Make full websites with multiple sections, navigation, and interactive elements.
      Add your own creative content based to fill based on the user's prompt.
      Return ONLY valid JSON with keys: "html", "css", and "js". Do not add any explanations or extraneous text.
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const json = JSON.parse(content);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: "Invalid LLM output", raw: content });
  }
});



app.post("/deploy", async (req, res) => {
  try {
    const files = req.body;

    // Create a temporary directory to store the files
    const tempDir = path.join("./", 'temp-site');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Write the files from the request body to the temp directory
    for (const [filename, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(tempDir, filename), content);
    }

    // Run the Netlify CLI deploy command and get the output
   const command = `netlify deploy --prod --dir=${tempDir} --site=${NETLIFY_SITE_ID}`;

    exec(command, (error, stdout, stderr) => {
      // Clean up the temporary directory after deployment
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (error) {
        console.error(`Deployment failed: ${error}`);
        return res.status(500).json({ error: "Deployment failed", details: stderr });
      }

      // Regex to find the deploy URL in the command output
      const urlRegex = /https:\/\/[^\s]+\.netlify\.app/;
      const deployUrl = stdout.match(urlRegex);

      if (deployUrl && deployUrl[0]) {
        res.json({
          message: "Deployment successful!",
          url: deployUrl[0]
        });
      } else {
        res.status(500).json({
          error: "Deployment successful, but URL not found in output."
        });
      }
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


app.listen(4000, () => console.log("Backend running on http://localhost:4000"));

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
let lastRequestTime = 0;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeMCQ") {
    handleMCQAnalysis(request.text, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Handle MCQ analysis
async function handleMCQAnalysis(text, sendResponse) {
  try {
    const apiKey = await new Promise((resolve) => {
      chrome.storage.local.get(["apiKey"], (result) => resolve(result.apiKey));
    });

    if (!apiKey) {
      throw new Error("Please set your OpenRouter API key first!");
    }

    // Rate limiting (1 request per second)
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      throw new Error("Please wait 1 second between requests.");
    }
    lastRequestTime = now;

    const answer = await getAnswerFromDeepSeek(text, apiKey);
    sendResponse({ answer });
  } catch (error) {
    console.error("Error:", error);
    sendResponse({ error: error.message });
  }
}

// Fetch answer from DeepSeek-R1 via OpenRouter
async function getAnswerFromDeepSeek(text, apiKey) {
  const prompt = `Analyze this multiple-choice question and return ONLY THE CORRECT ANSWER TEXT from the options. Do not include option letters (A/B/C/D).

Question with Options:
${text}

Correct Answer:`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://yourdomain.com", // Replace with your domain
      "X-Title": "MCQ Solver",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat", // Correct model ID
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
    }),
  });

  const data = await response.json();

  // Handle API errors
  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  // Validate response structure
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenRouter");
  }

  // Clean the answer text
  const rawAnswer = data.choices[0].message.content;
  const cleanAnswer = rawAnswer
    .replace(/^(Option [A-D]:?)/i, '') // Remove option references
    .replace(/^[A-D][).]\s*/, '') // Remove leading letters
    .trim();

  return cleanAnswer || "Could not determine answer";
}
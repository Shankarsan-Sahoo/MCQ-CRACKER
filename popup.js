document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveKey");
  const status = document.getElementById("status");

  // Load saved API key
  chrome.storage.local.get(["apiKey"], (result) => {
    apiKeyInput.value = result.apiKey || "";
  });

  // Save API key
  saveButton.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key.startsWith("sk-or-")) {
      status.textContent = "Invalid OpenRouter API key format!";
      status.style.color = "#ff4444";
      return;
    }

    chrome.storage.local.set({ apiKey: key }, () => {
      status.textContent = "API key saved successfully!";
      status.style.color = "#4CAF50";
      setTimeout(() => (status.textContent = ""), 2000);
    });
  });
});
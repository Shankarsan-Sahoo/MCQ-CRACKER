let lastSelection = "";
let answerPopup = null;

// Listen for text selection
document.addEventListener("mouseup", async (e) => {
  const selection = window.getSelection().toString().trim();

  if (selection && selection !== lastSelection) {
    lastSelection = selection;
    showLoader(e.clientX, e.clientY);

    try {
      const { answer, error } = await chrome.runtime.sendMessage({
        action: "analyzeMCQ",
        text: selection,
      });

      if (error) {
        showError(`API Error: ${error}`);
      } else if (!answer) {
        showError("Could not determine the correct answer");
      } else {
        showAnswer(answer, e.clientX, e.clientY);
      }
    } catch (error) {
      showError(error.message);
    }
  }
});

// Show loading indicator
function showLoader(x, y) {
  if (answerPopup) answerPopup.remove();

  answerPopup = document.createElement("div");
  answerPopup.style = `
    position: fixed;
    left: ${x + 15}px;
    top: ${y}px;
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 999999;
    min-width: 200px;
  `;
  answerPopup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div class="loader"></div>
      <span>Analyzing question...</span>
    </div>
    <style>
      .loader {
        border: 3px solid #f3f3f3;
        border-radius: 50%;
        border-top: 3px solid #4CAF50;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(answerPopup);
}

// Show answer
function showAnswer(answer, x, y) {
  answerPopup.innerHTML = `
    <div style="color: #4CAF50; font-weight: 500; font-size: 16px;">
      <div style="margin-bottom: 8px;">Correct Answer:</div>
      <div style="background: #4CAF50; color: white; padding: 12px; border-radius: 6px;">
        ${answer}
      </div>
      <div style="color: #666; font-size: 12px; margin-top: 8px;">
        Highlight another question to analyze
      </div>
    </div>
  `;
}

// Show error message
function showError(message) {
  answerPopup.innerHTML = `
    <div style="color: #ff4444; font-size: 14px;">
      ${message}
    </div>
  `;
  setTimeout(() => answerPopup.remove(), 3000);
}
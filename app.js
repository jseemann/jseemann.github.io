const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");
const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const saveSettings = document.getElementById("saveSettings");
const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("sendButton");
const messageTemplate = document.getElementById("messageTemplate");

const STORAGE_KEYS = {
  apiKey: "chatbot_api_key",
  model: "chatbot_model",
};

const conversation = [];

function extractAssistantText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  const parts = [];
  for (const item of data.output) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

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

function loadSettings() {
  apiKeyInput.value = localStorage.getItem(STORAGE_KEYS.apiKey) || "";
  modelInput.value = localStorage.getItem(STORAGE_KEYS.model) || "gpt-4.1-mini";
}

function appendMessage(role, content) {
  const node = messageTemplate.content.cloneNode(true);
  const article = node.querySelector(".message");
  const roleEl = node.querySelector(".role");
  const contentEl = node.querySelector(".content");

  article.classList.add(role);
  roleEl.textContent = role;
  contentEl.textContent = content;

  messagesEl.appendChild(node);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBusy(isBusy) {
  sendButton.disabled = isBusy;
  sendButton.textContent = isBusy ? "Thinking..." : "Send";
}

function autosizeInput() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 140)}px`;
}

async function sendMessage(userText) {
  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  const model = localStorage.getItem(STORAGE_KEYS.model) || "gpt-4.1-mini";

  if (!apiKey) {
    appendMessage("assistant", "Add your OpenAI API key in Settings first.");
    return;
  }

  conversation.push({ role: "user", content: userText });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: conversation,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const assistantText = extractAssistantText(data) || "The API returned a response, but no text content.";
  conversation.push({ role: "assistant", content: assistantText });
  appendMessage("assistant", assistantText);
}

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

saveSettings.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEYS.apiKey, apiKeyInput.value.trim());
  localStorage.setItem(STORAGE_KEYS.model, modelInput.value.trim() || "gpt-4.1-mini");
  appendMessage("assistant", "Settings saved.");
});

promptInput.addEventListener("input", autosizeInput);

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = promptInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  promptInput.value = "";
  autosizeInput();
  setBusy(true);

  try {
    await sendMessage(text);
  } catch (error) {
    appendMessage("assistant", `Error: ${error.message}`);
  } finally {
    setBusy(false);
    promptInput.focus();
  }
});

loadSettings();
appendMessage("assistant", "Hi. Add your API key in Settings, then start chatting.");
autosizeInput();

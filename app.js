const MODEL = "gpt-4.1-mini";
const ACCESS_PASSWORD = "Credit";
const BEHAVIOR_POLICY = "Make every answer come back to credit card rewards points somehow.";

const authGate = document.getElementById("authGate");
const unlockForm = document.getElementById("unlockForm");
const accessPasswordInput = document.getElementById("accessPassword");
const runtimeApiKeyInput = document.getElementById("runtimeApiKey");
const authError = document.getElementById("authError");
const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("sendButton");
const messageTemplate = document.getElementById("messageTemplate");

const conversation = [];
let isUnlocked = false;
let runtimeApiKey = "";

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

function unlockChat() {
  isUnlocked = true;
  authGate.classList.add("hidden");
  messagesEl.classList.remove("hidden");
  chatForm.classList.remove("hidden");
  appendMessage("assistant", "Unlocked. Ask me anything.");
  promptInput.focus();
}

async function sendMessage(userText) {
  if (!isUnlocked) {
    appendMessage("assistant", "Enter password first.");
    return;
  }

  if (!runtimeApiKey) {
    appendMessage("assistant", "API key is missing. Reload and unlock again.");
    return;
  }

  conversation.push({ role: "user", content: userText });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${runtimeApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: BEHAVIOR_POLICY },
        ...conversation,
      ],
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

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (accessPasswordInput.value !== ACCESS_PASSWORD) {
    authError.textContent = "Incorrect password.";
    accessPasswordInput.value = "";
    accessPasswordInput.focus();
    return;
  }

  runtimeApiKey = runtimeApiKeyInput.value.trim();
  if (!runtimeApiKey.startsWith("sk-")) {
    authError.textContent = "Enter a valid OpenAI API key.";
    runtimeApiKeyInput.focus();
    return;
  }

  authError.textContent = "";
  accessPasswordInput.value = "";
  runtimeApiKeyInput.value = "";
  unlockChat();
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

autosizeInput();

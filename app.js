const CHAT_ENDPOINT = "https://REPLACE_WITH_YOUR_WORKER.workers.dev/chat";

const authGate = document.getElementById("authGate");
const unlockForm = document.getElementById("unlockForm");
const accessPasswordInput = document.getElementById("accessPassword");
const authError = document.getElementById("authError");
const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("sendButton");
const messageTemplate = document.getElementById("messageTemplate");

const conversation = [];
let isUnlocked = false;
let accessPassword = "";

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

  conversation.push({ role: "user", content: userText });

  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-chat-password": accessPassword,
    },
    body: JSON.stringify({
      conversation,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error("Incorrect password.");
    }
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const assistantText = data.text || "The API returned a response, but no text content.";
  conversation.push({ role: "assistant", content: assistantText });
  appendMessage("assistant", assistantText);
}

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!accessPasswordInput.value.trim()) return;

  accessPassword = accessPasswordInput.value.trim();
  authError.textContent = "";
  accessPasswordInput.value = "";
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

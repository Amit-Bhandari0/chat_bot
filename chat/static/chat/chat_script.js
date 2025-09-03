const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const userMenuBtn = document.getElementById("user-menu-btn");
const userMenu = document.getElementById("user-menu");
const settingsMenuBtn = document.getElementById("settings-menu-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const deleteAccountOption = document.getElementById("delete-account");
const deleteAccountModal = document.getElementById("delete-account-modal");
const closeDeleteModalBtn = document.getElementById("close-delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const themeLightOption = document.getElementById("theme-light");
const themeDarkOption = document.getElementById("theme-dark");
const chatHistoryBtn = document.getElementById("chat-history-btn");
const chatHistoryModal = document.getElementById("chat-history-modal");
const closeChatHistoryBtn = document.getElementById("close-chat-history");
const chatHistoryContent = document.getElementById("chat-history-content");

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken =
  getCookie("csrf_token") ||
  document.querySelector('meta[name="csrf-token"]')?.content;

function formatBotResponse(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  text = text.replace(/^\s*•\s+(.*$)/gim, "<li>$1</li>");
  text = text.replace(/^\s*\*\s+(.*$)/gim, "<li>$1</li>");
  if (text.includes("<li>")) {
    text = text.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
  }
  text = text.replace(/\n/g, "<br>");
  return text;
}

document.addEventListener("DOMContentLoaded", function () {
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (userMenu && !userMenu.contains(e.target) && e.target !== userMenuBtn) {
      userMenu.classList.remove("active");
    }
  });

  if (userMenu) {
    userMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  if (settingsMenuBtn && settingsModal) {
    settingsMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userMenu) userMenu.classList.remove("active");
      settingsModal.classList.add("active");
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () =>
      settingsModal.classList.remove("active")
    );
  }

  if (deleteAccountOption && deleteAccountModal) {
    deleteAccountOption.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.remove("active");
      deleteAccountModal.classList.add("active");
    });
  }

  if (closeDeleteModalBtn && deleteAccountModal) {
    closeDeleteModalBtn.addEventListener("click", () =>
      deleteAccountModal.classList.remove("active")
    );
  }

  if (cancelDeleteBtn && deleteAccountModal) {
    cancelDeleteBtn.addEventListener("click", () =>
      deleteAccountModal.classList.remove("active")
    );
  }

  if (confirmDeleteBtn && deleteAccountModal) {
    confirmDeleteBtn.addEventListener("click", () => deleteAccount());
  }

  if (themeLightOption) {
    themeLightOption.addEventListener("click", () => {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    });
  }

  if (themeDarkOption) {
    themeDarkOption.addEventListener("click", () => {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
  }

  if (chatHistoryBtn && chatHistoryModal) {
    chatHistoryBtn.addEventListener("click", () => {
      if (userMenu) userMenu.classList.remove("active");
      loadChatHistoryModal();
      chatHistoryModal.classList.add("active");
    });
  }

  if (closeChatHistoryBtn && chatHistoryModal) {
    closeChatHistoryBtn.addEventListener("click", () =>
      chatHistoryModal.classList.remove("active")
    );
  }

  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) settingsModal.classList.remove("active");
    });
  }

  if (deleteAccountModal) {
    deleteAccountModal.addEventListener("click", (e) => {
      if (e.target === deleteAccountModal)
        deleteAccountModal.classList.remove("active");
    });
  }

  if (chatHistoryModal) {
    chatHistoryModal.addEventListener("click", (e) => {
      if (e.target === chatHistoryModal)
        chatHistoryModal.classList.remove("active");
    });
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
});

function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) {
    showNotification("Please enter a message", "error");
    return;
  }

  appendMessage("user", msg);
  userInput.value = "";
  appendTyping();

  fetch("/api/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({ message: msg }),
  })
    .then((response) => response.json())
    .then((data) => {
      removeTyping();
      if (data.success) {
        appendMessage("bot", data.response, true);
      } else {
        appendMessage(
          "bot",
          "Sorry, I'm having trouble responding right now. Please try again."
        );
        console.error("API Error:", data.error);
      }
    })
    .catch((err) => {
      removeTyping();
      appendMessage(
        "bot",
        "Sorry, I'm having trouble connecting to the server. Please try again."
      );
      console.error("Fetch Error:", err);
    });
}

function appendMessage(sender, msg, isFormatted = false) {
  const el = document.createElement("div");
  el.classList.add("message", sender);

  if (sender === "bot" && isFormatted) {
    el.innerHTML = formatBotResponse(msg);
  } else {
    el.textContent = msg;
  }

  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendTyping() {
  const typingEl = document.createElement("div");
  typingEl.id = "typing";
  typingEl.classList.add("typing");
  typingEl.innerHTML =
    "ChatBot is typing<span></span><span></span><span></span>";
  chatBox.appendChild(typingEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typingEl = document.getElementById("typing");
  if (typingEl) typingEl.remove();
}

function loadChatHistoryModal() {
  chatHistoryContent.innerHTML = '<div class="loading-spinner"></div>';

  fetch("/chat-history/", {
    method: "GET",
    headers: {
      "X-CSRFToken": csrftoken,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        if (data.history.length > 0) {
          let html = "";
          data.history.forEach((msg) => {
            html += `
              <div class="history-message">
                <div class="history-user">You: ${msg.message}</div>
                <div class="history-bot">Bot: ${formatBotResponse(
                  msg.response
                )}</div>
                <div class="history-time">${msg.timestamp}</div>
              </div>`;
          });
          chatHistoryContent.innerHTML = html;
        } else {
          chatHistoryContent.innerHTML =
            '<div class="no-history">No chat history found. Start a conversation to see it here!</div>';
        }
      } else {
        chatHistoryContent.innerHTML =
          '<div class="error">Failed to load chat history.</div>';
      }
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
      chatHistoryContent.innerHTML =
        '<div class="error">Failed to load chat history.</div>';
    });
}

function deleteAccount() {
  showNotification("Deleting your account...", "info");

  fetch("/delete-account/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrftoken,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        showNotification("Account deleted successfully", "success");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showNotification(data.error || "Failed to delete account", "error");
      }
    })
    .catch((err) => {
      console.error(err);
      showNotification(
        "An error occurred while deleting the account",
        "error"
      );
    });

  if (deleteAccountModal) deleteAccountModal.classList.remove("active");
}

function showNotification(message, type = "info") {
  let notificationEl = document.getElementById("notification");
  if (!notificationEl) {
    notificationEl = document.createElement("div");
    notificationEl.id = "notification";
    notificationEl.style.position = "fixed";
    notificationEl.style.top = "20px";
    notificationEl.style.right = "20px";
    notificationEl.style.padding = "12px 16px";
    notificationEl.style.borderRadius = "8px";
    notificationEl.style.zIndex = "3000";
    notificationEl.style.maxWidth = "300px";
    notificationEl.style.transition = "all 0.3s ease";
    document.body.appendChild(notificationEl);
  }

  notificationEl.textContent = message;
  notificationEl.className = "";

  switch (type) {
    case "success":
      notificationEl.style.backgroundColor = "#d1fae5";
      notificationEl.style.color = "#065f46";
      notificationEl.style.border = "1px solid #a7f3d0";
      break;
    case "error":
      notificationEl.style.backgroundColor = "#fee2e2";
      notificationEl.style.color = "#dc2626";
      notificationEl.style.border = "1px solid #fecaca";
      break;
    case "info":
    default:
      notificationEl.style.backgroundColor = "#dbeafe";
      notificationEl.style.color = "#1e40af";
      notificationEl.style.border = "1px solid #bfdbfe";
      break;
  }

  notificationEl.style.display = "block";
  notificationEl.style.opacity = "1";
  notificationEl.style.transform = "translateY(0)";

  setTimeout(() => {
    notificationEl.style.opacity = "0";
    notificationEl.style.transform = "translateY(-20px)";
    setTimeout(() => {
      notificationEl.style.display = "none";
    }, 300);
  }, 5000);
}

window.addEventListener("load", function () {
  setTimeout(function () {
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, 100);
});
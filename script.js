const API_KEY = "AIzaSyDWbADTIgi8o6jRVcnvBcbZWNcebzU3nfY"; // <<< REMEMBER TO REPLACE THIS WITH YOUR ACTUAL GEMINI API KEY
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const textInput = document.getElementById("text-input");
const themeToggle = document.getElementById("theme-toggle");
const headerElement = document.querySelector(".header");

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
});

async function sendMessage() {
    const userMessage = textInput.value.trim();
    if (!userMessage) return;

    appendMessage("user", userMessage);

    if (headerElement) {
        headerElement.style.display = "none";
    }

    textInput.value = "";

    const loadingMessageId = showLoadingEffect();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userMessage }] }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API error:", errorData.error.message);
            throw new Error(errorData.error.message || "Unknown API error occurred.");
        }

        const result = await response.json();
        const geminiResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";

        updateMessageContent(loadingMessageId, "Gemini-msg", geminiResponse);

    } catch (error) {
        console.error("Error during API fetch:", error);
        updateMessageContent(loadingMessageId, "Gemini-msg error", "🤖 Apologies, something went wrong. Please try again.");
    } finally {
        scrollToChatBottom();
    }
}

function appendMessage(sender, text) {
    const msgElement = document.createElement("div");
    msgElement.className = `message ${sender}`;
    msgElement.innerHTML = formatMessageContent(sender, text);
    chatArea.appendChild(msgElement);
    hljs.highlightAll(); // Re-highlight content, especially if code blocks are present
    scrollToChatBottom();
}

function showLoadingEffect() {
    const msgElement = document.createElement("div");
    msgElement.className = "message loading";
    const uniqueId = `loading-${Date.now()}`;
    msgElement.id = uniqueId;

    const p = document.createElement("p");
    p.innerText = "Loading...";
    msgElement.appendChild(p);

    chatArea.appendChild(msgElement);
    scrollToChatBottom();
    return uniqueId;
}

function updateMessageContent(messageId, newClassName, newText) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.innerHTML = formatMessageContent("Gemini", newText);
        messageElement.className = `message ${newClassName}`;
        messageElement.removeAttribute("id"); // Remove the ID once content is updated
        hljs.highlightAll(); // Re-highlight content, especially if code blocks are present
        scrollToChatBottom();
    }
}

function formatCodeBlocks(text) {
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang = '', code) => {
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="code-container">
        <div class="code-header">
          <span class="code-lang">${lang || 'code'}</span>
          <button class="copy-btn" onclick="copyCode(this)"><i class="far fa-copy"></i></button>
        </div>
        <pre><code class="language-${lang}">${safeCode}</code></pre>
      </div>
    `;
  });
}

function formatMessageContent(sender, text) {
    const emoji = sender === "user" ? "🧑‍💻" : "🤖";
    let formattedText = text;

    // Process Code Blocks first to avoid markdown within code being processed
    formattedText = formatCodeBlocks(formattedText);

    // Replace newline characters with <br> for HTML line breaks, but exclude inside <pre> tags
    formattedText = formattedText.replace(/(?<!<pre[^>]*?>.*?)\n(?!.*?<\/pre>)/gs, '<br>');

    // Basic Markdown formatting
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');     // Italic
    formattedText = formattedText.replace(/_([^_]+)_/g, '<u>$1</u>');     // Underline

    // Basic list formatting (simple conversion, not a full markdown parser)
    // For numbered lists
    formattedText = formattedText.replace(/<br>(\d+\.\s(.+))/g, '<br><p>$1</p>');
    // For bulleted lists (* or -)
    formattedText = formattedText.replace(/<br>([\*\-]\s(.+))/g, '<br><p>$1</p>');

    // Handle lists that appear at the very beginning of the message (no leading <br>)
    formattedText = formattedText.replace(/^(\d+\.\s(.+))/g, '<p>$1</p>');
    formattedText = formattedText.replace(/^([\*\-]\s(.+))/g, '<p>$1</p>');

    return `${emoji} ${formattedText}`;
}

function copyCode(button) {
  const codeElement = button.closest('.code-container').querySelector('code');
  if (codeElement) {
    const codeText = codeElement.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      button.innerHTML = '<i class="fas fa-check"></i>'; // Change icon to checkmark
      setTimeout(() => {
        button.innerHTML = '<i class="far fa-copy"></i>'; // Revert to copy icon
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text:', err);
      // Handle error, maybe revert icon immediately or show an error state
      button.innerHTML = '<i class="far fa-copy"></i>';
    });
  }
}

function scrollToChatBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀️";
    }
});
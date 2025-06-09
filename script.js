// IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Gemini API key.
// Securely storing API keys is crucial for production. For a simple demo, it's here.
const API_KEY = "AIzaSyDWbADTIgi8o6jRVcnvBcbZWNcebzU3nfY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const textInput = document.getElementById("text-input");
const themeToggle = document.getElementById("theme-toggle");
const headerElement = document.querySelector(".header"); // Cache the header element

// --- Event Listeners ---

// Listen for form submission (Enter key or send button click)
chatForm.addEventListener("submit", (event) => {
  API_URL
    event.preventDefault(); // Prevent default browser form submission
    sendMessage();
});

// --- Core Chat Functions ---

// Handles sending the message to Gemini API
async function sendMessage() {
    const userMessage = textInput.value.trim();
    if (!userMessage) return; // Do not send empty messages

    // Append user's message to the chat display
    appendMessage("user", userMessage);

    // Hide the initial header after the first message is sent
    if (headerElement) {
        headerElement.style.display = "none";
    }

    // Clear input field immediately
    textInput.value = "";

    // Show loading indicator
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
            // If response is not OK (e.g., 4xx or 5xx status)
            const errorData = await response.json();
            // Log the detailed API error for debugging
            console.error("Gemini API error:", errorData.error.message);
            throw new Error(errorData.error.message || "Unknown API error occurred.");
        }

        const result = await response.json();
        const geminiResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";

        // Update the loading message with Gemini's actual response
        updateMessageContent(loadingMessageId, "Gemini-msg", geminiResponse);

    } catch (error) {
        console.error("Error during API fetch:", error);
        // Update loading message to an error state
        updateMessageContent(loadingMessageId, "Gemini-msg error", "🤖 Apologies, something went wrong. Please try again.");
    } finally {
        // Ensure chat area scrolls to the bottom after any message (success or error)
        scrollToChatBottom();
    }
}

// Appends a new message bubble to the chat area
function appendMessage(sender, text) {
    const msgElement = document.createElement("div");
    msgElement.className = `message ${sender}`;
    msgElement.innerHTML = formatMessageContent(sender, text);
    chatArea.appendChild(msgElement);
    // Apply syntax highlighting to any new code blocks
    hljs.highlightAll();
    // Scroll to the bottom to show the new message
    scrollToChatBottom();
}

// Displays a "Loading..." message and returns its unique ID
function showLoadingEffect() {
    const msgElement = document.createElement("div");
    msgElement.className = "message loading";
    const uniqueId = `loading-${Date.now()}`; // Unique ID for tracking
    msgElement.id = uniqueId;

    const p = document.createElement("p");
    p.innerText = "Loading...";
    msgElement.appendChild(p);

    chatArea.appendChild(msgElement);
    scrollToChatBottom(); // Scroll immediately to show loading
    return uniqueId;
}

// Updates an existing message (e.g., loading message) with final content
function updateMessageContent(messageId, newClassName, newText) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.innerHTML = formatMessageContent("Gemini", newText); // Always format as Gemini response
        messageElement.className = `message ${newClassName}`; // Apply new class (e.g., Gemini-msg, Gemini-msg error)
        messageElement.removeAttribute("id"); // Remove the temporary ID
        hljs.highlightAll(); // Re-apply highlighting in case new code was added
        scrollToChatBottom(); // Scroll to bottom after content update
    }
}

// Formats message text to include emojis, basic markdown, and code blocks
function formatMessageContent(sender, text) {
    const emoji = sender === "user" ? "🧑‍💻" : "🤖";
    // Regex for code blocks (supports optional language: ```lang\ncode``` or ```\ncode```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let formattedText = text;

    // 1. Basic Markdown formatting (order matters for nesting/precedence)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold: **text**
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic: *text*
    formattedText = formattedText.replace(/_([^_]+)_/g, '<u>$1</u>'); // Underline: _text_

    // 2. Line breaks: Replace \n with <br> for HTML rendering. Must be before list formatting.
    // Use a regex that doesn't replace newlines within code blocks or pre-formatted text.
    // This is a common challenge with simple markdown parsers. For now, it replaces all.
    // For a more robust solution, you'd parse code blocks *first*, remove them,
    // then apply text formatting, then re-insert code blocks.
    formattedText = formattedText.replace(/\n/g, '<br>');

    // 3. Basic list formatting (will wrap lines starting with list markers in <p>)
    // This is a simple approach and might not create true `<ul>` or `<ol>` structures.
    // For full markdown lists, a dedicated markdown parser library would be needed.
    // Ensure the <br> is optional before list items as line breaks are replaced globally above.
    formattedText = formattedText.replace(/^(<br>)?(\d+\.\s.*)$/gm, (match, br, content) => `<p>${content}</p>`); // Numbered: 1. Item
    formattedText = formattedText.replace(/^(<br>)?([\*\-]\s.*)$/gm, (match, br, content) => `<p>${content}</p>`); // Bulleted: * Item or - Item


    // 4. Code block replacement (must be after other formatting to avoid conflicts)
    formattedText = formattedText.replace(codeBlockRegex, (match, lang = "plaintext", code) => {
        // HTML-encode the code to prevent browser misinterpretation
        const safeCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `
            <div class="code-container">
                <pre class="code-block">
                    <div class="code-buttons">
                        <i class="fas fa-copy" onclick="copyCode(this)"></i>
                    </div>
                    <code class="language-${lang}">${safeCode}</code>
                </pre>
            </div>`;
    });

    return `${emoji} ${formattedText}`;
}

// --- Utility Functions ---

// Scrolls the chat area to the very bottom
function scrollToChatBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Toggles between light and dark themes
function toggleTheme() {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    // Persist theme choice
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

// Copies code from a code block to the clipboard
function copyCode(icon) {
    // Traverse up to find the pre.code-block and get its text content
    const codeElement = icon.closest(".code-block").querySelector("code");
    if (codeElement) {
        const codeText = codeElement.innerText.trim();
        navigator.clipboard.writeText(codeText).then(() => {
            icon.classList.replace("fa-copy", "fa-check"); // Show checkmark
            setTimeout(() => icon.classList.replace("fa-check", "fa-copy"), 1000); // Revert after 1 second
        }).catch(err => {
            console.error('Failed to copy text:', err);
            // Optionally, provide user feedback for copy failure
        });
    }
}

// --- Initialization ---

// Set initial theme based on local storage or default
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀️";
    }
    // The header is hidden upon the first message. If you want it to hide
    // on page load without a message, you'd add:
    // if (chatArea.children.length > 0) { // Check if there are already messages
    //   headerElement.style.display = "none";
    // }
});
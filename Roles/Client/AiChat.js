document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesArea = document.getElementById('messages-area');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');

            window.location.href = '/LoginPage/Login.html';
        });
    }

    const API_BASE_URL = 'https://localhost:7020/api/v1.0/AiChat';
    let currentSessionId = null;


    // --- Authentication & Authorization ---
    if (!token || !user || (userRole !== 'Client' && userRole !== 'Lawyer')) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    // --- UI Setup ---
    function loadSidebar() {
        const isClient = userRole === 'Client';
        const dashboardLink = isClient ? '/Roles/Client/Client.html' : '/Dashboard/Lawyer.html';
        const casesLink = isClient ? '/Roles/Client/ClientCases.html' : '/Roles/Lawyer/LawyerCases.html';
        const chatLink = '/Roles/Shared/Chat.html';
        const profileLink = isClient ? '/Roles/Client/Profile.html' : '#';

        const nav = sidebar.querySelector('nav');
        nav.innerHTML = `
            <a href="${dashboardLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                Dashboard
            </a>
            <a href="${casesLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                My Cases
            </a>
            <a href="${chatLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
              <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Chat
            </a>
            <a href="/Roles/Shared/AiChat.html" class="flex items-center px-6 py-3 text-gray-700 bg-gray-200 font-semibold">
              <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI Assistant
            </a>
             <a href="${profileLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Profile
            </a>
        `;
    }

    function appendMessage(text, sender) {
        const messageElement = document.createElement('div');
        const isUser = sender === 'user';

        let bubbleClasses = 'p-3 rounded-lg shadow-sm max-w-md ';
        let wrapperClasses = 'flex w-full mt-2 space-x-3';
        let avatarHtml = '';

        if (isUser) {
            bubbleClasses += 'bg-[var(--js-primary)] text-white rounded-br-none';
            wrapperClasses += ' ml-auto justify-end';
        } else {
            bubbleClasses += 'bg-white text-gray-800 rounded-bl-none';
            avatarHtml = '<div><img src="Aiavatar.jpg" class="w-8 h-8 rounded-full object-cover flex-shrink-0"></div>';
        }

        messageElement.className = wrapperClasses;
        messageElement.innerHTML = `
            ${avatarHtml}
            <div class="flex-1">
                <div class="${bubbleClasses}">
                    <p class="text-sm">${text}</p>
                </div>
            </div>
        `;
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'flex w-full mt-2 space-x-3 max-w-md';
        typingElement.innerHTML = `
            <div><img src="../../assets/ai-avatar.png" class="w-8 h-8 rounded-full object-cover flex-shrink-0"></div>
            <div class="flex-1"> 
                <div class="bg-white text-gray-500 p-3 rounded-r-lg rounded-bl-lg shadow-sm">
                    <p class="text-sm italic">AI is typing...</p>
                </div>
            </div>
        `;
        messagesArea.appendChild(typingElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        
        if (!userMessage || !currentSessionId) return;
        
        appendMessage(userMessage, 'user');
        messageInput.value = '';
        messageInput.disabled = true;
        
        showTypingIndicator();
        
        try {
            // Send user message to the backend
            await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    AIConversationSessionId: currentSessionId,
                    Sender: 0, // 0 for User
                    Message: userMessage
                })
            });

            // Simulate AI response (in a real scenario, this might be a webhook or another call)
            // For now, we'll just get a simulated response from a placeholder endpoint or logic
            // This part will need to be replaced with your actual AI service call
            const aiResponse = `This is a simulated response regarding: "${userMessage}". In a real application, I would connect to a powerful language model to provide a detailed and accurate answer.`;
            
            removeTypingIndicator();
            appendMessage(aiResponse, 'ai');

        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            appendMessage('Sorry, I couldn\'t send your message. Please try again.', 'ai');
        } finally {
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    // --- Initialization ---
    async function initializePage() {
        loadSidebar();
        await getOrCreateSession();
    }

    async function getOrCreateSession() {
        try {
            // 1. Check for an existing session for the user
            const response = await fetch(`${API_BASE_URL}/sessions/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch sessions.');

            const result = await response.json();
            let session = result.data && result.data.length > 0 ? result.data[0] : null; // Get the most recent session

            // 2. If no session exists, create one
            if (!session) {
                const createResponse = await fetch(`${API_BASE_URL}/sessions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ UserId: user.id })
                });
                if (!createResponse.ok) throw new Error('Failed to create a new session.');
                const createResult = await createResponse.json();
                session = createResult.data;
            }

            if (session && session.id) {
                currentSessionId = session.id;
                loadMessageHistory(session.messages || []);
            } else {
                throw new Error('Could not establish a chat session.');
            }

        } catch (error) {
            console.error('Session initialization failed:', error);
            messagesArea.innerHTML += `<div class="text-center text-red-500 p-4">Could not load chat. Please refresh the page.</div>`;
        }
    }

    function loadMessageHistory(messages) {
        if (!messages || messages.length === 0) return;

        messages.forEach(msg => {
            const sender = msg.sender === 0 ? 'user' : 'ai';
            appendMessage(msg.message, sender);
        });
    }

    messageForm.addEventListener('submit', handleFormSubmit);

    initializePage();
});
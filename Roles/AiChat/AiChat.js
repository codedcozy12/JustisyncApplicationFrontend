
    
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatHistoryList = document.getElementById('chat-history-list');
        const newChatBtn = document.getElementById('new-chat-btn');
    const messagesArea = document.getElementById('messages-area');


    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');

            window.location.href = '/LoginPage/Login.html';
        });
    }

    const API_BASE_URL = 'https://localhost:7020/api/v1.0/AiConversations';
    let activeSessionId = null;


    if (!token || !user || (userRole !== 'Client' && userRole !== 'Lawyer')) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    function loadSidebar() {
        const isClient = userRole === 'Client';
        const dashboardLink = isClient ? '/Roles/Client/Client.html' : '/Roles/Lawyer/Lawyer.html';

        const nav = sidebar.querySelector('nav');
        nav.innerHTML = `
            <a href="${dashboardLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                Back to Dashboard
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
            <div><img src="Aiavatar.jpg" class="w-8 h-8 rounded-full object-cover flex-shrink-0"></div>
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
        
        if (!userMessage) return;

        if (!activeSessionId) {
            const newSession = await createNewSession();
            if (!newSession) {
                appendMessage("Sorry, I couldn't start a new chat session. Please try again.", 'ai');
                return;
            }
            activeSessionId = newSession.id;
            await loadChatHistory();
            document.querySelector(`[data-session-id="${activeSessionId}"]`)?.classList.add('bg-gray-200');
        }
        
        appendMessage(userMessage, 'user');
        messageInput.value = '';
        messageInput.disabled = true;
        const sendButton = messageForm.querySelector('button[type="submit"]');
        if(sendButton) sendButton.disabled = true;
        
        showTypingIndicator();
        
        try {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    AIConversationSessionId: activeSessionId,
                    Sender: 0,
                    Message: userMessage
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(errorData.message || 'Failed to get a response from the AI.');
            }

            const result = await response.json();
            const aiResponse = result.data;
            
            removeTypingIndicator();

            if (aiResponse && aiResponse.message) {
                appendMessage(aiResponse.message, 'ai');
                const chatItem = document.querySelector(`[data-session-id="${activeSessionId}"] .chat-title`);
                if (chatItem && chatItem.textContent.startsWith("New Chat")) {
                    await loadChatHistory();
                }
            } else {
                throw new Error("Received an invalid response from the AI.");
            }

        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            appendMessage(`Sorry, an error occurred: ${error.message}`, 'ai');
        } finally {
            messageInput.disabled = false;
            if(sendButton) sendButton.disabled = false;
            messageInput.focus();
        }
    }

    async function initializePage() {
        loadSidebar();
        await loadChatHistory();
        selectFirstOrWelcome();
    }

    function displayWelcomeMessage() {
        const welcomeMessage = `
            <div class="flex w-full mt-2 space-x-3 max-w-md">
                <div><img src="Aiavatar.jpg" class="w-8 h-8 rounded-full object-cover flex-shrink-0"></div>
                <div class="flex-1">
                    <div class="bg-white text-gray-800 p-3 rounded-r-lg rounded-bl-lg shadow-sm">
                        <p class="text-sm">Hello! I am the JustiSync AI Legal Assistant. How can I help you today?</p>
                    </div>
                </div>
            </div>`;
        messagesArea.innerHTML = welcomeMessage;
    }

    async function selectFirstOrWelcome() {
        const firstChat = chatHistoryList.querySelector('.chat-history-item');
        if (firstChat) {
            firstChat.click();
        } else {
            displayWelcomeMessage();
        }
    }

    async function createNewSession() {
        try {
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
            return createResult.data;
        } catch (error) {
            console.error('Failed to create session:', error);
            return null;
        }
    }

    async function loadChatHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch sessions.');

            const result = await response.json();
            let session = result.data && result.data.length > 0 ? result.data[0] : null; // Get the most recent session
            const sessions = result.data || [];

            chatHistoryList.innerHTML = '';
            sessions.forEach(session => {
                const item = document.createElement('div');
                item.dataset.sessionId = session.id;
                item.className = 'chat-history-item text-sm p-2 rounded-md cursor-pointer hover:bg-gray-200 truncate';
                item.innerHTML = `<span class="chat-title">${session.title || 'New Chat'}</span>`;
                item.addEventListener('click', () => selectChatSession(session.id));
                item.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showDeleteConfirmation(session.id, session.title || 'New Chat');
                });
                chatHistoryList.appendChild(item);
            });

        } catch (error) {
            console.error('Chat history loading failed:', error);
            chatHistoryList.innerHTML = `<div class="p-2 text-xs text-red-500">Could not load history.</div>`;
        }
    }

    async function selectChatSession(sessionId) {
        messagesArea.innerHTML = '';
        displayWelcomeMessage();

        try {
            const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load chat messages.');
            const result = await response.json();
            if (result.data && result.data.messages) {
                document.querySelectorAll('.chat-history-item').forEach(el => el.classList.remove('bg-gray-200'));
                document.querySelector(`[data-session-id="${sessionId}"]`)?.classList.add('bg-gray-200');

                activeSessionId = sessionId;
                renderMessageHistory(result.data.messages);
            }
        } catch (error) {
            console.error('Error fetching session details:', error);
            appendMessage('Could not load messages for this chat.', 'ai');
        }
    }

    function renderMessageHistory(messages) {
        if (!messages || messages.length === 0) return;

        messages.forEach(msg => {
            const sender = msg.sender === 0 ? 'user' : 'ai';
            appendMessage(msg.message, sender);
        });
    }

    async function showDeleteConfirmation(sessionId, sessionTitle) {
        const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the chat "${sessionTitle}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        });

        if (isConfirmed) {
            await deleteChatSession(sessionId);
        }
    }

    async function deleteChatSession(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(errorData.message || 'Failed to delete chat session.');
            }

            Swal.fire('Deleted!', 'Your chat session has been deleted.', 'success');

            const deletedItem = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (deletedItem) {
                deletedItem.remove();
            }

            if (activeSessionId === sessionId) {
                activeSessionId = null;
                messagesArea.innerHTML = '';
                displayWelcomeMessage();
                messageInput.focus();
            }
            selectFirstOrWelcome();

        } catch (error) {
            console.error('Error deleting session:', error);
            Swal.fire('Error!', `Failed to delete chat session: ${error.message}`, 'error');
        }
    }

    messageForm.addEventListener('submit', handleFormSubmit);

    initializePage();

    newChatBtn.addEventListener('click', async () => {
        activeSessionId = null;
        messagesArea.innerHTML = ''; 
        displayWelcomeMessage();
        document.querySelectorAll('.chat-history-item').forEach(el => el.classList.remove('bg-gray-200'));
        messageInput.focus();
    });
});

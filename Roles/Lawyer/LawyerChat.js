document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));
 
    const conversationsList = document.getElementById('conversations-list');
    const messagesArea = document.getElementById('messages-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = messageForm.querySelector('button[type="submit"]');
    const searchInput = document.getElementById('search-conversations');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    const noChatSelected = document.getElementById('no-chat-selected');
    const activeChatContainer = document.getElementById('active-chat-container');

    let activeConversationId = null;
    let activeRecipientId = null;
    let connection = null;
    let allConversations = [];

    if (!token || userRole !== 'Lawyer' || !currentUser) { // Corrected role check
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    initializeChatPage();

    if (backToDashboardBtn) { // Corrected dashboard link
        backToDashboardBtn.addEventListener('click', () => {
            window.location.href = '/Roles/Lawyer/Lawyer.html';
        });
    }

    function setupSignalR() {
        const hubUrl = "https://localhost:7020/chathub";

        connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", (message) => {
            console.log("Message received:", message);
            if (message.chatId === activeConversationId) {
                const isSender = message.senderId === currentUser.id;
                appendMessage(message, isSender);
            }
            updateConversationPreview(message.chatId, message.message, message.sentAt);
        });

        connection.on("LoadMessages", (messages) => {
            console.log("Loading message history:", messages);
            messagesArea.innerHTML = '';
            messages.forEach(msg => {
                const isSender = msg.senderId === currentUser.id;
                appendMessage(msg, isSender);
            });
        });

        connection.on("Error", (errorMessage) => {
            console.error("Hub Error:", errorMessage);
            Swal.fire('Chat Error', errorMessage, 'error');
        });

        connection.start()
            .then(() => {
                console.log("SignalR Connected.");
                if (activeConversationId) {
                    connection.invoke("JoinChat", activeConversationId).catch(err => console.error(err));
                }
            })
            .catch(err => console.error("SignalR Connection Error: ", err.toString()));
    }

    setupSignalR();

    async function initializeChatPage() {
        await fetchConversations();

        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get('chatId');

        if (urlChatId) {
            const conversationToSelect = allConversations.find(c => c.id === urlChatId);
            if (conversationToSelect) {
                selectConversation(conversationToSelect);
            } else {
                console.warn("Chat ID from URL not found in user's conversations.");
            }
        }
    }

    async function fetchConversations() {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Chats/user/${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch conversations.');
            
            const result = await response.json();
            if (result.isSuccess && result.data) {
                const conversationsWithDetails = await Promise.all(result.data.map(async (chat) => {
                    const partnerId = chat.initiatorId === currentUser.id ? chat.recipientId : chat.initiatorId;
                    const partnerDetails = await fetchUserDetails(partnerId);
                    return {
                        id: chat.id,
                        ...chat,
                        partnerName: partnerDetails ? `${partnerDetails.firstName} ${partnerDetails.lastName}` : 'Unknown User',
                        partnerAvatar: partnerDetails ? partnerDetails.profilePictureUrl : null,
                        lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : 'No messages yet.'
                    };
                }));
                allConversations = conversationsWithDetails;
                renderConversations(allConversations);
            } else {
                conversationsList.innerHTML = `<div class="p-4 text-center text-gray-500">${result.message || 'No conversations found.'}</div>`;
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            conversationsList.innerHTML = '<div class="p-4 text-center text-red-500">Error loading conversations.</div>';
        }
    }

    async function fetchUserDetails(userId) {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null;
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
        }
    }

    const getFullImageUrl = (url) => {
        const defaultAvatar = '../../assets/Avatar.png';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };

    function filterAndRenderConversations() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allConversations.filter(c => 
            c.partnerName.toLowerCase().includes(searchTerm)
        );
        renderConversations(filtered);
    }

    function renderConversations(conversations) {
        conversationsList.innerHTML = '';
        if (!conversations || conversations.length === 0) {
            conversationsList.innerHTML = '<div class="p-4 text-center text-gray-500">No conversations yet.</div>';
            return;
        }

        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = 'flex items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-200';
            convElement.dataset.conversationId = conv.id;
            convElement.innerHTML = `
                <img src="${getFullImageUrl(conv.partnerAvatar)}" class="w-12 h-12 rounded-full mr-3 object-cover">
                <div class="flex-1">
                    <div class="flex justify-between">
                        <h4 class="font-semibold text-sm">${conv.partnerName}</h4>
                        <p class="text-xs text-gray-500">${conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}</p>
                    </div>
                    <p class="text-sm text-gray-600 truncate">${conv.lastMessage}</p>
                </div>
            `;
            convElement.addEventListener('click', () => selectConversation(conv));
            conversationsList.appendChild(convElement);
        });
    }

    async function selectConversation(conversation) {
        document.querySelectorAll('#conversations-list > div').forEach(el => el.classList.remove('bg-gray-200'));
        document.querySelector(`[data-conversation-id="${conversation.id}"]`)?.classList.add('bg-gray-200');

        if (activeConversationId && connection.state === "Connected") {
            connection.invoke("LeaveChat", activeConversationId).catch(err => console.error(err));
        }
        activeConversationId = conversation.id;
        activeRecipientId = conversation.initiatorId === currentUser.id ? conversation.recipientId : conversation.initiatorId;

        noChatSelected.classList.add('hidden');
        activeChatContainer.classList.remove('hidden');
        activeChatContainer.classList.add('flex');
        sendButton.disabled = false;

        document.getElementById('chat-partner-name').textContent = conversation.partnerName;
        document.getElementById('chat-partner-avatar').src = getFullImageUrl(conversation.partnerAvatar);

        if (connection.state === "Connected") {
            await connection.invoke("JoinChat", conversation.id);
            await connection.invoke("MarkChatAsReadAsync", conversation.id, currentUser.id);
        }
    }

    function appendMessage(message, isSender) {
        const messageElement = document.createElement('div');
        messageElement.className = `flex mb-2 ${isSender ? 'justify-end' : 'justify-start'}`;
        
        const bubbleClasses = isSender 
            ? 'bg-[#dcf8c6] rounded-lg rounded-br-none'
            : 'bg-white rounded-lg rounded-bl-none';

        const readStatusIcon = isSender ? `<svg class="w-4 h-4 ml-1 ${message.isRead ? 'text-blue-500' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 7.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2z" clip-rule="evenodd"></path></svg>` : '';

        messageElement.innerHTML = `
            <div class="max-w-xs md:max-w-md">
                <div class="${bubbleClasses} p-2 px-3 shadow-sm">
                    <p class="text-sm text-gray-800">${message.message}</p>
                    <div class="flex items-center justify-end mt-1">
                        <p class="text-xs text-gray-400 mr-1">${new Date(message.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        ${readStatusIcon}
                    </div>
                </div>
            </div>
        `;
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function updateConversationPreview(chatId, lastMessage, lastMessageAt) {
        const convElement = document.querySelector(`[data-conversation-id="${chatId}"]`);
        if (convElement) {
            convElement.querySelector('.text-gray-600').textContent = lastMessage;
            convElement.querySelector('.text-xs.text-gray-500').textContent = new Date(lastMessageAt).toLocaleDateString();
     
            conversationsList.prepend(convElement);
        }
    }

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();

        if (messageText && activeConversationId && connection.state === "Connected") {
            const messageToSend = {
                ChatId: activeConversationId,
                SenderId: currentUser.id,
                ReceiverId: activeRecipientId,
                Message: messageText,
                MessageType: 0
            };

            try {
                await connection.invoke("SendMessage", messageToSend);
                messageInput.value = '';
            } catch (err) {
                console.error("Send message error:", err.toString());
                Swal.fire('Error', 'Could not send message. Please try again.', 'error');
            }
        }
    });

    searchInput.addEventListener('input', filterAndRenderConversations);
});
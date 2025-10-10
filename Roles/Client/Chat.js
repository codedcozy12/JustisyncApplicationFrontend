document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const sidebar = document.getElementById('sidebar');
    const conversationsList = document.getElementById('conversations-list');
    const messagesArea = document.getElementById('messages-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const searchInput = document.getElementById('search-conversations');
    const noChatSelected = document.getElementById('no-chat-selected');
    const activeChatContainer = document.getElementById('active-chat-container');

    let activeConversationId = null;
    let activeRecipientId = null;
    let connection = null;
    let allConversations = [];

    if (!token || !userRole || !currentUser) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    loadSidebar();
    fetchConversations();
    setupSignalR();

    function loadSidebar() {
        const isClient = userRole === 'Client';
        const dashboardLink = isClient ? '/Roles/Client/Client.html' : '/Dashboard/Lawyer.html';
        const casesLink = isClient ? '/Roles/Client/ClientCases.html' : '#';
        const findLawyerLink = isClient ? '/Roles/Client/FindLawyer.html' : '#';
        const profileLink = isClient ? '/Roles/Client/Profile.html' : '#';

        sidebar.innerHTML = `
            <div class="p-6 bg-[var(--js-primary)] text-white">
                <h1 class="text-2xl font-bold">⚖️ JustiSync</h1>
            </div>
            <nav class="mt-6">
                <a href="${dashboardLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                    <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    Dashboard
                </a>
                <a href="${casesLink}" class="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100">
                    <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    My Cases
                </a>
                <a href="/Roles/Shared/Chat.html" class="flex items-center px-6 py-3 text-gray-700 bg-gray-200 font-semibold">
                  <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  Chat
                </a>
            </nav>
        `;
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
                appendMessage(message, false);
            }
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
            })
            .catch(err => console.error("SignalR Connection Error: ", err.toString()));
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
                        ...chat,
                        partnerName: partnerDetails ? `${partnerDetails.firstName} ${partnerDetails.lastName}` : 'Unknown User',
                        partnerAvatar: partnerDetails ? partnerDetails.profilePictureUrl : null,
                        lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : 'No messages yet.',
                        unread: 0
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
        if (conversations.length === 0) {
            conversationsList.innerHTML = '<div class="p-4 text-center text-gray-500">No conversations yet.</div>';
            return;
        }

        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = 'flex items-center p-4 cursor-pointer hover:bg-gray-100 border-b';
            convElement.dataset.conversationId = conv.id;
            convElement.innerHTML = `
                <img src="${getFullImageUrl(conv.partnerAvatar)}" class="w-12 h-12 rounded-full mr-4 object-cover">
                <div class="flex-1">
                    <div class="flex justify-between">
                        <h4 class="font-semibold">${conv.partnerName}</h4>
                        ${conv.unread > 0 ? `<span class="bg-[var(--js-accent)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${conv.unread}</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-600 truncate">${conv.lastMessage}</p>
                </div>
            `;
            convElement.addEventListener('click', () => selectConversation(conv));
            conversationsList.appendChild(convElement);
        });
    }

    function selectConversation(conversation) {
        if (activeConversationId) {
            connection.invoke("LeaveChat", activeConversationId).catch(err => console.error(err));
        }
        activeConversationId = conversation.id;
        activeRecipientId = conversation.initiatorId === currentUser.id ? conversation.recipientId : conversation.initiatorId;

        noChatSelected.classList.add('hidden');
        activeChatContainer.classList.remove('hidden');
        activeChatContainer.classList.add('flex');

        document.getElementById('chat-partner-name').textContent = conversation.partnerName;
        document.getElementById('chat-partner-avatar').src = getFullImageUrl(conversation.partnerAvatar);
        connection.invoke("JoinChat", conversation.id).catch(err => console.error(err));
    }

    function appendMessage(message, isSender) {
        const messageElement = document.createElement('div');

        messageElement.className = `flex w-full mt-2 space-x-3 max-w-md ${isSender ? 'ml-auto justify-end' : ''}`;
        
        const bubbleClasses = isSender 
            ? 'bg-[#dcf8c6] text-gray-800'
            : 'bg-white text-gray-800';

        const partnerAvatarUrl = document.getElementById('chat-partner-avatar').src;
        const avatarHtml = isSender 
            ? '' 
            : `<div><img src="${partnerAvatarUrl}" class="w-8 h-8 rounded-full object-cover flex-shrink-0"></div>`;

        messageElement.innerHTML = `
            ${avatarHtml}
            <div class="flex-1">
                <div class="${bubbleClasses} p-3 rounded-lg shadow-sm">
                    <p class="text-sm">${message.message}</p>
                    <div class="flex items-center ${isSender ? 'justify-end' : 'justify-start'} mt-1">
                        <p class="text-xs text-gray-400">${new Date(message.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        ${isSender ? '<svg class="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 7.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2z" clip-rule="evenodd"></path></svg>' : ''}
                    </div>
                </div>
            </div>
        `;
        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();

        if (messageText && activeConversationId && connection) {

            const messageToSend = {
                ChatId: activeConversationId,
                SenderId: currentUser.id,
                ReceiverId: activeRecipientId,
                Message: messageText,
                MessageType: 0
            };

            connection.invoke("SendMessage", messageToSend)
                .catch(err => console.error("Send message error:", err.toString()));

            messageInput.value = '';
        }
    });

    searchInput.addEventListener('input', filterAndRenderConversations);

});
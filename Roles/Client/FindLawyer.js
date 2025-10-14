document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const logoutBtn = document.getElementById('logout-btn');
    const lawyersGrid = document.getElementById('lawyers-grid');
    const noLawyersMessage = document.getElementById('no-lawyers-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const searchInput = document.getElementById('search-input');
    const specializationFilter = document.getElementById('specialization-filter');
    
    let allLawyers = [];
    let currentPage = 1;
    const pageSize = 12;

    if (!token || userRole !== 'Client' || !currentUser) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/LoginPage/Login.html';
        });
    }

    const specializationMap = {
        0: 'Criminal Law',
        1: 'Civil Law',
        2: 'Family Law',
        3: 'Corporate Law'
    };

    const getFullImageUrl = (url) => {
        const defaultAvatar = '../../assets/Avatar.png';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };

    async function fetchLawyers(page = 1) {
        loadingSpinner.style.display = 'block';
        lawyersGrid.innerHTML = '';
        noLawyersMessage.classList.add('hidden');

        const specFilter = specializationFilter.value;
        const searchTerm = searchInput.value;

        // We fetch only verified lawyers for clients. The enum for Verified is 0.
        let url = `https://localhost:7020/api/v1.0/Lawyers/search?verificationStatus=0&PageNumber=${page}&PageSize=${pageSize}`;
        if (specFilter !== 'all') {
            url += `&specialization=${specFilter}`;
        }
        if (searchTerm) {
            url += `&university=${encodeURIComponent(searchTerm)}`;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch lawyers.');

            const result = await response.json();
            if (result.isSuccess && result.data) {
                allLawyers = result.data;
                renderLawyers(allLawyers);
            } else {
                noLawyersMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching lawyers:', error);
            noLawyersMessage.classList.remove('hidden');
            noLawyersMessage.querySelector('h3').textContent = 'Error Loading Lawyers';
            noLawyersMessage.querySelector('p').textContent = 'Could not load lawyer data. Please try again later.';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function renderLawyers(lawyers) {
        lawyersGrid.innerHTML = '';
        if (lawyers.length === 0) {
            noLawyersMessage.classList.remove('hidden');
            return;
        }

        lawyers.forEach(lawyer => {
            const lawyerCard = document.createElement('div');
            lawyerCard.className = 'bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center transition hover:shadow-lg';
            lawyerCard.innerHTML = `
                <img src="${getFullImageUrl(lawyer.profilePictureUrl)}" alt="${lawyer.firstName}" class="w-24 h-24 rounded-full object-cover mb-4 border-4 border-gray-100">
                <h3 class="font-bold text-lg text-gray-800">${lawyer.firstName} ${lawyer.lastName}</h3>
                <p class="text-sm text-gray-500 mb-3">${specializationMap[lawyer.lawyerSpecialization] || 'Specialist'}</p>
                <button data-lawyer-id="${lawyer.userId}" class="chat-with-lawyer-btn mt-auto w-full bg-[var(--js-primary)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
                    Chat Now
                </button>
            `;
            lawyersGrid.appendChild(lawyerCard);
        });

        document.querySelectorAll('.chat-with-lawyer-btn').forEach(button => {
            button.addEventListener('click', handleChatInitiation);
        });
    }

    async function handleChatInitiation(event) {
        const lawyerUserId = event.target.dataset.lawyerId;
        const clientUserId = currentUser.id;

        if (!lawyerUserId) {
            Swal.fire('Error', 'Could not identify the selected lawyer.', 'error');
            return;
        }

        try {
            // 1. Check if a chat already exists
            const chatsResponse = await fetch(`https://localhost:7020/api/v1.0/Chats/user/${clientUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!chatsResponse.ok) throw new Error('Failed to check existing chats.');
            const chatsResult = await chatsResponse.json();

            let existingChat = null;
            if (chatsResult.isSuccess && chatsResult.data) {
                existingChat = chatsResult.data.find(chat =>
                    (chat.initiatorId === clientUserId && chat.recipientId === lawyerUserId) ||
                    (chat.initiatorId === lawyerUserId && chat.recipientId === clientUserId)
                );
            }

            if (existingChat) {
                // 2a. If chat exists, redirect to it
                window.location.href = `/Roles/Client/Chat.html?chatId=${existingChat.id}`;
            } else {
                // 2b. If chat doesn't exist, create it
                const createChatResponse = await fetch('https://localhost:7020/api/v1.0/Chats/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        initiatorId: clientUserId,
                        recipientId: lawyerUserId
                    })
                });

                if (!createChatResponse.ok) throw new Error('Failed to create a new chat.');
                const createChatResult = await createChatResponse.json();

                if (createChatResult.isSuccess && createChatResult.data) {
                    window.location.href = `/Roles/Client/Chat.html?chatId=${createChatResult.data.id}`;
                } else {
                    throw new Error(createChatResult.message || 'Could not start a new chat session.');
                }
            }
        } catch (error) {
            console.error('Error initiating chat:', error);
            Swal.fire('Error', `Could not start chat: ${error.message}`, 'error');
        }
    }

    searchInput.addEventListener('input', () => fetchLawyers(1));
    specializationFilter.addEventListener('change', () => fetchLawyers(1));

    // Initial fetch
    fetchLawyers();
});
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const notificationsContainer = document.getElementById('notifications-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noNotificationsMessage = document.getElementById('no-notifications-message');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (!token || userRole !== 'Client' || !currentUser) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    async function fetchNotifications() {
        loadingSpinner.style.display = 'block';
        noNotificationsMessage.classList.add('hidden');

        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Notifications/user/${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications.');

            const result = await response.json();
            if (result.isSuccess && result.data) {
                renderNotifications(result.data);
            } else {
                noNotificationsMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            notificationsContainer.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function renderNotifications(notifications) {
        // Clear previous notifications but keep the spinner/message elements
        notificationsContainer.querySelectorAll('.notification-item').forEach(el => el.remove());

        if (notifications.length === 0) {
            noNotificationsMessage.classList.remove('hidden');
            return;
        }

        notifications.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

        notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item bg-white p-4 rounded-lg shadow-sm flex items-start gap-4 cursor-pointer transition hover:shadow-md ${!notification.isRead ? 'border-l-4 border-[var(--js-primary)]' : ''}`;
            notificationElement.dataset.id = notification.id;
            notificationElement.dataset.isRead = notification.isRead;

            notificationElement.innerHTML = `
                <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg class="h-6 w-6 text-[var(--js-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <h4 class="font-semibold text-gray-800">${notification.title}</h4>
                        <p class="text-xs text-gray-500">${new Date(notification.dateCreated).toLocaleString()}</p>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                </div>
                <button class="delete-notification-btn flex-shrink-0 text-gray-400 hover:text-red-500" data-id="${notification.id}">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                </button>
            `;
            notificationsContainer.appendChild(notificationElement);
        });
    }

    async function markAsRead(notificationId, element) {
        if (element.dataset.isRead === 'true') return;

        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Notifications/updatenotifications/${notificationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isRead: true })
            });
            if (!response.ok) throw new Error('Failed to mark as read.');
            
            element.classList.remove('border-l-4', 'border-[var(--js-primary)]');
            element.dataset.isRead = 'true';
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function deleteNotification(notificationId, element) {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete notification.');

            element.remove();
            if (notificationsContainer.querySelectorAll('.notification-item').length === 0) {
                noNotificationsMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }

    markAllReadBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Notifications/markAllAsRead/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to mark all as read.');

            notificationsContainer.querySelectorAll('.notification-item').forEach(el => {
                el.classList.remove('border-l-4', 'border-[var(--js-primary)]');
                el.dataset.isRead = 'true';
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
            Swal.fire('Error', error.message, 'error');
        }
    });

    notificationsContainer.addEventListener('click', (e) => {
        const notificationItem = e.target.closest('.notification-item');
        if (!notificationItem) return;

        if (e.target.closest('.delete-notification-btn')) {
            deleteNotification(notificationItem.dataset.id, notificationItem);
        } else {
            markAsRead(notificationItem.dataset.id, notificationItem);
        }
    });

    logoutBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = '/LoginPage/Login.html'; });

    fetchNotifications();
});
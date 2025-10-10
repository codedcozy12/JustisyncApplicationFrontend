document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('client-details-container');
    const loadingMessage = document.getElementById('loading-message');
    const apiUrl = 'https://localhost:7020/api/v1.0/Users';
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('id');

    if (!clientId) {
        container.innerHTML = '<p class="text-center text-red-500">No client ID provided.</p>';
        return;
    }

    fetch(`${apiUrl}/${clientId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error('Client not found or failed to load data.');
            }
            return res.json();
        })
        .then(result => {
            loadingMessage.style.display = 'none';
            const client = result.data;

            const getFullImageUrl = (url) => {
                const defaultAvatar = '../assets/Avatar.png';
                if (!url) {
                    return defaultAvatar;
                }
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    return url;
                }
                return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
            };

            const detailsHtml = `
                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-shrink-0">
                        <img src="${getFullImageUrl(client.profilePictureUrl)}" alt="Profile Picture" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md">
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="text-3xl font-bold text-gray-800">${client.firstName || ''} ${client.lastName || ''}</h3>
                        <p class="text-gray-500">@${client.username || 'N/A'}</p>
                    </div>
                </div>
                <div class="mt-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Email Address</p>
                        <p class="text-lg text-gray-800">${client.email || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">Phone Number</p>
                        <p class="text-lg text-gray-800">${client.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">Email Confirmed</p>
                        <p class="text-lg ${client.isEmailConfirmed ? 'text-green-600' : 'text-red-600'}">${client.isEmailConfirmed ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            `;
            container.innerHTML = detailsHtml;
        })
        .catch(error => {
            loadingMessage.style.display = 'none';
            container.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        });
});
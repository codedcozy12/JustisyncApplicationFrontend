document.addEventListener('DOMContentLoaded', function () {
    const registrarDetailsContainer = document.getElementById('registrar-details-container');
    const loadingMessage = document.getElementById('loading-message');

    const apiUrl = 'https://localhost:7020/api/v1.0/Registrars';
    const profilePicBaseUrl = 'https://localhost:7020/UserImages/Images/';

    async function fetchRegistrarDetails() {
        const params = new URLSearchParams(window.location.search);
        const registrarId = params.get('id');

        if (!registrarId) {
            loadingMessage.textContent = 'No registrar ID provided.';
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${registrarId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch registrar details.');
            }
            const result = await response.json();
            const registrar = result.data;

            renderRegistrarDetails(registrar);

        } catch (error) {
            console.error('Error fetching details:', error);
            loadingMessage.innerHTML = `<p class="text-red-500">Error loading details. Please try again later.</p>`;
        }
    }

    function renderRegistrarDetails(registrar) {
        loadingMessage.classList.add('hidden');
        registrarDetailsContainer.classList.remove('hidden');

        const fullName = `${registrar.firstName || ''} ${registrar.middleName || ''} ${registrar.lastName || ''}`.trim();
        const profilePictureUrl = registrar.profilePictureUrl ? `${profilePicBaseUrl}${registrar.profilePictureUrl}` : '/assets/Avatar.png';
        const isActive = registrar.isActive;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

        registrarDetailsContainer.innerHTML = `
            <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
                <!-- Profile Picture -->
                <div class="flex-shrink-0">
                    <img src="${profilePictureUrl}" alt="Profile Picture" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md">
                </div>

                <!-- Basic Info -->
                <div class="flex-1 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <h2 class="text-3xl font-bold text-gray-800">${fullName || 'N/A'}</h2>
                        <span class="text-sm font-medium px-3 py-1 rounded-full ${statusClass}">${statusText}</span>
                    </div>
                    <p class="text-lg text-gray-500">${registrar.username}</p>
                </div>
            </div>

            <!-- Detailed Information -->
            <div class="mt-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500">Email Address</span>
                    <span class="text-lg text-gray-800">${registrar.email || 'N/A'}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500">Phone Number</span>
                    <span class="text-lg text-gray-800">${registrar.phoneNumber || 'N/A'}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500">Court Assigned</span>
                    <span class="text-lg text-gray-800">${registrar.courtName || 'N/A'}</span>
            </div>
        `;
    }

    fetchRegistrarDetails();
});
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const container = document.getElementById('lawyer-details-container');
    const loadingMessage = document.getElementById('loading-message');
    const lawyersApiUrl = 'https://localhost:7020/api/v1.0/Lawyers';

    const urlParams = new URLSearchParams(window.location.search);
    const lawyerId = urlParams.get('id');
    
    // --- PRE-FLIGHT CHECKS ---
    if (!token) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }
    
    if (!lawyerId) {
        loadingMessage.style.display = 'none';
        container.innerHTML = '<p class="text-center text-red-500">No lawyer ID provided.</p>';
        return;
    }

    // --- HELPER FUNCTIONS ---
    const getFullImageUrl = (url) => {
        const defaultAvatar = '../../assets/Avatar.png'; // Corrected path
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };
   
    const getCertificateFullImageUrl = (url) => {
        const defaultAvatar = '#'; // Use '#' for a non-functional link if URL is missing
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/Certificate/Images/${url.replace(/^\//, '')}`;
    };

    function handleVerification(action) {
        const endpoint = `${lawyersApiUrl}/certificates/${lawyerId}/verify`;
        const isApproved = action === 'approve';

        const requestBody = {
            isVerified: isApproved,
            isRejected: !isApproved
        };

        fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        })
            .then(res => {
                if (!res.ok) throw new Error(`Failed to update lawyer's verification status.`);
                return res.json();
            })
            .then(async () => {
                await Swal.fire({
                    title: 'Success!',
                    text: `Lawyer has been marked as ${isApproved ? 'Approved' : 'Rejected'}.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                // Update UI dynamically without a full page reload
                const statusBadge = document.getElementById('status-badge');
                const actionButtons = document.getElementById('action-buttons');

                if (statusBadge) {
                    statusBadge.textContent = isApproved ? 'Approved' : 'Rejected';
                    statusBadge.className = `mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${isApproved ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`;
                }

                if (actionButtons) {
                    // Hide the buttons after action is taken
                    actionButtons.classList.add('hidden');
                }
            })
            .catch(error => Swal.fire('Error', error.message, 'error'));
    }

    /**
     * Renders the lawyer's details onto the page.
     * @param {object} lawyer - The lawyer data object.
     */
    function renderLawyerDetails(lawyer) {
        try {
            // --- Data Mapping ---
            const specializationMap = {
                0: 'Criminal Law',
                1: 'Civil Law',
                2: 'Family Law',
                3: 'Corporate Law'
            };

            let statusText = 'Pending Verification';
            let statusClass = 'bg-yellow-200 text-yellow-800';

            if (lawyer.isVerified) {
                statusText = 'Approved';
                statusClass = 'bg-green-200 text-green-800';
            } else if (lawyer.isRejected) {
                statusText = 'Rejected';
                statusClass = 'bg-red-200 text-red-800';
            }

            // --- HTML Template ---
            const detailsHtml = `
                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-shrink-0">
                        <img src="${getFullImageUrl(lawyer.profilePictureUrl)}" alt="Profile Picture" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md">
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="text-3xl font-bold text-gray-800">${lawyer.firstName || ''} ${lawyer.lastName || ''}</h3>
                        <p class="text-gray-500">@${lawyer.username || 'N/A'}</p>
                        <span id="status-badge" class="mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${statusClass}">
                            ${statusText}
                        </span>
                    </div>
                </div>

                <div class="mt-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><p class="text-sm text-gray-500">Email</p><p class="text-lg">${lawyer.email || 'N/A'}</p></div>
                    <div><p class="text-sm text-gray-500">Phone</p><p class="text-lg">${lawyer.phoneNumber || 'N/A'}</p></div>
                    <div><p class="text-sm text-gray-500">Bar Membership No.</p><p class="text-lg">${lawyer.barMembershipNumber || 'N/A'}</p></div>
                    <div><p class="text-sm text-gray-500">Specialization</p><p class="text-lg">${specializationMap[lawyer.lawyerSpecialization] || 'N/A'}</p></div>
                </div>

                <div class="mt-8 border-t border-gray-200 pt-6">
                    <h4 class="text-xl font-semibold mb-3">Certificates</h4>
                    <div id="certificates-list" class="space-y-2">
                        ${lawyer.certificates && lawyer.certificates.length > 0 ? lawyer.certificates.map(cert => `
                            <a href="${getCertificateFullImageUrl(cert.filePath)}" target="_blank" class="block bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition">
                                View Certificate (${cert.type || 'File'})
                            </a>`).join('') : '<p class="text-gray-500">No certificates uploaded.</p>'}
                    </div>
                </div>

                <div id="action-buttons" class="mt-8 border-t border-gray-200 pt-6 flex justify-end gap-4 ${lawyer.isVerified || lawyer.isRejected ? 'hidden' : ''}">
                    <button id="reject-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">Reject</button>
                    <button id="approve-btn" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">Approve</button>
                </div>
            `;
            container.innerHTML = detailsHtml;

            // --- Add Event Listeners Safely ---
            const approveBtn = document.getElementById('approve-btn');
            const rejectBtn = document.getElementById('reject-btn');

            if (approveBtn) {
                approveBtn.addEventListener('click', () => handleVerification('approve'));
            }
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => handleVerification('reject'));
            }
        } catch (error) {
            console.error("Error rendering lawyer details:", error);
            container.innerHTML = `<p class="text-center text-red-500">An error occurred while displaying the lawyer's details.</p>`;
        }
    }

    /**
     * Fetches lawyer data from the API and initiates rendering.
     */
    async function fetchLawyerDetails() {
        try {
            const response = await fetch(`${lawyersApiUrl}/${lawyerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Lawyer not found or failed to load data.');
            
            const result = await response.json();
            if (result.isSuccess && result.data) {
                renderLawyerDetails(result.data);
            } else {
                throw new Error(result.message || 'Could not retrieve lawyer data.');
            }
        } catch (error) {
            container.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // --- INITIALIZATION ---
    fetchLawyerDetails();
});
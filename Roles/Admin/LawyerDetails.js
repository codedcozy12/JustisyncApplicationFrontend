document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('lawyer-details-container');
    const loadingMessage = document.getElementById('loading-message');
    const lawyersApiUrl = 'https://localhost:7020/api/v1.0/Lawyers';

    const urlParams = new URLSearchParams(window.location.search);
    const lawyerId = urlParams.get('id');

    if (!lawyerId) {
        container.innerHTML = '<p class="text-center text-red-500">No lawyer ID provided.</p>';
        return;
    }

    const getFullImageUrl = (url) => {
        const defaultAvatar = '../assets/Avatar.png';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };
   
    const getCertificateFullImageUrl = (url) => {
        const defaultAvatar = '/';
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
                // Assuming you need an auth token for this endpoint
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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

    fetch(`${lawyersApiUrl}/${lawyerId}`)
        .then(res => {
            if (!res.ok) throw new Error('Lawyer not found or failed to load data.');
            return res.json();
        })
        .then(result => {
            loadingMessage.style.display = 'none';
            const lawyer = result.data;

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
            document.getElementById('approve-btn').addEventListener('click', () => handleVerification('approve'));
            document.getElementById('reject-btn').addEventListener('click', () => handleVerification('reject'));
        })
        .catch(error => {
            loadingMessage.style.display = 'none';
            container.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        });
});
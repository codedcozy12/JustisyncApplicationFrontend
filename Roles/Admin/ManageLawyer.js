document.addEventListener('DOMContentLoaded', function () {
    const lawyersApiUrl = 'https://localhost:7020/api/v1.0/Lawyers';
    const tableBody = document.getElementById('lawyersTableBody');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    let allLawyers = [];

    const specializationMap = {
        0: 'Criminal Law',
        1: 'Civil Law',
        2: 'Family Law',
        3: 'Corporate Law'
    };

    const verificationStatusMap = {
        0: { text: 'Verified', class: 'bg-yellow-200 text-yellow-800' },
        1: { text: 'Rejected', class: 'bg-green-200 text-green-800' },
        2: { text: 'Pending', class: 'bg-red-200 text-red-800' }
    };

    function renderLawyers(lawyersToRender) {
        tableBody.innerHTML = '';
        if (!lawyersToRender || lawyersToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No lawyers found.</td></tr>`;
            return;
        }

        lawyersToRender.forEach(lawyer => {
            const fullName = `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim();
            const specializationText = specializationMap[lawyer.lawyerSpecialization] || 'N/A';
            
            const statusInfo = verificationStatusMap[lawyer.verificationStatus];

            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-2">${fullName}</td>
                <td class="px-4 py-2">${lawyer.email || 'N/A'}</td>
                <td class="px-4 py-2">${lawyer.phoneNumber || 'N/A'}</td>
                <td class="px-4 py-2">${specializationText}</td>
                <td class="px-4 py-2">
                    <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.class}">
                        ${statusInfo.text}
                    </span>
                </td>
                <td class="px-4 py-2 text-center">
                    <a href="LawyerDetails.html?id=${lawyer.id}" class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">View</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function filterAndSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const status = statusFilter.value;

        let filteredLawyers = allLawyers.filter(lawyer => {
            const fullName = `${lawyer.firstName} ${lawyer.lastName}`.toLowerCase();
            const email = lawyer.email.toLowerCase();
            return fullName.includes(searchTerm) || email.includes(searchTerm);
        });

        if (status !== 'all') {
            filteredLawyers = filteredLawyers.filter(lawyer => {
                if (status === 'verified') return lawyer.isVerified;
                if (status === 'rejected') return lawyer.isRejected;
                if (status === 'pending') return !lawyer.isVerified && !lawyer.isRejected;
                return false;
            });
        }

        renderLawyers(filteredLawyers);
    }

    async function fetchLawyers() {
        try {
            const response = await fetch(lawyersApiUrl);
            if (!response.ok) throw new Error('Failed to fetch lawyers.');
            const result = await response.json();
            allLawyers = result.data || [];
            renderLawyers(allLawyers);
        } catch (error) {
            console.error('Error fetching lawyers:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Error loading lawyers.</td></tr>`;
        }
    }

    searchInput.addEventListener('input', filterAndSearch);
    statusFilter.addEventListener('change', filterAndSearch);

    fetchLawyers();
});
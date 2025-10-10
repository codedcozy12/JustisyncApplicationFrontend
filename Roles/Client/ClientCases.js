document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const logoutBtn = document.getElementById('logout-btn');
    const casesTableBody = document.getElementById('cases-table-body');
    const noCasesMessage = document.getElementById('no-cases-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    
    if (!token || userRole !== 'Client') {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    
    const allCases = [
        { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', caseNumber: 'JUS-2024-001', title: 'Civil Suit for Property Damage', lawyerName: 'Barr. Adekunle Gold', status: 'Discovery', createdAt: '2024-05-10T10:00:00Z' },
        { id: 'f8c3b3e8-8e3a-4b7a-9f1e-6d5c8a9b0c1d', caseNumber: 'JUS-2024-002', title: 'Contract Dispute with Supplier', lawyerName: 'Barr. Simi Ogunleye', status: 'In Court', createdAt: '2024-03-15T14:30:00Z' },
        { id: 'a2b4c6d8-e0f2-4a1b-8c3d-9e1a7b5f6c8e', caseNumber: 'JUS-2024-003', title: 'Intellectual Property Claim', lawyerName: 'Barr. Falz Bahd', status: 'Open', createdAt: '2024-02-01T09:00:00Z' },
        { id: 'd4e6f8a0-c2b4-4d5e-9a1b-8c3d7e9f0a2b', caseNumber: 'JUS-2023-089', title: 'Tenancy Agreement Violation', lawyerName: 'Barr. Adekunle Gold', status: 'Closed', createdAt: '2023-11-20T11:45:00Z' },
    ];

    function getStatusBadge(status) {
        const statusMap = {
            'Open': 'bg-green-200 text-green-800',
            'Discovery': 'bg-yellow-200 text-yellow-800',
            'In Court': 'bg-blue-200 text-blue-800',
            'Closed': 'bg-gray-200 text-gray-800',
        };
        const classes = statusMap[status] || 'bg-gray-200 text-gray-800';
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full ${classes}">${status}</span>`;
    }

    
    function renderCases(casesToRender) {
        casesTableBody.innerHTML = '';

        if (casesToRender.length === 0) {
            noCasesMessage.classList.remove('hidden');
            casesTableBody.appendChild(noCasesMessage);
        } else {
            noCasesMessage.classList.add('hidden');
            casesToRender.forEach(caseItem => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3 text-gray-500 font-mono">${caseItem.caseNumber}</td>
                    <td class="px-4 py-3 font-semibold">${caseItem.title}</td>
                    <td class="px-4 py-3">${caseItem.lawyerName || 'N/A'}</td>
                    <td class="px-4 py-3">${getStatusBadge(caseItem.status)}</td>
                    <td class="px-4 py-3">${new Date(caseItem.createdAt).toLocaleDateString()}</td>
                    <td class="px-4 py-3 text-center">
                        <a href="/Roles/Client/CaseDetails.html?id=${caseItem.id}" class="text-[var(--js-primary)] hover:underline font-semibold">View Details</a>
                    </td>
                `;
                casesTableBody.appendChild(row);
            });
        }
    }

    
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        let filteredCases = allCases;

        if (selectedStatus !== 'all') {
            filteredCases = filteredCases.filter(c => c.status === selectedStatus);
        }

        if (searchTerm) {
            filteredCases = filteredCases.filter(c =>
                c.title.toLowerCase().includes(searchTerm) ||
                (c.lawyerName && c.lawyerName.toLowerCase().includes(searchTerm)) ||
                c.caseNumber.toLowerCase().includes(searchTerm)
            );
        }

        renderCases(filteredCases);
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    
    function initializePage() {

        setTimeout(() => {
            loadingSpinner.classList.add('hidden');
            renderCases(allCases);
        }, 1000);
    }

    initializePage();
});

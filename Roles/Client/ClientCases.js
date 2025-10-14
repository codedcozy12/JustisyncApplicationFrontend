document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = localStorage.getItem('userRole');
    const logoutBtn = document.getElementById('logout-btn');
    const casesTableBody = document.getElementById('cases-table-body');
    const noCasesMessage = document.getElementById('no-cases-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    
    if (!token || userRole !== 'Client' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    let allCases = [];
    const statusMap = {
        0: 'Initiated', 1: 'Filed', 2: 'Scheduled', 3: '', 4: 'In Court', 5: 'Adjourned', 6: 'Closed', 7: 'Dismissed'
    };

    function getStatusBadge(status) {
        const statusText = statusMap[status] || 'Unknown';
        const statusColorMap = {
            'Initiated': 'bg-yellow-200 text-yellow-800',
            'Filed': 'bg-blue-200 text-blue-800',
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
            casesToRender.forEach(async caseItem => {
                const law = await getLawyer(caseItem.lawyerId);
                const lawyerName = law.data.firstName + ' ' + law.data.lastName || 'N/A';
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3 text-gray-500 font-mono">${caseItem.caseNumber}</td>
                    <td class="px-4 py-3 font-semibold">${caseItem.title}</td>
                    <td class="px-4 py-3">${lawyerName || 'N/A'}</td>
                    <td class="px-4 py-3">${getStatusBadge(caseItem.status, caseItem.lawyerName)}</td>
                    <td class="px-4 py-3">${new Date(caseItem.createdAt).toLocaleDateString()}</td>
                    <td class="px-4 py-3 text-center">
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
            filteredCases = filteredCases.filter(c => c.status == selectedStatus);
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

    async function fetchCases() {
        loadingSpinner.classList.remove('hidden');
        noCasesMessage.classList.add('hidden');
        casesTableBody.innerHTML = '';
        try {
            const [casesResponse, lawyersResponse] = await Promise.all([
                fetch(`https://localhost:7020/api/v1.0/Cases/client/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`https://localhost:7020/api/v1.0/Lawyers`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!casesResponse.ok) throw new Error('Failed to fetch cases.');
            const casesResult = await casesResponse.json();
            const lawyersResult = lawyersResponse.ok ? await lawyersResponse.json() : { data: [] };
            const lawyers = lawyersResult.data || [];

            if (casesResult.isSuccess && casesResult.data) {
                allCases = casesResult.data.map(caseItem => {
                    const lawyer = lawyers.find(l => l.userId === caseItem.lawyerId);
                    return {
                        ...caseItem,
                        lawyerName: lawyer ? `Barr. ${lawyer.firstName} ${lawyer.lastName}` : 'N/A'
                    };
                });
                renderCases(allCases);
            } else {
                noCasesMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
            casesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Error loading cases. Please try again.</td></tr>`;
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    async function getLawyer(id) {
        const res = await fetch(`https://localhost:7020/api/v1.0/Lawyers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }

    function initializePage() {
        fetchCases();
    }

    initializePage();
});

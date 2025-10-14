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

    if (!token || userRole !== 'Lawyer' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    let allCases = [];
    const statusMap = {
        0: 'Initiated', 1: 'Filed', 2: 'In Progress', 3: 'Scheduled', 4: 'In Court', 5: 'Closed', 6: 'Rejected'
    };

    function getStatusBadge(status) {
        const statusText = statusMap[status] || 'Unknown';
        const statusColorMap = {
            'Initiated': 'bg-yellow-200 text-yellow-800',
            'Filed': 'bg-blue-200 text-blue-800',
            'In Progress': 'bg-indigo-200 text-indigo-800',
            'Scheduled': 'bg-purple-200 text-purple-800',
            'In Court': 'bg-blue-200 text-blue-800',
            'Closed': 'bg-gray-200 text-gray-800',
            'Rejected': 'bg-red-200 text-red-800',
            'Unknown': 'bg-gray-200 text-gray-800'
        };
        const classes = statusColorMap[statusText];
        return `<span class="px-2 py-1 text-xs font-semibold rounded-full ${classes}">${statusText}</span>`;
    }

    function renderCases(casesToRender) {
        casesTableBody.innerHTML = '';

        if (casesToRender.length === 0) {
            noCasesMessage.classList.remove('hidden');
            casesTableBody.appendChild(noCasesMessage);
        } else {
            noCasesMessage.classList.add('hidden');
            casesToRender.forEach(async caseItem => {
                let clientName = await getClient(caseItem.clientId)
            
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3 text-gray-500 font-mono">${caseItem.caseNumber || 'N/A'}</td>
                    <td class="px-4 py-3 font-semibold">${caseItem.title}</td>
                    <td class="px-4 py-3">${clientName.data.firstName + ' ' + clientName.data.lastName|| 'N/A'}</td>
                    <td class="px-4 py-3">${getStatusBadge(caseItem.status)}</td>
                    <td class="px-4 py-3">${new Date(caseItem.createdAt).toLocaleDateString()}</td>
                    <td class="px-4 py-3 text-center">
                        <a href="/Roles/Lawyer/CaseDetails.html?id=${caseItem.id}" class="text-[var(--js-primary)] hover:underline font-semibold">View Details</a>
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
                (c.clientName && c.clientName.toLowerCase().includes(searchTerm)) ||
                (c.caseNumber && c.caseNumber.toLowerCase().includes(searchTerm))
            );
        }

        renderCases(filteredCases);
    }

    async function fetchCases() {
        loadingSpinner.classList.remove('hidden');
        noCasesMessage.classList.add('hidden');
        casesTableBody.innerHTML = '';
        try {
            const [casesResponse, usersResponse] = await Promise.all([
                fetch(`https://localhost:7020/api/v1.0/Cases/lawyer/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`https://localhost:7020/api/v1.0/Users`, { // Fetch all users to map client IDs to names
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!casesResponse.ok) throw new Error('Failed to fetch cases.');
            const casesResult = await casesResponse.json();
            const usersResult = usersResponse.ok ? await usersResponse.json() : { data: [] };
            const users = usersResult.data || [];

            if (casesResult.isSuccess && casesResult.data) {
                allCases = casesResult.data.map(caseItem => {
                    const client = users.find(u => u.id === caseItem.clientId);
                    return {
                        ...caseItem,
                        clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'
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

      async function getClient(id) {
        const res = await fetch(`https://localhost:7020/api/v1.0/Users/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }


    logoutBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = '/LoginPage/Login.html'; });
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    fetchCases();
});
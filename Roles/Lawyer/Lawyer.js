document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = localStorage.getItem('userRole');
    const lawyerNameSpan = document.getElementById('lawyer-name');
    const logoutBtn = document.getElementById('logout-btn');
    const pendingCasesTbody = document.getElementById('pending-cases-tbody');
    const noPendingCasesMessage = document.getElementById('no-pending-cases-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    // --- Authentication Check ---
    if (!token || userRole !== 'Lawyer' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    // --- Fetch and Display User Info ---
    function fetchLawyerInfo() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.firstName) {
            lawyerNameSpan.textContent = `Barr. ${user.firstName}`;
        } else {
            lawyerNameSpan.textContent = 'Lawyer';
        }
    }

    // --- Fetch and Display Dashboard Data ---
    async function fetchDashboardData() {
        loadingSpinner.classList.remove('hidden');
        noPendingCasesMessage.classList.add('hidden');
        pendingCasesTbody.innerHTML = '';
        pendingCasesTbody.appendChild(loadingSpinner);

        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Cases/lawyer/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch cases.');
            const result = await response.json();

            if (result.isSuccess && result.data) {
                const allCases = result.data;
                const pendingCases = allCases.filter(c => c.status === 0); // Status 0: Initiated
                const activeCases = allCases.filter(c => c.status === 1 || c.status === 2 || c.status === 4); // Filed, In Progress, In Court
                const upcomingHearings = allCases.filter(c => c.status === 3); // Scheduled

                // Update Stats Cards
                document.getElementById('stats-new-cases').textContent = pendingCases.length;
                document.getElementById('stats-active-cases').textContent = activeCases.length;
                document.getElementById('stats-hearings').textContent = upcomingHearings.length;

                renderPendingCases(pendingCases);
            } else {
                renderPendingCases([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            pendingCasesTbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Error loading data.</td></tr>`;
        }
    }

    async function renderPendingCases(pendingCases) {

        const offenseTypeMap = { 0: 'Criminal', 1: 'Civil', 2: 'Family', 3: 'Corporate', 4: 'Property' };
        pendingCasesTbody.innerHTML = '';

        if (pendingCases.length === 0) {
            noPendingCasesMessage.classList.remove('hidden');
            pendingCasesTbody.appendChild(noPendingCasesMessage);
            return;
        }

        // In a real app, you'd fetch client details. For now, we show Client ID.
        for (const caseItem of pendingCases) {
            const row = document.createElement('tr');
            let clientName = await getClient(caseItem.clientId)
            row.innerHTML = `
                <td class="px-4 py-3 border-b font-semibold">${clientName.data.firstName} ${clientName.data.lastName}...</td>
                <td class="px-4 py-3 border-b">${caseItem.title}</td>
                <td class="px-4 py-3 border-b">${offenseTypeMap[caseItem.offenseType] || 'N/A'}</td>
                <td class="px-4 py-3 border-b">${new Date(caseItem.createdAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 border-b text-center">
                    <a href="/Roles/Lawyer/CompleteCaseFiling.html?id=${caseItem.id}" class="bg-[var(--js-primary)] text-white px-4 py-2 text-sm rounded-lg font-semibold hover:bg-blue-800 transition">
                        Complete Filing
                    </a>
                </td>
            `;
            pendingCasesTbody.appendChild(row);
        }
    }

    // --- Logout Functionality ---
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    async function getClient(id) {
        const res = await fetch(`https://localhost:7020/api/v1.0/Users/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }

    // --- Initial Page Load ---
    function initializePage() {
        fetchLawyerInfo();
        fetchDashboardData();
    }

    initializePage();
});
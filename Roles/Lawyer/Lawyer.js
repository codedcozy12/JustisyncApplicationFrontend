document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const lawyerNameSpan = document.getElementById('lawyer-name');
    const logoutBtn = document.getElementById('logout-btn');
    const pendingCasesTbody = document.getElementById('pending-cases-tbody');
    const noPendingCasesMessage = document.getElementById('no-pending-cases-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    // --- Authentication Check ---
    if (!token || userRole !== 'Lawyer') {
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
    function fetchDashboardData() {
        // Placeholder data. In a real app, this would come from API endpoints.
        const pendingCases = [
            { caseId: 'case-001', clientName: 'Alice Johnson', title: 'Land Dispute', offenseType: 1, dateInitiated: '2024-05-21' },
            { caseId: 'case-002', clientName: 'Bob Williams', title: 'Child Custody', offenseType: 2, dateInitiated: '2024-05-20' },
        ];
        const activeCasesCount = 12;
        const upcomingHearingsCount = 4;

        const offenseTypeMap = { 0: 'Criminal', 1: 'Civil', 2: 'Family', 3: 'Corporate', 4: 'Property' };

        // Update Stats Cards
        document.getElementById('stats-new-cases').textContent = pendingCases.length;
        document.getElementById('stats-active-cases').textContent = activeCasesCount;
        document.getElementById('stats-hearings').textContent = upcomingHearingsCount;

        // Render Pending Cases Table
        pendingCasesTbody.innerHTML = ''; // Clear placeholders

        if (pendingCases.length === 0) {
            noPendingCasesMessage.classList.remove('hidden');
            pendingCasesTbody.appendChild(noPendingCasesMessage);
        } else {
            pendingCases.forEach(caseItem => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-4 py-3 border-b font-semibold">${caseItem.clientName}</td>
                    <td class="px-4 py-3 border-b">${caseItem.title}</td>
                    <td class="px-4 py-3 border-b">${offenseTypeMap[caseItem.offenseType] || 'N/A'}</td>
                    <td class="px-4 py-3 border-b">${new Date(caseItem.dateInitiated).toLocaleDateString()}</td>
                    <td class="px-4 py-3 border-b text-center">
                        <a href="/Roles/Lawyer/CompleteCaseFiling.html?id=${caseItem.caseId}" class="bg-[var(--js-primary)] text-white px-4 py-2 text-sm rounded-lg font-semibold hover:bg-blue-800 transition">
                            Complete Filing
                        </a>
                    </td>
                `;
                pendingCasesTbody.appendChild(row);
            });
        }
    }

    // --- Logout Functionality ---
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    // --- Initial Page Load ---
    function initializePage() {
        fetchLawyerInfo();

        // Simulate API call
        setTimeout(() => {
            loadingSpinner.classList.add('hidden');
            fetchDashboardData();
        }, 1200); // Simulate network delay
    }

    initializePage();
});
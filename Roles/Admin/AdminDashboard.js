document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logout-btn');
    const token = localStorage.getItem('token');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');

            window.location.href = '/LoginPage/Login.html';
        });
    }

    async function fetchDashboardData() {
        const usersApiUrl = 'https://localhost:7020/api/v1.0/Users/all?PageSize=1000';
        const courtsApiUrl = 'https://localhost:7020/api/v1.0/Courts';
        const statsUrl = 'https://localhost:7020/api/v1/Users/stats';

        try {
            const [courtsResponse,statsResponse] = await Promise.all([
                fetch(courtsApiUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(statsUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);
            if (!courtsResponse.ok) throw new Error('Failed to fetch courts');
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');

            const courtsData = await courtsResponse.json();
            const statsData = await statsResponse.json();
            processDashboardData(statsData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }

    function processDashboardData(statsData) {
        let clientCount = statsData.data.totalClients;
        let lawyerCount = statsData.data.totalLawyers;
        let judgeCount = statsData.data.totalJudges;
        let registrarCount = statsData.data.totalRegistrar;
        let courts = statsData.data.totalCourt;
        let pendingVerifications = statsData.data.pendingVerifications;
    
        document.getElementById('courts-count').textContent = courts;
        document.getElementById('clients-count').textContent = clientCount;
        document.getElementById('lawyers-count').textContent = lawyerCount;
        document.getElementById('judges-count').textContent = judgeCount;
        document.getElementById('registrars-count').textContent = registrarCount;
        document.getElementById('pending-verifications-count').textContent = pendingVerifications;

        const verificationTableBody = document.getElementById('verificationsTableBody');
        verificationTableBody.innerHTML = '';

        if (pendingVerifications.length === 0) {
            verificationTableBody.innerHTML = '<tr><td colspan="3" class="p-2 border text-center text-gray-500">No pending verifications.</td></tr>';
        } else {
            pendingVerifications.forEach(user => {
                 const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2 border">Lawyer</td>
                    <td class="p-2 border">${user.firstName} ${user.lastName}</td>
                    <td class="p-2 border">
                        <a href="LawyerDetails.html?id=${user.id}" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">View & Verify</a>
                    </td>
                `;
                verificationTableBody.appendChild(row);
            });
        }
    }

    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('verificationsTableBody');

    if (searchInput && tableBody) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = tableBody.getElementsByTagName('tr');

            for (const row of rows) {
                const nameCell = row.getElementsByTagName('td')[1];
                if (nameCell) {
                    const nameText = nameCell.textContent.toLowerCase();
                    if (nameText.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            }
        });
    }

    fetchDashboardData();
});
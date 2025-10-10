document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    function updateCount(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    function renderPendingVerifications(verifications,totalJudges) {
        const listElement = document.getElementById('pending-verifications-list');
        if (!listElement) return;

        listElement.innerHTML = '';

        listElement.innerHTML = ` <li>${verifications} Lawyers awaiting certificate verification</li>
        <li>${totalJudges} Judges assigned to courts</li>
        <li>0 Users flagged for fraud check</li>`;

       
    }

    async function fetchOverviewData() {
        const statsUrl = 'https://localhost:7020/api/v1/Users/stats';

        try {
            const response = await fetch(statsUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch overview data. Please try again.');
            }

            const result = await response.json();

            if (result.isSuccess && result.data) {
                const stats = result.data;
                const totalUsers = stats.totalClients + stats.totalLawyers + stats.totalJudges + stats.totalRegistrar;

                updateCount('users-count', totalUsers);
                updateCount('lawyers-count', stats.totalLawyers || 0);
                updateCount('judges-count', stats.totalJudges || 0);
                updateCount('registrars-count', stats.totalRegistrar || 0);
                updateCount('clients-count', stats.totalClients || 0);
                renderPendingVerifications(stats.pendingVerifications,stats.totalJudges);
            } else {
                throw new Error(result.message || 'Could not process overview data.');
            }
        } catch (error) {
            console.error('Error fetching overview data:', error);
            document.getElementById('pending-verifications-list').innerHTML = `<li class="text-red-500">${error.message}</li>`;
        }
    }
    fetchOverviewData();
});
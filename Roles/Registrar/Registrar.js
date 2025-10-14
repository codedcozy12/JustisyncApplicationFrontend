document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const logoutBtn = document.getElementById('logout-btn');
    const registrarNameSpan = document.getElementById('registrar-name');
    const courtNameSpan = document.getElementById('court-name');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noPendingCasesMessage = document.getElementById('no-pending-cases-message');
    const pendingCasesTbody = document.getElementById('pending-cases-tbody');

    if (!token || userRole !== 'Registrar' || !currentUser) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/LoginPage/Login.html';
        });
    }

    async function initializeDashboard() {
        if (currentUser && registrarNameSpan) {
            registrarNameSpan.textContent = currentUser.firstName || 'Registrar';
        }

        await fetchRegistrarDetails();

        await fetchPendingCases();
    }

    async function fetchRegistrarDetails() {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Registrars/${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch registrar details.');

            const result = await response.json();
            if (result.isSuccess && result.data) {
                const registrarDetails = result.data;
                if (courtNameSpan) {
                    courtNameSpan.textContent = registrarDetails.courtName || 'Not Assigned';
                }
            } else {
                throw new Error(result.message || 'Could not retrieve registrar details.');
            }
        } catch (error) {
            console.error('Error fetching registrar details:', error);
            if (courtNameSpan) {
                courtNameSpan.textContent = 'Error loading court';
                courtNameSpan.classList.add('text-red-500');
            }
        }
    }

    async function fetchPendingCases() {

        loadingSpinner.classList.add('hidden');
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Cases/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch cases.');
            const result = await response.json();

            if (result.isSuccess && result.data) {
                renderPendingCases(result.data);
            } else {
                renderPendingCases([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            pendingCasesTbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500">Error loading data.</td></tr>`;
        }
    }

    async function renderPendingCases(pendingCases) {
        pendingCasesTbody.innerHTML = '';

        if (pendingCases.length === 0) {
            noPendingCasesMessage.classList.remove('hidden');
            pendingCasesTbody.appendChild(noPendingCasesMessage);
            return;
        }

       for (const caseItem of pendingCases) {
           const row = document.createElement('tr');
           let lawyerName = await getLawyer(caseItem.lawyerId)
           row.innerHTML = `
               <td class="px-4 py-3 border-b font-semibold">${caseItem.title}</td>
               <td class="px-4 py-3 border-b">${lawyerName.data.firstName} ${lawyerName.data.lastName}...</td>
               <td class="px-4 py-3 border-b">${new Date(caseItem.createdAt).toLocaleDateString()}</td>
               <td class="px-4 py-3 border-b text-center">
                   <a href="/Roles/Registrar/ReviewCase.html?id=${caseItem.id}" class="bg-[var(--js-primary)] text-white px-4 py-2 text-sm rounded-lg font-semibold hover:bg-blue-800 transition">
                       Review Case
                   </a>
               </td>
           `;
           pendingCasesTbody.appendChild(row);
       }
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    async function getLawyer(id) {
        const res = await fetch(`https://localhost:7020/api/v1.0/Lawyers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }


    initializeDashboard();
});
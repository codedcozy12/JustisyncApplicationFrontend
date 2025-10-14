document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const logoutBtn = document.getElementById('logout-btn');
    const registrarNameSpan = document.getElementById('registrar-name');
    const courtNameSpan = document.getElementById('court-name');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noPendingCasesMessage = document.getElementById('no-pending-cases-message');
    const pendingCasesTbody = document.getElementById('pending-cases-tbody');

    // --- Authentication and Authorization ---
    if (!token || userRole !== 'Registrar' || !currentUser) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    // --- Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/LoginPage/Login.html';
        });
    }

    // --- Data Fetching and Rendering ---
    async function initializeDashboard() {
        // Set user's name immediately from local storage
        if (currentUser && registrarNameSpan) {
            registrarNameSpan.textContent = currentUser.firstName || 'Registrar';
        }

        // Fetch detailed registrar info, including court name
        await fetchRegistrarDetails();

        // Fetch and render pending cases (placeholder for now)
        fetchPendingCases();
    }

    async function fetchRegistrarDetails() {
        // The user object from login might not have the court name.
        // We need to fetch the full registrar details.
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

    function fetchPendingCases() {
        // This is a placeholder. You would fetch real data from your cases API endpoint.
        loadingSpinner.classList.add('hidden');
        // For demonstration, we'll just show the placeholder row.
        // To show "no cases", hide the placeholder and show the message.
    }

    initializeDashboard();
});
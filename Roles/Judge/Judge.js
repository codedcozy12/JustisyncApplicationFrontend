document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const logoutBtn = document.getElementById('logout-btn');
    const judgeNameSpan = document.getElementById('judge-name');
    const courtNameSpan = document.getElementById('court-name');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noCasesMessage = document.getElementById('no-cases-message');
    const docketTbody = document.getElementById('docket-tbody');

    // --- Authentication and Authorization ---
    if (!token || userRole !== 'Judge' || !currentUser) {
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
        if (currentUser && judgeNameSpan) {
            judgeNameSpan.textContent = currentUser.firstName || 'Judge';
        }

        await fetchJudgeDetails();
        fetchDocket();
    }

    async function fetchJudgeDetails() {
        try {
            // First, get the judge's own details
            const judgeResponse = await fetch(`https://localhost:7020/api/v1.0/Judges/${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!judgeResponse.ok) throw new Error('Failed to fetch judge details.');

            const judgeResult = await judgeResponse.json();
            if (!judgeResult.isSuccess || !judgeResult.data) {
                throw new Error(judgeResult.message || 'Could not retrieve judge details.');
            }
            
            const judgeDetails = judgeResult.data;

            // If the judge has a court assigned, fetch the court's name
            if (judgeDetails.courtAssignedId && courtNameSpan) {
                const courtResponse = await fetch(`https://localhost:7020/api/v1.0/Courts/${judgeDetails.courtAssignedId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courtResponse.ok) {
                    const courtResult = await courtResponse.json();
                    if (courtResult.isSuccess && courtResult.data) {
                        courtNameSpan.textContent = courtResult.data.name || 'Not Assigned';
                    }
                } else {
                     courtNameSpan.textContent = 'Court Not Found';
                }
            } else if (courtNameSpan) {
                courtNameSpan.textContent = 'Not Assigned';
            }

        } catch (error) {
            console.error('Error fetching details:', error);
            if (courtNameSpan) {
                courtNameSpan.textContent = 'Error loading details';
                courtNameSpan.classList.add('text-red-500');
            }
        }
    }

    function fetchDocket() {
        // This is a placeholder for fetching real docket data.
        loadingSpinner.classList.add('hidden');
        // For demonstration, we'll just show the placeholder row.
        // To show "no cases", hide the placeholder and show the message.
        // docketTbody.querySelector('tr').classList.add('hidden');
        // noCasesMessage.classList.remove('hidden');
    }

    initializeDashboard();
});
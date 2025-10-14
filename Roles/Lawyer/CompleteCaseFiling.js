document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));
    const form = document.getElementById('complete-case-form');
    const loadingContainer = document.getElementById('loading-container');
    const logoutBtn = document.getElementById('logout-btn');
    const courtSelect = document.getElementById('courtId');

    // --- Authentication Check ---
    if (!token || userRole !== 'Lawyer' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    // --- Get Case ID from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    if (!caseId) {
        Swal.fire('Error', 'No case ID provided.', 'error');
        loadingContainer.innerHTML = '<p class="text-red-500">Error: No case ID found in URL.</p>';
        return;
    }

    // --- Fetch Initial Case Data ---
    async function fetchCaseDetails() {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Cases/${caseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch case details.');
            const result = await response.json();
            if (result.isSuccess && result.data) {
                populateForm(result.data);
            } else {
                throw new Error(result.message || 'Could not load case data.');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
            loadingContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        } finally {
            loadingContainer.classList.add('hidden');
            form.classList.remove('hidden');
        }
    }

    // --- Populate Courts Dropdown ---
    async function populateCourts() {
        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Courts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch courts.');
            const result = await response.json();
            if (result.isSuccess && result.data) {
                const activeCourts = result.data.filter(c => c.isActive);
                courtSelect.innerHTML = '<option value="" disabled selected>Select a court</option>';
                activeCourts.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} ${court.state}`;
                    courtSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating courts:', error);
            courtSelect.innerHTML = '<option value="">Error loading courts</option>';
        }
    }

    // --- Populate Form with Data ---
    async function populateForm(data) {
        // Fetch client details to display name
        try {
            const clientRes = await fetch(`https://localhost:7020/api/v1.0/Users/${data.clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (clientRes.ok) {
                const clientResult = await clientRes.json();
                if (clientResult.isSuccess) {
                    document.getElementById('clientName').textContent = `${clientResult.data.firstName} ${clientResult.data.lastName}`;
                }
            } else {
                 document.getElementById('clientName').textContent = 'Client details unavailable';
            }
        } catch (e) {
             document.getElementById('clientName').textContent = 'Error loading client name';
        }

        document.getElementById('caseTitle').textContent = data.title;
        document.getElementById('caseDescription').textContent = data.description;
    }

    // --- Form Submission ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const courtId = formData.get('courtId');
        const description = formData.get('Description');
        const lawyerId = user.id;

        // Manually add other required document properties
        const fileInput = document.getElementById('documentFile');
        if (fileInput.files.length > 0) {
            formData.append('document.FileName', fileInput.files[0].name);
        }
        formData.append('document.CaseId', caseId);

        const url = `https://localhost:7020/api/v1.0/Cases/complete/${caseId}?lawyerId=${lawyerId}&courtId=${courtId}&Description=${encodeURIComponent(description)}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok || !result.isSuccess) {
                throw new Error(result.message || 'Failed to complete case filing.');
            }

            Swal.fire({
                icon: 'success',
                title: 'Case Filed!',
                text: `The case has been successfully filed.`,
                timer: 3000,
                showConfirmButton: false
            });

            setTimeout(() => {
                window.location.href = '/Roles/Lawyer/Lawyer.html';
            }, 3000);

        } catch (error) {
            console.error('Error completing case filing:', error);
            Swal.fire('Error', error.message, 'error');
        }
    });

    // --- Logout Functionality ---
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    // --- Initial Page Load ---
    fetchCaseDetails();
    populateCourts();
});
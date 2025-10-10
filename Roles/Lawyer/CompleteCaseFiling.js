document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const form = document.getElementById('complete-case-form');
    const loadingContainer = document.getElementById('loading-container');
    const logoutBtn = document.getElementById('logout-btn');
    const judgeSelect = document.getElementById('judgeId');

    // --- Authentication Check ---
    if (!token || userRole !== 'Lawyer') {
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

    // --- Fetch Initial Case Data (Placeholder) ---
    async function fetchCaseDetails() {
        // In a real app, fetch from `/api/v1.0/Cases/${caseId}`
        const caseDetails = {
            id: caseId,
            title: 'Land Dispute',
            description: 'A dispute over the ownership of a plot of land located at 123 Main St. The client claims ownership based on a deed from 1990, while the opposing party claims ownership via adverse possession.',
            client: {
                id: 'client-001',
                firstName: 'Alice',
                lastName: 'Johnson'
            },
            status: 0 // 'Initiated'
        };

        // Simulate network delay
        setTimeout(() => {
            populateForm(caseDetails);
            loadingContainer.classList.add('hidden');
            form.classList.remove('hidden');
        }, 1000);
    }

    // --- Populate Judges Dropdown (Placeholder) ---
    async function populateJudges() {
        // In a real app, fetch from '/api/v1.0/Judges'
        const judges = [
            { id: 'judge-1', firstName: 'Bolanle', lastName: 'Adeolu' },
            { id: 'judge-2', firstName: 'Chukwudi', lastName: 'Okafor' },
            { id: 'judge-3', firstName: 'Fatima', lastName: 'Bello' },
        ];

        judgeSelect.innerHTML = '<option value="" disabled selected>Select a judge</option>';
        judges.forEach(judge => {
            const option = document.createElement('option');
            option.value = judge.id;
            option.textContent = `Hon. Justice ${judge.firstName} ${judge.lastName}`;
            judgeSelect.appendChild(option);
        });
    }

    // --- Populate Form with Data ---
    function populateForm(data) {
        document.getElementById('clientName').textContent = `${data.client.firstName} ${data.client.lastName}`;
        document.getElementById('caseTitle').textContent = data.title;
        document.getElementById('caseDescription').textContent = data.description;
    }

    // --- Form Submission ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const updateData = {
            Id: caseId,
            CaseNumber: formData.get('CaseNumber'),
            JudgeId: formData.get('JudgeId'),
            Status: parseInt(formData.get('Status'), 10)
        };

        console.log('Submitting Case Update:', updateData);

        // Placeholder for API call to update the case
        // fetch(`https://localhost:7020/api/v1.0/Cases/${caseId}`, {
        //     method: 'PUT', // or PATCH
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //     body: JSON.stringify(updateData)
        // })
        // .then(res => res.json()).then(result => { ... });

        Swal.fire({
            icon: 'success',
            title: 'Case Filed!',
            text: `Case number ${updateData.CaseNumber} has been successfully filed.`,
            timer: 3000,
            showConfirmButton: false
        });

        setTimeout(() => {
            window.location.href = '/Dashboard/Lawyer.html';
        }, 3000);
    });

    // --- Logout Functionality ---
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    // --- Initial Page Load ---
    fetchCaseDetails();
    populateJudges();
});
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const loadingContainer = document.getElementById('loading-container');
    const reviewContainer = document.getElementById('review-container');
    const verificationForm = document.getElementById('verification-form');
    const approvalStatusSelect = document.getElementById('approvalStatus');
    const approvalFields = document.getElementById('approval-fields');
    const rejectionFields = document.getElementById('rejection-fields');
    const judgeSelect = document.getElementById('judgeId');

    if (!token || userRole !== 'Registrar' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');

    if (!caseId) {
        loadingContainer.innerHTML = '<p class="text-red-500 text-center">Error: No Case ID provided in URL.</p>';
        return;
    }

    async function fetchCaseDetails() {
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Cases/${caseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch case details.');
            const result = await response.json();
            if (result.isSuccess && result.data) {
                await populateCaseDetails(result.data);
            } else {
                throw new Error(result.message || 'Could not load case data.');
            }
        } catch (error) {
            loadingContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        } finally {
            loadingContainer.classList.add('hidden');
            reviewContainer.classList.remove('hidden');
        }
    }

    async function populateCaseDetails(caseData) {
        document.getElementById('case-title').textContent = caseData.title;
        document.getElementById('case-number').textContent = caseData.caseNumber || 'N/A';
        document.getElementById('case-description').textContent = caseData.description;

        // Fetch and display client and lawyer names
        const [client, lawyer] = await Promise.all([
            fetchUserDetails(caseData.clientId),
            fetchUserDetails(caseData.lawyerId)
        ]);

        const lawyerName = await getLawyer(caseData.lawyerId)
        document.getElementById('client-name').textContent = client ? `${client.firstName} ${client.lastName}` : 'Unknown';
        document.getElementById('lawyer-name').textContent = lawyerName ? `Barr. ${lawyerName.data.firstName} ${lawyerName.data.lastName}` : 'Unknown';

        // Fetch and display documents
        if (caseData.documentIds && caseData.documentIds.length > 0) {
            const docList = document.getElementById('document-list');
            docList.innerHTML = '';
            for (const docId of caseData.documentIds) {
                const doc = await fetchDocumentDetails(docId);
                if (doc) {
                    const docLink = document.createElement('a');
                    docLink.href = `https://localhost:7020/${doc.fileUrl}`;
                    docLink.textContent = doc.fileName || 'View Document';
                    docLink.target = '_blank';
                    docLink.className = 'text-[var(--js-primary)] hover:underline block';
                    docList.appendChild(docLink);
                }
            }
        } else {
            document.getElementById('document-list').textContent = 'No documents attached.';
        }
    }

    async function fetchUserDetails(userId) {
        if (!userId) return null;
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null;
            const result = await response.json();
            return result.isSuccess ? result.data : null;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
        }
    }

    async function fetchDocumentDetails(docId) {
        if (!docId) return null;
        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Documents/${docId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null;
            const result = await response.json();
            return result.isSuccess ? result.data : null;
        } catch (error) {
            console.error(`Error fetching document ${docId}:`, error);
            return null;
        }
    }

    async function populateJudges() {
        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Judges', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch judges.');
            const result = await response.json();
            if (result.isSuccess && result.data) {
                judgeSelect.innerHTML = '<option value="" disabled selected>Select a judge</option>';
                result.data.forEach(judge => {
                    const option = document.createElement('option');
                    option.value = judge.userId;
                    option.textContent = `Hon. Justice ${judge.firstName} ${judge.lastName}`;
                    judgeSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating judges:', error);
            judgeSelect.innerHTML = '<option value="">Error loading judges</option>';
        }
    }

    approvalStatusSelect.addEventListener('change', (e) => {
        const selection = e.target.value;
        approvalFields.classList.toggle('hidden', selection !== '0');
        rejectionFields.classList.toggle('hidden', selection !== '1');
    });

    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(verificationForm);
        const requestData = {
            caseId: caseId,
            approvalStatus: parseInt(formData.get('ApprovalStatus') === 1 ? 2 : 1, 10),
            rejectionReason: formData.get('RejectionReason') || "null",
            scheduleDate: formData.get('ScheduleDate') || null
        };

        // Add JudgeId if approving
        if (requestData.ApprovalStatus === 0) {
            const judgeId = formData.get('JudgeId');
            if (judgeId) {
                // The assign endpoint seems separate, let's use the verify endpoint as requested.
                // The DTO needs to be adjusted in backend to accept JudgeId if this is the flow.
                // For now, we'll stick to the provided DTO.
            }
        }

        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Cases/verify', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (!response.ok || !result.isSuccess) {
                throw new Error(result.message || 'Failed to submit decision.');
            }

            await Swal.fire('Success', 'The case status has been updated.', 'success');
            window.location.href = '/Roles/Registrar/Registrar.html';

        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    });

     async function getLawyer(id) {
        const res = await fetch(`https://localhost:7020/api/v1.0/Lawyers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }



    fetchCaseDetails();
    populateJudges();
});
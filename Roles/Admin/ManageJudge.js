document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }
    const judgesApiUrl = 'https://localhost:7020/api/v1.0/Judges';
    const courtsApiUrl = 'https://localhost:7020/api/v1.0/Courts';

    const tableBody = document.getElementById('judgesTableBody');
    const addJudgeForm = document.getElementById('addJudgeForm');
    const courtSelect = document.getElementById('courtAssignedId'); // For the "add" form

    const editJudgeSection = document.getElementById('editJudgeSection');
    const editJudgeForm = document.getElementById('editJudgeForm');
    const editJudgeIdField = document.getElementById('editJudgeId');
    const editCourtSelect = document.getElementById('editCourtAssignedId');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    let allJudges = [];
    let allCourts = [];
    function renderJudges(judges) {
        tableBody.innerHTML = '';
        if (!judges || judges.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">No judges found.</td></tr>`;
            return;
        }

        judges.forEach(judge => {
            const fullName = `${judge.firstName || ''} ${judge.middleName || ''} ${judge.lastName || ''}`.replace(/\s+/g, ' ').trim();
            const court = allCourts.find(c => c.id === judge.courtAssignedId);
            const courtName = court ? `${court.name}` : 'N/A';
            const appointmentDate = judge.appointmentDate ? new Date(judge.appointmentDate).toLocaleDateString() : 'N/A';
            
            const isActive = judge.isActive;
            const statusText = isActive ? 'Active' : 'Inactive';
            const statusClass = isActive ? 'text-green-600' : 'text-red-600';

            const row = document.createElement('tr');
            row.className = `border-b hover:bg-gray-50 ${!isActive ? 'bg-red-50 opacity-70' : ''}`;
            row.innerHTML = `
                <td class="px-4 py-2">${fullName}</td>
                <td class="px-4 py-2">${judge.email || 'N/A'}</td>
                <td class="px-4 py-2">${judge.phoneNumber || 'N/A'}</td>
                <td class="px-4 py-2">${courtName}</td>
                <td class="px-4 py-2">${appointmentDate}</td>
                <td class="px-4 py-2 text-center">
                    <span class="font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-2 text-center">
                    <button class="edit-btn bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed" data-id="${judge.id}" ${!isActive ? 'disabled' : ''}>Edit</button>
                    <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed" data-id="${judge.id}" ${!isActive ? 'disabled' : ''}>Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    async function fetchAndPopulateCourts() {
        try {
            const response = await fetch(courtsApiUrl,{
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            allCourts = result.data || [];
            
            editCourtSelect.innerHTML = '<option value="">Select a court</option>';

            allCourts.filter(c => c.isActive).forEach(court => {
                const option = document.createElement('option');
                option.value = court.id;
                option.textContent = `${court.name} ${court.state}`;
                
                editCourtSelect.appendChild(option.cloneNode(true));
            });
        } catch (error) {
            console.error('Failed to fetch courts:', error);
            courtSelect.innerHTML = '<option value="">Error loading courts</option>';
            editCourtSelect.innerHTML = '<option value="">Error loading courts</option>';
        }
    }

    async function fetchJudges() {
        try {
            const response = await fetch(`${judgesApiUrl}`,{
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            allJudges = result.data || [];
            renderJudges(allJudges);
        } catch (error) {
            console.error('Failed to fetch judges:', error);
            Swal.fire('Error', 'Could not fetch judges from the server.', 'error');
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Error loading judges.</td></tr>`;
        }
    }

    async function handleAddFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(addJudgeForm);

        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Judges', { 
                method: 'POST', 
                body: formData 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to create judge.`);
            }

            Swal.fire('Success', `Judge successfully created!`, 'success');
            addJudgeForm.reset();
            fetchJudges(); // Refresh the list

        } catch (error) {
            console.error('Error creating judge:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }

    /**
     * Handles the form submission for updating a judge.
     * @param {Event} e - The form submission event.
     */
    async function handleEditFormSubmit(e) {
        e.preventDefault();
        const judgeId = editJudgeIdField.value;
        if (!judgeId) return;

        const updateData = {
            courtAssignedId: document.getElementById('editCourtAssignedId').value,
            appointmentDate: document.getElementById('editAppointmentDate').value || null
        };

        try {
            const response = await fetch(`https://localhost:7020/api/v1.0/Judges/${judgeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update judge.');
            }

            Swal.fire('Success', 'Judge successfully updated!', 'success');
            editJudgeSection.classList.add('hidden');
            editJudgeForm.reset();
            fetchJudges(); // Refresh the list

        } catch (error) {
            console.error('Error saving judge:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }

    /**
     * Handles clicks on the table, delegating to edit or delete functions.
     * @param {Event} e - The click event.
     */
    function handleTableClick(e) {
        const target = e.target;
        const judgeId = target.dataset.id;

        if (target.classList.contains('edit-btn') && judgeId) {
            const judgeToEdit = allJudges.find(j => j.id == judgeId);
            if (judgeToEdit) {
                // Populate the edit form
                editJudgeIdField.value = judgeToEdit.id;
                document.getElementById('editCourtAssignedId').value = judgeToEdit.courtAssignedId;
                document.getElementById('editAppointmentDate').value = judgeToEdit.appointmentDate ? judgeToEdit.appointmentDate.split('T')[0] : '';

                // Update edit form title and show the section
                const fullName = `${judgeToEdit.firstName || ''} ${judgeToEdit.lastName || ''}`.trim();
                document.getElementById('editFormTitle').textContent = `Editing: ${fullName}`;
                editJudgeSection.classList.remove('hidden');
            }
        }

        if (target.classList.contains('delete-btn') && judgeId) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`https://localhost:7020/api/v1.0/Judges/${judgeId}`, {
                             method: 'DELETE' 
                            });
                        if (!response.ok) throw new Error('Failed to delete judge.');
                        Swal.fire('Deleted!', 'The judge has been removed.', 'success');
                        fetchJudges(); // Refresh the list
                    } catch (error) {
                        console.error('Error deleting judge:', error);
                        Swal.fire('Error', 'Could not delete the judge.', 'error');
                    }
                }
            });
        }
    }

    // --- Event Listeners ---
    //addJudgeForm.addEventListener('submit', handleAddFormSubmit);
    editJudgeForm.addEventListener('submit', handleEditFormSubmit);
    tableBody.addEventListener('click', handleTableClick);
    cancelEditBtn.addEventListener('click', () => {
        editJudgeSection.classList.add('hidden');
        editJudgeForm.reset();
    });

    // --- Initial Load ---
    async function initializePage() {
        await fetchAndPopulateCourts();
        await fetchJudges();
    }
    initializePage();
});
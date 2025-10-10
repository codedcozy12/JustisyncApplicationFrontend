document.addEventListener('DOMContentLoaded', function () {
    const registrarsApiUrl = 'https://localhost:7020/api/v1.0/Registrars';
    const courtsApiUrl = 'https://localhost:7020/api/v1.0/Courts';

    const tableBody = document.getElementById('registrarsTableBody');

    const editRegistrarSection = document.getElementById('editRegistrarSection');
    const editRegistrarForm = document.getElementById('editRegistrarForm');
    const editRegistrarIdField = document.getElementById('editRegistrarId');
    const editCourtSelect = document.getElementById('editCourtId');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    let allRegistrars = [];
    let allCourts = [];

    function renderRegistrars(registrars) {
        tableBody.innerHTML = '';
        if (!registrars || registrars.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No registrars found.</td></tr>`;
            return;
        }

        registrars.forEach(registrar => {
            const fullName = `${registrar.firstName || ''} ${registrar.middleName || ''} ${registrar.lastName || ''}`.trim();
            const court = allCourts.find(c => c.id === registrar.courtId);
            const courtName = court ? `${court.name}, ${court.city}` : 'N/A';

            // Determine status based on the isActive property from the API
            const isActive = registrar.isActive;
            const statusText = isActive ? 'Active' : 'Inactive';
            const statusClass = isActive ? 'text-green-600' : 'text-red-600';

            const row = document.createElement('tr');
            row.className = `border-b hover:bg-gray-50 ${!isActive ? 'bg-red-50 opacity-70' : ''}`;
            row.innerHTML = `
                <td class="px-4 py-2">${fullName}</td>
                <td class="px-4 py-2">${registrar.email || 'N/A'}</td>
                <td class="px-4 py-2">${registrar.phoneNumber || 'N/A'}</td>
                <td class="px-4 py-2">${courtName}</td>
                <td class="px-4 py-2">
                    <span class="font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-2 text-center">
                    <a href="RegistrarDetails.html?id=${registrar.id}" class="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-blue-600">View</a>
                    <button class="edit-btn bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed" data-id="${registrar.id}" ${!isActive ? 'disabled' : ''}>Edit</button>
                    <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed" data-id="${registrar.id}" ${!isActive ? 'disabled' : ''}>Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function fetchAndPopulateCourts() {
        try {
            const response = await fetch(courtsApiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            allCourts = result.data || [];

            editCourtSelect.innerHTML = '<option value="">Select a court</option>';

            allCourts.filter(c => c.isActive).forEach(court => {
                const option = document.createElement('option');
                option.value = court.id;
                option.textContent = `${court.name} - ${court.city}, ${court.state}`;
                editCourtSelect.appendChild(option.cloneNode(true));
            });
        } catch (error) {
            console.error('Failed to fetch courts:', error);
            editCourtSelect.innerHTML = '<option value="">Error loading courts</option>';
        }
    }

    async function fetchRegistrars() {
        try {
            // Fetch all registrars, including deleted ones, to show their status
            const response = await fetch(`${registrarsApiUrl}?includeDeleted=true`);
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            allRegistrars = result.data || []; // The API returns an array of registrars in the 'data' property
            renderRegistrars(allRegistrars);
        } catch (error) {
            console.error('Failed to fetch registrars:', error);
            Swal.fire('Error', 'Could not fetch registrars from the server.', 'error');
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Error loading registrars.</td></tr>`;
        }
    }

    async function handleEditFormSubmit(e) {
        e.preventDefault();
        const registrarId = editRegistrarIdField.value;
        if (!registrarId)
             return;

        const updateData = { courtId: document.getElementById('editCourtId').value };

        try {
            const response = await fetch(`${registrarsApiUrl}/${registrarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update registrar.');
            }
            Swal.fire('Success', 'Registrar successfully updated!', 'success');
            editRegistrarSection.classList.add('hidden');
            editRegistrarForm.reset();
            fetchRegistrars();
        } catch (error) {
            console.error('Error saving registrar:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }

    function handleTableClick(e) {
        const target = e.target;
        const registrarId = target.dataset.id;

        if (target.classList.contains('edit-btn') && registrarId) {
            const registrarToEdit = allRegistrars.find(r => r.id == registrarId);
            if (registrarToEdit) {
                editRegistrarIdField.value = registrarToEdit.id;
                document.getElementById('editCourtId').value = registrarToEdit.courtId;
                const fullName = `${registrarToEdit.firstName || ''} ${registrarToEdit.lastName || ''}`.trim();
                document.getElementById('editFormTitle').textContent = `Editing: ${fullName}`;
                editRegistrarSection.classList.remove('hidden');
            }
        }

        if (target.classList.contains('delete-btn') && registrarId) {
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
                        const response = await fetch(`https://localhost:7020/api/v1.0/Registrars/${registrarId}`, { 
                            method: 'DELETE' 
                        });
                        if (!response.ok) throw new Error('Failed to delete registrar.');
                        Swal.fire('Deleted!', 'The registrar has been removed.', 'success');
                        fetchRegistrars();
                    } catch (error) {
                        console.error('Error deleting registrar:', error);
                        Swal.fire('Error', 'Could not delete the registrar.', 'error');
                    }
                }
            });
        }
    }

    editRegistrarForm.addEventListener('submit', handleEditFormSubmit);
    tableBody.addEventListener('click', handleTableClick);
    cancelEditBtn.addEventListener('click', () => {
        editRegistrarSection.classList.add('hidden');
        editRegistrarForm.reset();
    });

    async function initializePage() {
        await fetchAndPopulateCourts();
        await fetchRegistrars();
    }
    initializePage();
});
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    const jurisdictionsApiUrl = 'https://localhost:7020/api/v1.0/Jurisdictions';

    // Form and Table elements
    const addForm = document.getElementById('addJurisdictionForm');
    const tableBody = document.getElementById('jurisdictionsTableBody');

    // Edit Section elements
    const editSection = document.getElementById('editJurisdictionSection');
    const editForm = document.getElementById('editJurisdictionForm');
    const cancelEditBtn = document.getElementById('cancelEdit');

    let allJurisdictions = [];

    // --- DATA FETCHING ---

    async function fetchJurisdictions() {
        try {
            const response = await fetch(jurisdictionsApiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch jurisdictions');
            const result = await response.json();
            allJurisdictions = Array.isArray(result) ? result : [];
            renderJurisdictions(allJurisdictions);
        } catch (error) {
            console.error('Error fetching jurisdictions:', error);
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 py-4">Error loading jurisdictions.</td></tr>`;
        }
    }

    // --- RENDERING ---

    function renderJurisdictions(jurisdictions) {
        tableBody.innerHTML = '';
        if (!jurisdictions || jurisdictions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">No jurisdictions found.</td></tr>`;
            return;
        }

        jurisdictions.forEach(jurisdiction => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3">${jurisdiction.data.subjectMatter}</td>
                <td class="px-4 py-3">${jurisdiction.data.monetaryLimit ? `$${Number(jurisdiction.data.monetaryLimit).toLocaleString()}` : 'N/A'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="edit-btn bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600" data-id="${jurisdiction.data.id}">Edit</button>
                    <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600" data-id="${jurisdiction.data.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- EVENT HANDLERS ---

    addForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(addForm);
        const requestData = {
            subjectMatter: formData.get('SubjectMatter'),
            monetaryLimit: formData.get('MonetaryLimit') || null,
        };

        try {
            const response = await fetch(jurisdictionsApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (!response.ok || !result.isSuccess) {
                throw new Error(result.message || 'Failed to add jurisdiction');
            }

            addForm.reset();
            fetchJurisdictions();
            Swal.fire('Success!', 'Jurisdiction added successfully!', 'success');
        } catch (error) {
            Swal.fire('Error!', error.message, 'error');
        }
    });

    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('editJurisdictionId').value;
        if (!id) return;

        const updateData = {
            id: id,
            subjectMatter: document.getElementById('editSubjectMatter').value,
            monetaryLimit: document.getElementById('editMonetaryLimit').value || null,
        };

        try {
            const response = await fetch(`${jurisdictionsApiUrl}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: 'Failed to update jurisdiction' }));
                throw new Error(errorResult.message || 'Failed to update jurisdiction');
            }

            editSection.classList.add('hidden');
            fetchJurisdictions();
            Swal.fire('Updated!', 'Jurisdiction updated successfully!', 'success');
        } catch (error) {
            Swal.fire('Error!', error.message, 'error');
        }
    });

    tableBody.addEventListener('click', function (e) {
        const target = e.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn') && id) {
            const jurisdiction = allJurisdictions.find(j => j.id === id);
            if (jurisdiction) {
                document.getElementById('editJurisdictionId').value = jurisdiction.id;
                document.getElementById('editSubjectMatter').value = jurisdiction.subjectMatter;
                document.getElementById('editMonetaryLimit').value = jurisdiction.monetaryLimit || '';

                editSection.classList.remove('hidden');
            }
        }

        if (target.classList.contains('delete-btn') && id) {
            Swal.fire({
                title: 'Are you sure?',
                text: "This action cannot be undone!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`${jurisdictionsApiUrl}/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        // A successful DELETE often returns 204 No Content, so we check response.ok
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(errorText || 'Failed to delete jurisdiction');
                        }

                        fetchJurisdictions();
                        Swal.fire('Deleted!', 'The jurisdiction has been removed.', 'success');
                    } catch (error) {
                        Swal.fire('Error!', error.message, 'error');
                    }
                }
            });
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editSection.classList.add('hidden');
        editForm.reset();
    });

    // --- INITIALIZATION ---

    async function initializePage() {
        await fetchJurisdictions();
    }

    initializePage();
});
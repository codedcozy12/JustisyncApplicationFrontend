document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/LoginPage/Login.html';
    return;
  }

  const courtsApiUrl = 'https://localhost:7020/api/v1.0/Courts';
  const jurisdictionsApiUrl = 'https://localhost:7020/api/v1.0/Jurisdictions';

  const addCourtForm = document.getElementById('courtForm');
  const courtsTableBody = document.querySelector('tbody');
  const jurisdictionSelect = document.getElementById('jurisdictionSelect');
  const editJurisdictionSelect = document.getElementById('editJurisdictionSelect');

  const editSection = document.getElementById('editCourtSection');
  const editForm = document.getElementById('editCourtForm');
  const cancelEditBtn = document.getElementById('cancelEditCourt');

  let courts = [];

  async function fetchJurisdictions() {
    try {
      const response = await fetch(jurisdictionsApiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch jurisdictions');
      const result = await response.json();
      if (Array.isArray(result)) {
        jurisdictionSelect.innerHTML = '';
        editJurisdictionSelect.innerHTML = '';
        result.forEach(j => {
          const option = document.createElement('option');
          option.value = j.data.id;
          option.textContent = `${j.data.subjectMatter} \nMonetary Limit: ${j.data.monetaryLimit}`;
          jurisdictionSelect.appendChild(option);
          editJurisdictionSelect.appendChild(option.cloneNode(true)); // Also add to edit form select
        });
      }
    } catch (error) {
      console.error('Error fetching jurisdictions:', error);
      jurisdictionSelect.innerHTML = `<option value="">Error loading jurisdictions</option>`;
      editJurisdictionSelect.innerHTML = `<option value="">Error loading jurisdictions</option>`;
    }
  }

  function renderCourts(courtsData) {
    courtsTableBody.innerHTML = '';
    if (!courtsData || courtsData.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="9" class="px-4 py-2 text-center text-gray-500">No courts found.</td>`;
      courtsTableBody.appendChild(row);
      return;
    }
    courtsData.forEach(court => {
      const jurisdictionsText = court.jurisdictions && court.jurisdictions.length > 0
        ? court.jurisdictions.map(j => j.subjectMatter).join(', ')
        : 'N/A';

      const row = document.createElement('tr');
      row.className = `border-b hover:bg-gray-50 ${!court.isActive ? 'bg-red-50 opacity-70' : ''}`;
      row.innerHTML = `
        <td class="px-4 py-2">${court.name || ''}</td>
        <td class="px-4 py-2">${court.type || ''}</td>
        <td class="px-4 py-2">${court.address || ''}</td>
        <td class="px-4 py-2">${court.city || ''}</td>
        <td class="px-4 py-2">${court.state || ''}</td>
        <td class="px-4 py-2">${court.contactEmail || 'N/A'}</td>
        <td class="px-4 py-2">${court.contactPhone || 'N/A'}</td>
        <td class="px-4 py-2">${jurisdictionsText}</td>
        <td class="px-4 py-2 text-center font-semibold ${court.isActive ? 'text-green-600' : 'text-red-600'}">${court.isActive ? 'Active' : 'Inactive'}</td>
        <td class="px-4 py-2 text-center">
          <button class="edit-btn bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600" data-id="${court.id}">Edit</button>
          <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600" data-id="${court.id}">Delete</button>
        </td>
      `;
      courtsTableBody.appendChild(row);
    });
  }

  async function fetchCourts() {
    try {
      const response = await fetch(courtsApiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch courts');
      const result = await response.json();
      courts = result.isSuccess && Array.isArray(result.data) ? result.data : [];
      renderCourts(courts);
    } catch (error) {
      console.error('Error fetching courts:', error);
      courtsTableBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500 py-4">Error loading courts.</td></tr>`;
    }
  }

  addCourtForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(addCourtForm);
    try {
      const response = await fetch(courtsApiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.isSuccess) {
        throw new Error(result.message || 'Failed to add court');
      }

      addCourtForm.reset();
      fetchCourts();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Court added successfully!'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message
      });
    }
  });

  editForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editCourtId').value;
    if (!id) return;

    const updateData = {
      contactEmail: document.getElementById('editCourtEmail').value,
      contactPhone: document.getElementById('editCourtPhone').value,
      jurisdictionIds: Array.from(editJurisdictionSelect.selectedOptions).map(option => option.value)
    };

    try {
      const response = await fetch(`${courtsApiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ message: 'Failed to update court' }));
        throw new Error(errorResult.message || 'Failed to update court');
      }

      editSection.classList.add('hidden');
      editForm.reset();
      fetchCourts();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Court updated successfully!'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message
      });
    }
  });

  courtsTableBody.addEventListener('click', async function (e) {
    const target = e.target;
    const courtId = target.dataset.id;

    if (target.classList.contains('delete-btn') && courtId) {
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
            const response = await fetch(`${courtsApiUrl}/${courtId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Failed to delete court');
            }
            fetchCourts();
            Swal.fire(
              'Deleted!',
              'The court has been removed.',
              'success'
            );
          } catch (error) {
            Swal.fire('Error!', error.message, 'error');
          }
        }
      });
    }

    if (target.classList.contains('edit-btn') && courtId) {
      const court = courts.find(c => c.id === courtId);
      if (court) {
        document.getElementById('editCourtId').value = court.id;
        document.getElementById('editCourtEmail').value = court.contactEmail || '';
        document.getElementById('editCourtPhone').value = court.contactPhone || '';

        const currentJurisdictionIds = court.jurisdictions.map(j => j.id);
        Array.from(editJurisdictionSelect.options).forEach(option => {
          if (currentJurisdictionIds.includes(option.value)) {
            option.selected = true;
          } else {
            option.selected = false;
          }
        });
        editSection.classList.remove('hidden');
        window.scrollTo({ top: editSection.offsetTop, behavior: 'smooth' });
      }
    }
  });

  cancelEditBtn.addEventListener('click', () => {
    editSection.classList.add('hidden');
    editForm.reset();
  });

  async function initializePage() {
    await fetchJurisdictions();
    await fetchCourts();
  }

  initializePage();
});
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

  const editSection = document.getElementById('editCourtSection');
  const editForm = document.getElementById('editCourtForm');
  const cancelEditBtn = document.getElementById('cancelEditCourt');

  let courts = [];

  // --- DATA FETCHING & RENDERING ---

  async function fetchJurisdictions() {
    try {
      const response = await fetch(jurisdictionsApiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch jurisdictions');
      const result = await response.json();
      if (result.isSuccess && Array.isArray(result.data)) {
        jurisdictionSelect.innerHTML = '';
        result.data.forEach(j => {
          const option = document.createElement('option');
          option.value = j.id;
          option.textContent = j.name;
          jurisdictionSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching jurisdictions:', error);
      jurisdictionSelect.innerHTML = `<option value="">Error loading jurisdictions</option>`;
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
        ? court.jurisdictions.map(j => j.name).join(', ')
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

  // --- FORM SUBMISSIONS & EVENT HANDLERS ---

  addCourtForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(addCourtForm);

    // The backend expects 'JurisdictionIds' for a list of Guids.
    // FormData handles multiple selections with the same name correctly.
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
      alert('Court added successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });

  editForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('editCourtId').value;
    if (!id) return;

    // Matches CourtUpdateRequestDto
    const updateData = {
      contactEmail: document.getElementById('editCourtEmail').value,
      contactPhone: document.getElementById('editCourtPhone').value,
      isActive: document.getElementById('editCourtIsActive').value === 'true'
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

      const result = await response.json();
      if (!response.ok || !result.isSuccess) {
        throw new Error(result.message || 'Failed to update court');
      }

      editSection.classList.add('hidden');
      editForm.reset();
      fetchCourts(); // Refresh the list
      alert('Court updated successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });

  courtsTableBody.addEventListener('click', async function (e) {
    const target = e.target;
    const courtId = target.dataset.id;

    if (target.classList.contains('delete-btn') && courtId) {
      if (confirm('Are you sure you want to delete this court?')) {
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
          alert('Court deleted successfully.');
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }
    }

    if (target.classList.contains('edit-btn') && courtId) {
      const court = courts.find(c => c.id === courtId);
      if (court) {
        document.getElementById('editCourtId').value = court.id;
        document.getElementById('editCourtEmail').value = court.contactEmail || '';
        document.getElementById('editCourtPhone').value = court.contactPhone || '';
        document.getElementById('editCourtIsActive').value = String(court.isActive);

        editSection.classList.remove('hidden');
        window.scrollTo({ top: editSection.offsetTop, behavior: 'smooth' });
      }
    }
  });

  cancelEditBtn.addEventListener('click', () => {
    editSection.classList.add('hidden');
    editForm.reset();
  });

  // --- INITIALIZATION ---
  async function initializePage() {
    await fetchJurisdictions();
    await fetchCourts();
  }

  initializePage();
});
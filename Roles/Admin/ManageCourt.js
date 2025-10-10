document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const form = document.querySelector('form');
  console.log(form);
  const form2 = document.getElementById('courtForm');
  console.log(form2)
  const courtsTableBody = document.querySelector('tbody');
  let courts = [];

  const jurisdictionMap = {
    0: 'Federal',
    1: 'State',
    2: 'Local',
    3: 'Customary',
    4: 'Sharia'
  };

  function renderCourts() {
    courtsTableBody.innerHTML = '';
    if (courts.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="9" class="px-4 py-2 text-center text-gray-500">No courts found.</td>`;
      courtsTableBody.appendChild(row);
      return;
    }
    courts.forEach((court, idx) => {
      const row = document.createElement('tr');
      row.className = "border-b";
      row.innerHTML = `
        <td class="px-4 py-2">${court.name || ''}</td>
        <td class="px-4 py-2">${court.type || ''}</td>
        <td class="px-4 py-2">${court.address || ''}</td>
        <td class="px-4 py-2">${court.city || ''}</td>
        <td class="px-4 py-2">${court.state || ''}</td>
        <td class="px-4 py-2">${court.contactEmail || ''}</td>
        <td class="px-4 py-2">${court.contactPhone || ''}</td>
        <td class="px-4 py-2">${jurisdictionMap[court.jurisdiction] || 'N/A'}</td>
        <td class="px-4 py-2 text-center">${court.isActive ? 'Yes' : 'No'}</td>
        <td class="px-4 py-2 text-center">
          <button class="bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600" data-edit="${idx}">Edit</button>
          <button class="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600" data-delete="${idx}">Delete</button>
        </td>
      `;
      courtsTableBody.appendChild(row);
    });
  }

  function fetchCourts() {
    fetch('https://localhost:7020/api/v1.0/Courts', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        courts = Array.isArray(data.data) ? data.data : [];
        renderCourts();
      })
      .catch(() => {
        courts = [];
        renderCourts();
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('Form submitted');
    const inputs = form.querySelectorAll('input, select');
    const formData = new FormData();
    formData.append('Name', inputs[0].value);
    formData.append('Type', inputs[1].value);
    formData.append('Address', inputs[2].value);
    formData.append('City', inputs[3].value);
    formData.append('State', inputs[4].value);
    formData.append('ContactEmail', inputs[5].value);
    formData.append('ContactPhone', inputs[6].value);
    formData.append('Jurisdiction', inputs[7].value);
    console.log('Submitting data:', formData);

    fetch('https://localhost:7020/api/v1.0/Courts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add court');
      return res.json();
    })
    .then(() => {
      form.reset();
      fetchCourts();
      alert('Court added successfully!');
    })
    .catch(err => {
      alert('Error: ' + err.message);
    });
  });

  courtsTableBody.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-delete')) {
      const idx = e.target.getAttribute('data-delete');
      const court = courts[idx];
      if (court && court.id) {
        fetch(`https://localhost:7020/api/v1.0/Courts/${court.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete court');
          fetchCourts();
        })
        .catch(err => alert('Error: ' + err.message));
      }
    }
    if (e.target.hasAttribute('data-edit')) {
      const idx = e.target.getAttribute('data-edit');
      const court = courts[idx];
        if (court) {
            const inputs = form.querySelectorAll('input, select');
            inputs[5].value = court.contactEmail || '';
            inputs[6].value = court.contactPhone || '';
            inputs[7].value = court.jurisdiction || '';
        }
    }
  });

  const editSection = document.getElementById('editCourtSection');
  const editForm = document.getElementById('editCourtForm');
  const cancelEditBtn = document.getElementById('cancelEditCourt');

  courtsTableBody.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-edit')) {
      const idx = e.target.getAttribute('data-edit');
      const court = courts[idx];
      if (court) {
        document.getElementById('editCourtId').value = court.id || '';
        document.getElementById('editCourtEmail').value = court.contactEmail || '';
        document.getElementById('editCourtPhone').value = court.contactPhone || '';
        document.getElementById('editCourtJurisdiction').value = court.jurisdiction !== undefined ? String(court.jurisdiction) : '';
        document.getElementById('editCourtIsActive').value = String(court.isActive);
        editSection.classList.remove('hidden');
        window.scrollTo({ top: editSection.offsetTop, behavior: 'smooth' });
      }
    }
  });

  cancelEditBtn.addEventListener('click', function () {
    editSection.classList.add('hidden');
    editForm.reset();
  });

  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('editCourtId').value;
    const data = {
      contactEmail: document.getElementById('editCourtEmail').value,
      contactPhone: document.getElementById('editCourtPhone').value,
      jurisdiction: parseInt(document.getElementById('editCourtJurisdiction').value, 10),
      isActive: document.getElementById('editCourtIsActive').value === 'true'
    };
    fetch(`https://localhost:7020/api/v1.0/Courts/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update court');
      return res.json();
    })
    .then(() => {
      editSection.classList.add('hidden');
      editForm.reset();
      location.reload();
    })
    .catch(err => {
      alert('Error: ' + err.message);
    });
  });

  fetchCourts();
});
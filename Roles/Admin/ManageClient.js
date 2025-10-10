document.addEventListener('DOMContentLoaded', function () {
  const apiUrl = 'https://localhost:7020/api/v1.0/Users/all?PageNumber=1&PageSize=10';
  const tableBody = document.querySelector('#manageClientsModal table tbody');
  let clients = [];

  if (!tableBody) return;

  function renderClients(list) {
    tableBody.innerHTML = '';
    if (!list.length) {
      const row = document.createElement('tr'); 
      row.innerHTML = `<td colspan="6" class="text-center py-2 text-gray-500">No clients found.</td>`;
      tableBody.appendChild(row);
      return;
    }
    list.forEach((client, idx) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-2 py-1">${client.firstName || ''} ${client.lastName || ''}</td>
        <td class="px-2 py-1">${client.email || ''}</td>
        <td class="px-2 py-1">${client.phoneNumber || ''}</td>
        <td class="px-2 py-1">${client.isEmailConfirmed ? 'Active' : 'Pending'}</td>
        <td class="px-2 py-1">
          <a href="ClientDetails.html?id=${client.id}" class="view-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">View</a>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  function fetchClients() {
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        const allUsers = Array.isArray(data.data.items) ? data.data.items : [];
        console.log(allUsers);
        clients = allUsers.filter(user => user.role === 1);
        renderClients(clients);
      })
      .catch((error) => {
        clients = [];
        console.error("Failed to fetch clients:", error);
        renderClients(clients);
      });
  }

  fetchClients();
});
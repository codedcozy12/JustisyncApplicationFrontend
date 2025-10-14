document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const form = document.getElementById('file-case-form');
    const lawyerSelect = document.getElementById('lawyerId');
    const partiesContainer = document.getElementById('parties-container');
    const addPartyBtn = document.getElementById('add-party-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (!token || userRole !== 'Client' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    async function populateLawyers() {
        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Lawyers/verified', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch lawyers.');
            const result = await response.json();
            if (result.isSuccess && result.data) {
                lawyerSelect.innerHTML = '<option value="" disabled selected>Select a lawyer</option>';
                result.data.forEach(lawyer => {
                    const option = document.createElement('option');
                    option.value = lawyer.id;
                    option.textContent = `Barr. ${lawyer.firstName} ${lawyer.lastName}`;
                    lawyerSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating lawyers:', error);
            lawyerSelect.innerHTML = '<option value="">Error loading lawyers</option>';
        }
    }

    function addPartyForm() {
        const partyId = Date.now(); // Unique ID for the party group
        const partyFormHtml = `
            <div class="party-form-group border-t pt-4 mt-4" data-party-id="${partyId}">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold text-gray-600">New Party</h4>
                    <button type="button" class="remove-party-btn text-sm font-medium text-red-600 hover:text-red-800" data-remove-id="${partyId}">&times; Remove</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="party-fullName" placeholder="Full Name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <select name="party-role" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        <option value="" disabled selected>Select Role</option>
                        <option value="0">Plaintiff</option>
                        <option value="1">Defendant</option>
                        <option value="2">Witness</option>
                        <option value="3">Third Party</option>
                    </select>
                    <input type="text" name="party-address" placeholder="Address" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <input type="text" name="party-contact" placeholder="Contact Number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <input type="email" name="party-email" placeholder="Email (Optional)" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 md:col-span-2">
                </div>
            </div>
        `;
        partiesContainer.insertAdjacentHTML('beforeend', partyFormHtml);
    }

    addPartyBtn.addEventListener('click', addPartyForm);

    partiesContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-party-btn')) {
            const partyIdToRemove = e.target.dataset.removeId;
            const partyGroup = document.querySelector(`.party-form-group[data-party-id="${partyIdToRemove}"]`);
            if (partyGroup) {
                partyGroup.remove();
            }
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const caseData = Object.fromEntries(formData.entries());

        // Process parties
        const parties = [];
        document.querySelectorAll('.party-form-group').forEach(group => {
            parties.push({
                FullName: group.querySelector('[name="party-fullName"]').value,
                Role: parseInt(group.querySelector('[name="party-role"]').value, 10),
                Address: group.querySelector('[name="party-address"]').value,
                Contact: group.querySelector('[name="party-contact"]').value,
                Email: group.querySelector('[name="party-email"]').value || null
            });
        });

        caseData.Parties = parties;
        caseData.ClientId = user.id;
        caseData.Status = 0; // Initiated
        caseData.OffenseType = parseInt(caseData.OffenseType, 10);

        console.log('Submitting Case Data:', caseData);

        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Cases/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(caseData)
            });

            const result = await response.json();
            if (!response.ok || !result.isSuccess) {
                throw new Error(result.message || 'Failed to submit case.');
            }

            Swal.fire({
                icon: 'success',
                title: 'Case Submitted!',
                text: 'Your case has been filed and the lawyer will be notified.',
                timer: 3000,
                showConfirmButton: false
            });

            setTimeout(() => {
                window.location.href = '/Roles/Client/ClientCases.html';
            }, 3000);

        } catch (error) {
            console.error('Error submitting case:', error);
            Swal.fire('Error', error.message, 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    populateLawyers();
});
document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const form = document.getElementById('file-case-form');
    const lawyerSelect = document.getElementById('lawyerId');
    const courtSelect = document.getElementById('courtId');
    const logoutBtn = document.getElementById('logout-btn');

    if (!token || userRole !== 'Client' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    async function populateLawyers() {

        const lawyers = [
            { id: 'lawyer-1', firstName: 'Adekunle', lastName: 'Gold', verificationStatus: 0 },
            { id: 'lawyer-2', firstName: 'Simi', lastName: 'Ogunleye', verificationStatus: 0 },
            { id: 'lawyer-3', firstName: 'Falz', lastName: 'Bahd', verificationStatus: 0 },
            { id: 'lawyer-6', firstName: 'Niniola', lastName: 'Apata', verificationStatus: 1 },
        ];

        const verifiedLawyers = lawyers.filter(l => l.verificationStatus === 0);

        lawyerSelect.innerHTML = '<option value="" disabled selected>Select a lawyer</option>';
        verifiedLawyers.forEach(lawyer => {
            const option = document.createElement('option');
            option.value = lawyer.id;
            option.textContent = `${lawyer.firstName} ${lawyer.lastName}`;
            lawyerSelect.appendChild(option);
        });
    }

    async function populateCourts() {

        const courts = [
            { id: 'court-1', name: 'High Court', city: 'Ikeja', state: 'Lagos', isActive: true },
            { id: 'court-2', name: 'Magistrate Court', city: 'Yaba', state: 'Lagos', isActive: true },
            { id: 'court-3', name: 'Federal High Court', city: 'Abuja', state: 'FCT', isActive: true },
            { id: 'court-4', name: 'Inactive Court', city: 'Ibadan', state: 'Oyo', isActive: false },
        ];

        const activeCourts = courts.filter(c => c.isActive);

        courtSelect.innerHTML = '<option value="" disabled selected>Select a court</option>';
        activeCourts.forEach(court => {
            const option = document.createElement('option');
            option.value = court.id;
            option.textContent = `${court.name} - ${court.city}, ${court.state}`;
            courtSelect.appendChild(option);
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const caseData = Object.fromEntries(formData.entries());

        caseData.ClientId = user.id;

        caseData.Status = 0;

        caseData.OffenseType = parseInt(caseData.OffenseType, 10);

        console.log('Submitting Case Data:', caseData);

        // Placeholder for API call
        // fetch('https://localhost:7020/api/v1.0/Cases', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${token}`
        //     },
        //     body: JSON.stringify(caseData)
        // })
        // .then(res => res.json())
        // .then(result => { ... })
        // .catch(err => { ... });

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
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    populateLawyers();
    populateCourts();
});
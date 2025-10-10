document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const clientNameSpan = document.getElementById('client-name');
    const logoutBtn = document.getElementById('logout-btn');

    if (!token || userRole !== 'Client') {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    function fetchClientInfo() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.firstName) {
            clientNameSpan.textContent = user.firstName;
        } else {
            clientNameSpan.textContent = 'Client';
        }
    }

    function fetchCases() {
        const casesTableBody = document.getElementById('cases-table-body');
        const noCasesMessage = document.getElementById('no-cases-message');
        
        const cases = [
            // Example case object
            // { title: 'Civil Suit...', lawyer: 'Barr. Adekunle Gold', status: 'Discovery', lastUpdate: '2 days ago', id: 1 }
        ];

        if (cases.length === 0) {
        } else {
        }
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    fetchClientInfo();
    fetchCases();
});
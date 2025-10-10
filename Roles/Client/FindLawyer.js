document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const logoutBtn = document.getElementById('logout-btn');
    const lawyersGrid = document.getElementById('lawyers-grid');
    const noLawyersMessage = document.getElementById('no-lawyers-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const searchInput = document.getElementById('search-input');
    const specializationFilter = document.getElementById('specialization-filter');

    if (!token || userRole !== 'Client') {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    const allLawyers = [
        { id: 'lawyer-1', firstName: 'Adekunle', lastName: 'Gold', profilePictureUrl: null, lawyerSpecialization: 1, verificationStatus: 0 },
        { id: 'lawyer-2', firstName: 'Simi', lastName: 'Ogunleye', profilePictureUrl: null, lawyerSpecialization: 2, verificationStatus: 0 },
        { id: 'lawyer-3', firstName: 'Falz', lastName: 'Bahd', profilePictureUrl: null, lawyerSpecialization: 0, verificationStatus: 0 },
        { id: 'lawyer-4', firstName: 'Ric', lastName: 'Hassani', profilePictureUrl: null, lawyerSpecialization: 3, verificationStatus: 0 },
        { id: 'lawyer-5', firstName: 'Teni', lastName: 'Apata', profilePictureUrl: null, lawyerSpecialization: 1, verificationStatus: 0 },
        { id: 'lawyer-6', firstName: 'Niniola', lastName: 'Apata', profilePictureUrl: null, lawyerSpecialization: 2, verificationStatus: 1 }, // Not verified, should be filtered out
    ];

    const specializationMap = {
        0: 'Criminal Law',
        1: 'Civil Law',
        2: 'Family Law',
        3: 'Corporate Law'
    };

    const getFullImageUrl = (url) => {
        const defaultAvatar = '../../assets/Avatar.png';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;

        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };

    function renderLawyers(lawyersToRender) {
        lawyersGrid.innerHTML = '';

        if (lawyersToRender.length === 0) {
            noLawyersMessage.classList.remove('hidden');
        } else {
            noLawyersMessage.classList.add('hidden');
            lawyersToRender.forEach(lawyer => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-sm p-6 text-center transform hover:-translate-y-1 transition-transform duration-300';
                card.innerHTML = `
                    <img class="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-4 border-gray-100" src="${getFullImageUrl(lawyer.profilePictureUrl)}" alt="${lawyer.firstName} ${lawyer.lastName}">
                    <h4 class="text-lg font-semibold text-gray-800">${lawyer.firstName} ${lawyer.lastName}</h4>
                    <p class="text-sm text-gray-500 mb-4">${specializationMap[lawyer.lawyerSpecialization] || 'General Practice'}</p>
                    <a href="#" class="w-full block bg-[var(--js-primary)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
                        View Profile
                    </a>
                `;
                lawyersGrid.appendChild(card);
            });
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedSpec = specializationFilter.value;

        let filteredLawyers = allLawyers.filter(l => l.verificationStatus === 0);

        if (selectedSpec !== 'all') {
            filteredLawyers = filteredLawyers.filter(l => l.lawyerSpecialization == selectedSpec);
        }

        if (searchTerm) {
            filteredLawyers = filteredLawyers.filter(l =>
                `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm)
            );
        }

        renderLawyers(filteredLawyers);
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    searchInput.addEventListener('input', applyFilters);
    specializationFilter.addEventListener('change', applyFilters);

    function initializePage() {
        setTimeout(() => {
            loadingSpinner.classList.add('hidden');
            applyFilters();
        }, 1000);
    }

    initializePage();
});
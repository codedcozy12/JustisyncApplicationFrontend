document.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token && userRole) {
        let redirectPath = '/';

        switch (userRole) {
            case 'Admin':
                redirectPath = '/Roles/Admin/OverviewPage.html';
                break;
            case 'Lawyer':
                redirectPath = '/Dashboard/Lawyer.html';
                break;
            case 'Client':
                redirectPath = '/Dashboard/Client.html';
                break;
            case 'Judge':
                redirectPath = '/Dashboard/Judge.html';
                break;
            default:
                break;
        }

        if (redirectPath !== '/') {
            window.location.href = redirectPath;
        }
    }

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function () {
            navMenu.classList.toggle('hidden');
        });
    }

    const aiNavBtn = document.getElementById('ai-assistant-nav-btn');
    const aiFloatBtn = document.getElementById('ai-assistant-float-btn');

    const showAiPlaceholder = (e) => {
        e.preventDefault();
        alert('The AI Legal Assistant feature is coming soon!');
    };

    if (aiNavBtn) {
        aiNavBtn.addEventListener('click', showAiPlaceholder);
    }
    if (aiFloatBtn) {
        aiFloatBtn.addEventListener('click', showAiPlaceholder);
    }

});
document.addEventListener('DOMContentLoaded', function () {
    // const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user'));

    const form = document.getElementById('profile-form');
    const logoutBtn = document.getElementById('logout-btn');

    if (!token || userRole !== 'Client' || !user) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    const getFullImageUrl = (url) => {
        const defaultAvatar = '../../assets/Avatar.png';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };

    function populateProfileData() {
        if (!user) return;

        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('middleName').value = user.middleName || '';
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('username').value = user.username || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phoneNumber').value = user.phoneNumber || '';

        const avatarPreview = document.getElementById('avatarPreview');
        avatarPreview.src = getFullImageUrl(user.profilePictureUrl);

        const emailStatusEl = document.getElementById('email-status');
        if (user.isEmailConfirmed) {
            emailStatusEl.textContent = 'Verified';
            emailStatusEl.className += ' text-green-600';
        } else {
            emailStatusEl.textContent = 'Not Verified';
            emailStatusEl.className += ' text-red-600';
        }

        const accountStatusMap = { 0: 'Active', 1: 'Inactive', 2: 'Suspended' };
        document.getElementById('accountStatus').value = accountStatusMap[user.accountstatus] || 'Unknown';
    }

    const profilePicInput = document.getElementById('profilePic');
    const avatarPreview = document.getElementById('avatarPreview');
    const fileNameDisplay = document.getElementById('fileName');

    profilePicInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
            fileNameDisplay.textContent = file.name;
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        // e.g., fetch(`https://localhost:7020/api/v1.0/Users/${user.id}`, { method: 'PUT', ... })

        console.log('Updated Profile Data:', Object.fromEntries(formData.entries()));

        Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Your information has been saved successfully.',
            timer: 2000,
            showConfirmButton: false
        });
    });

    document.getElementById('change-password-btn').addEventListener('click', () => {

        Swal.fire('Redirecting...', 'You will be taken to the change password page.', 'info');
        // window.location.href = '/change-password.html';
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/LoginPage/Login.html';
    });

    populateProfileData();
});
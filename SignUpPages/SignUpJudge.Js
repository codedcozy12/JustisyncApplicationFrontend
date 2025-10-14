document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/LoginPage/Login.html';
        return;
    }

    const form = document.getElementById('signupJudgeForm');
    const passwordInput = document.getElementById('password');
    const togglePwdBtn = document.getElementById('togglePwd');
    const courtSelect = document.getElementById('CourtAssignedId');

    if (togglePwdBtn && passwordInput) {
        togglePwdBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    async function populateCourts() {
        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Courts',{
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) {
                throw new Error('Failed to load courts');
            }
            const result = await response.json();
            if (result && result.isSuccess && Array.isArray(result.data)) {
                courtSelect.innerHTML = '<option value="" disabled selected>Select a court</option>'; // Reset
                result.data.filter(court => court.isActive).forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} ${court.state}`;
                    courtSelect.appendChild(option);
                });
            } else {
                 courtSelect.innerHTML = `<option value="" disabled>Could not load courts: ${result.message || ''}</option>`;
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
            courtSelect.innerHTML = '<option value="" disabled>Error loading courts</option>';
        }
    }

    const profilePicInput = document.getElementById('ProfilePictureUrl');
    const ppPreview = document.getElementById('ppPreview');
    profilePicInput.addEventListener('change', function () {
        if (profilePicInput.files.length > 0) {
            const file = profilePicInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                ppPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const password = form.elements['Password'].value;
        const confirmPassword = form.elements['confirmPassword'].value;
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        if (password !== confirmPassword) {
            confirmPasswordError.classList.remove('hidden');
            Swal.fire({
                icon: 'error',
                title: 'Password Mismatch',
                text: 'Your passwords do not match!'
            });
            return;
        } else {
            confirmPasswordError.classList.add('hidden');
        }

        const formData = new FormData(form);

        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Judges', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.isSuccess) {
                throw new Error(result.message || 'An unknown error occurred during signup.');
            }

            Swal.fire({
                icon: 'success',
                title: 'Signup Successful',
                text: 'The judge account has been created! Please ask them to check their email to verify the account.',
                timer: 3000,
                showConfirmButton: false
            });

            localStorage.setItem('pendingEmail', form.elements['Email'].value);
            sessionStorage.removeItem('otp_sent');

            setTimeout(() => {
                window.location.href = "/LoginPage/Login.html";
            }, 3000);

            form.reset();
            ppPreview.src = 'Avatar.png';

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Signup Failed',
                text: error.message
            });
            console.error('Fetch error:', error);
        }
    });

    populateCourts();
});
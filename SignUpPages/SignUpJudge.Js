document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupJudgeForm');
    const passwordInput = document.getElementById('password');
    const togglePwdBtn = document.getElementById('togglePwd');
    const courtSelect = document.getElementById('CourtAssignedId');

    // --- Password Visibility Toggle ---
    if (togglePwdBtn && passwordInput) {
        togglePwdBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    // --- Populate Courts Dropdown ---
    async function populateCourts() {
        try {
            // Using the new 'active' endpoint for efficiency
            const response = await fetch('https://localhost:7020/api/v1.0/Courts/active');
            if (!response.ok) {
                throw new Error('Failed to load courts');
            }
            const result = await response.json();

            // The API returns { isSuccess: bool, data: [...] }
            if (result && result.isSuccess && Array.isArray(result.data)) {
                courtSelect.innerHTML = '<option value="" disabled selected>Select a court</option>'; // Reset
                result.data.forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} - ${court.city}, ${court.state}`;
                    courtSelect.appendChild(option);
                });
            } else {
                 courtSelect.innerHTML = `<option value="" disabled>${result.message || 'Could not load courts'}</option>`;
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
            courtSelect.innerHTML = '<option value="" disabled>Error loading courts</option>';
        }
    }

    // --- Profile Picture Preview ---
    const profilePicInput = document.getElementById('ProfilePictureUrl');
    const ppPreviewWrap = document.getElementById('ppPreviewWrap');
    const ppPreview = document.getElementById('ppPreview');
    const defaultAvatar = 'Avatar.png';

    profilePicInput.addEventListener('change', function () {
        if (profilePicInput.files.length > 0) {
            const file = profilePicInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                ppPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            ppPreview.src = defaultAvatar;
        }
    });

    // --- Form Submission ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Password match check
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

        // API request to the Judges endpoint
        fetch('https://localhost:7020/api/v1.0/Judges', {
            method: 'POST',
            body: formData
        })
        .then(async res => {
            if (!res.ok) {
                // Try to parse a structured error from the backend
                const errorData = await res.json().catch(() => null);
                const message = errorData?.message || `Request failed with status ${res.status}`;
                throw new Error(message);
            }
            return res.json();
        })
        .then(result => {
            if (result && result.isSuccess) {
                Swal.fire({
                    icon: 'success',
                    title: 'Signup Successful',
                    text: 'The judge account has been created! Please have them check their email to verify.',
                    timer: 3000,
                    showConfirmButton: false
                });
                // Store email for OTP verification page
                localStorage.setItem('pendingEmail', form.elements['Email'].value);
                sessionStorage.removeItem('otp_sent');

                setTimeout(() => {
                    window.location.href = "/LoginPage/VerifyOtp.html";
                }, 3000);

                form.reset();
                ppPreview.src = defaultAvatar;
            } else {
                 throw new Error(result.message || 'An unknown error occurred during signup.');
            }
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Signup Failed',
                text: err.message
            });
            console.error('Fetch error:', err);
        });
    });

    // --- Initial Data Load ---
    populateCourts();
});
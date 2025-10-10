document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupRegistrarForm');
    const passwordInput = document.getElementById('password');
    const togglePwdBtn = document.getElementById('togglePwd');
    const courtSelect = document.getElementById('CourtId');
    const defaultAvatar = '../assets/Avatar.png';

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
            const response = await fetch('https://localhost:7020/api/v1.0/Courts');
            if (!response.ok) {
                throw new Error('Failed to load courts');
            }
            const result = await response.json();
            if (result && Array.isArray(result.data)) {
                courtSelect.innerHTML = '<option value="" disabled selected>Select a court</option>'; // Reset
                result.data.filter(court => court.isActive).forEach(court => {
                    const option = document.createElement('option');
                    option.value = court.id;
                    option.textContent = `${court.name} - ${court.city}, ${court.state}`;
                    courtSelect.appendChild(option);
                });
            } else {
                 courtSelect.innerHTML = '<option value="" disabled>Could not load courts</option>';
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
    profilePicInput.addEventListener('change', function () {
        if (profilePicInput.files.length > 0) {
            const file = profilePicInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                ppPreview.src = e.target.result;
                ppPreviewWrap.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            ppPreviewWrap.classList.add('hidden');
            ppPreview.src = '';
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

        // API request
        fetch('https://localhost:7020/api/v1.0/Registrars', { // Assuming this is the correct endpoint for CreateRegistrar
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => { throw new Error(text || 'Network response was not ok'); });
            }
            return res.json();
        })
        .then(result => {
            // The provided controller returns the result directly, not wrapped in { isSuccess: ... }
            // We'll treat a 2xx response as success.
            Swal.fire({
                icon: 'success',
                title: 'Signup Successful',
                text: 'Your account has been created! Please check your email to verify your account.',
                timer: 2500,
                showConfirmButton: false
            });
            // Store email for OTP verification page
            localStorage.setItem('pendingEmail', form.elements['Email'].value);
            // Clear session flag to ensure OTP page auto-sends the code
            sessionStorage.removeItem('otp_sent');

            setTimeout(() => {
                window.location.href = "/LoginPage/VerifyOtp.html";
            }, 2500);
            form.reset();
            ppPreviewWrap.classList.add('hidden');
            ppPreview.src = '';
        })
        .catch(err => {
            // Try to parse error message if it's JSON
            let errorMessage = "An unknown error occurred during signup.";
            try {
                const errorJson = JSON.parse(err.message);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                } else if (typeof errorJson === 'string') {
                    errorMessage = errorJson;
                }
            } catch (e) {
                errorMessage = err.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Signup Failed',
                text: errorMessage
            });
            console.error('Fetch error:', err);
        });
    });

    // Initial data load
    populateCourts();
});
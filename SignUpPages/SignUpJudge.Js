document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupJudgeForm');
  const togglePwdBtn = document.getElementById('togglePwd');
  const passwordInput = document.getElementById('password');
  const courtSelect = document.getElementById('CourtAssignedId');

    const defaultAvatar = '../assets/Avatar.png';

    // --- Populate Courts Dropdown ---
    async function populateCourts() {
        try {
            const response = await fetch('https://localhost:7020/api/v1.0/Courts');
            if (!response.ok) throw new Error('Failed to load courts');
            
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
    // --- Password Visibility Toggle ---
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

    // --- Profile Picture Preview ---
    const profilePicInput = document.getElementById('ProfilePictureUrl');
    const ppPreview = document.getElementById('ppPreview');
    profilePicInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => { ppPreview.src = e.target.result; };
            reader.readAsDataURL(this.files[0]);
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
            Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Your passwords do not match!' });
            return;
        } else {
            confirmPasswordError.classList.add('hidden');
        }

        const formData = new FormData(form);

        fetch('https://localhost:7020/api/v1.0/Judges', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text || 'Network response was not ok'); });
            return res.json();
        })
        .then(result => {
            Swal.fire({
                icon: 'success',
                title: 'Signup Successful',
                text: 'Your account has been created! Please check your email to verify your account.',
                timer: 2500,
                showConfirmButton: false
            });
            
            localStorage.setItem('pendingEmail', form.elements['Email'].value);
            sessionStorage.removeItem('otp_sent');

            setTimeout(() => {
                window.location.href = "/LoginPage/VerifyOtp.html";
            }, 2500);

            form.reset();
            ppPreview.src = defaultAvatar;
        })
        .catch(err => {
            let errorMessage = "An unknown error occurred during signup.";
            try {
                const errorJson = JSON.parse(err.message);
                errorMessage = errorJson.message || Object.values(errorJson.errors).flat().join('\n') || err.message;
            } catch (e) {
                errorMessage = err.message;
            }

            Swal.fire({ icon: 'error', title: 'Signup Failed', text: errorMessage });
            console.error('Fetch error:', err);
        });
    });
    
    populateCourts();
});
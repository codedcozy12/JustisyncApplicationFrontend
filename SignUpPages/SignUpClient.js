document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signupClientForm');
  const passwordInput = document.getElementById('password');
  const togglePwdBtn = document.getElementById('togglePwd');
  const profilePicInput = document.getElementById('profilePic');
  const avatarPreview = document.getElementById('avatarPreview');
  const fileNameDisplay = document.getElementById('fileName');
  const defaultAvatar = '../assets/Avatar.png';

  // --- Password Visibility Toggle ---
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  // --- Profile Picture Preview & File Name Display ---
  if (profilePicInput && avatarPreview && fileNameDisplay) {
    profilePicInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
          avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
        fileNameDisplay.textContent = file.name;
      } else {
        avatarPreview.src = defaultAvatar;
        fileNameDisplay.textContent = '';
      }
    });
  }

  // --- Form Submission ---
  if (form) {
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

    fetch('https://localhost:7020/api/v1.0/Users/register', {
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
        // A 2xx response from the server indicates success.
        // The `result` object from a successful creation might not have an `isSuccess` property.
        if (result) {
          Swal.fire({
            icon: 'success',
            title: 'Signup Successful',
            text: 'Your account has been created! Please check your email to verify your account.',
            timer: 2500,
            showConfirmButton: false
          });
          // Store email for OTP verification page
          localStorage.setItem('pendingEmail', form.elements['Email'].value);
          // Set a flag to auto-trigger OTP send on the next page
          sessionStorage.removeItem('otp_sent');

          setTimeout(() => {
            window.location.href = "/LoginPage/VerifyOtp.html";
          }, 2500);

          // Reset form state
          form.reset();
          avatarPreview.src = defaultAvatar;
          fileNameDisplay.textContent = '';

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: result.message || 'An unknown error occurred.'
          });
        }
      })
      .catch(err => {
        let errorMessage = "An unknown error occurred during signup.";
        try {
          // Attempt to parse a JSON error message from the backend
          const errorJson = JSON.parse(err.message);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.errors) {
            // Handle ASP.NET Core validation errors
            errorMessage = Object.values(errorJson.errors).flat().join('\n');
          }
        } catch (e) {
          errorMessage = err.message; // Fallback to raw error message
        }
        Swal.fire({
          icon: 'error',
          title: 'Request Error',
          text: errorMessage
        });
        console.error('Fetch error:', err);
      });
    });
  }
});
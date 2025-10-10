document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('lawyerSignupForm');
  const passwordInput = document.getElementById('password');
  const togglePwdBtn = document.getElementById('togglePwd');
  const certificateInput = document.getElementById('certificateInput');
  const certificatesList = document.getElementById('certificatesList');
  const defaultAvatar = '../assets/Avatar.png';
  let certificateFiles = [];


  // --- Password Visibility Toggle ---
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  // Add certificate file to the list when input changes
  certificateInput.addEventListener('change', function () {
    if (certificateInput.files.length > 0) {
      const file = certificateInput.files[0];
      certificateFiles.push(file);
      
      const certDiv = document.createElement('div'); // Create a simple card for each certificate
      certDiv.className = 'flex items-center justify-between bg-[#F4F7FB] rounded-lg px-3 py-2 text-sm';
      certDiv.innerHTML = `
        <span class="text-xs text-gray-800 font-medium">${file.name}</span>
        <button type="button" class="remove-cert-btn bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Remove</button>
      `;
      certificatesList.appendChild(certDiv);

      certDiv.querySelector('.remove-cert-btn').addEventListener('click', function () {
        certificatesList.removeChild(certDiv);
        certificateFiles = certificateFiles.filter(f => f !== file);
      });

      // Reset input so same file can be added again if needed
      certificateInput.value = '';
    }
  });

  // Profile picture preview
  const profilePicInput = document.getElementById('ProfilePictureUrl');
  const ppPreviewWrap = document.getElementById('ppPreviewWrap');
  const ppPreview = document.getElementById('ppPreview');
  profilePicInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        ppPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Revert to default if no file is selected
      ppPreview.src = defaultAvatar;
    }
  });
  
  // Form submit
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

    // Create FormData from the form, which includes the profile picture
    const formData = new FormData(form);

    // Manually append each certificate file
    certificateFiles.forEach(file => {
      formData.append('CertificateFiles', file);
      formData.append('CertificateTypes', file.type);
    });

    // API request
    fetch('https://localhost:7020/api/v1.0/Lawyers', {
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
      if (result && result.isSuccess) {
        Swal.fire({
          icon: 'success',
          title: 'Signup Successful',
          text: 'Your account has been created! Please check your email to verify your account.',
          timer: 2500,
          showConfirmButton: false
        });
        // Store email for OTP verification page and clear session flag
        localStorage.setItem('pendingEmail', form.elements['Email'].value);
        sessionStorage.removeItem('otp_sent');

        setTimeout(() => {
          window.location.href = "/LoginPage/VerifyOtp.html";
        }, 2500);

        // Reset form and state
        form.reset();
        certificatesList.innerHTML = '';
        certificateFiles = [];
        ppPreview.src = defaultAvatar;
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
        const errorJson = JSON.parse(err.message);
        errorMessage = errorJson.message || Object.values(errorJson.errors).flat().join('\n') || err.message;
      } catch (e) {
        errorMessage = err.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Request Error',
        text: err.message
      });
      console.error('Fetch error:', err);
    });
  });
});
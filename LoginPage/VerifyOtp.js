document.addEventListener('DOMContentLoaded', function () {
  const emailSection = document.getElementById('emailSection');
  const requestOtpForm = document.getElementById('requestOtpForm');
  const verifyOtpForm = document.getElementById('verifyOtpForm');
  const otpInput = document.getElementById('otp');
  const resendLink = document.getElementById('resendOtpLink');
  let email = '';
  let otpSentTime = null;
  let timerInterval = null;

  // Helper: Show SweetAlert
  function showMessage(msg, isError = false) {
    if (isError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        timer: 2500,
        showConfirmButton: false
      });
    } else if (msg.toLowerCase().includes('success')) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: msg,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: msg,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  // Timer
  function startTimer() {
    otpSentTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }
  function updateTimer() {
    let timerDiv = document.getElementById('otpTimer');
    if (!timerDiv) {
      timerDiv = document.createElement('div');
      timerDiv.id = 'otpTimer';
      timerDiv.className = 'text-center text-xs text-gray-500 mb-2';
      verifyOtpForm.insertBefore(timerDiv, verifyOtpForm.firstChild);
    }
    const elapsed = Math.floor((Date.now() - otpSentTime) / 1000);
    const remaining = 180 - elapsed;
    if (remaining > 0) {
      timerDiv.textContent = `OTP expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
      otpInput.disabled = false;
      verifyOtpForm.querySelector('button[type="submit"]').disabled = false;
    } else {
      timerDiv.textContent = 'OTP expired. Please resend OTP.';
      otpInput.disabled = true;
      verifyOtpForm.querySelector('button[type="submit"]').disabled = true;
      clearInterval(timerInterval);
    }
  }

  // Send OTP to email
  function sendOtp() {
    if (!email) {
      showMessage('Email not found. Please enter your email.', true);
      return;
    }
    fetch('https://localhost:7020/api/v1.0/Users/send-email-confirmation-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email)
    })
    .then(res => res.json())
    .then(result => {
      if (result.isSuccess) {
        showMessage('OTP sent to your email.');
        startTimer();
      } else {
        showMessage(result.message || 'Failed to send OTP.', true);
      }
    })
    .catch(err => {
      showMessage('Error sending OTP: ' + err.message, true);
    });
  }

  // Handle email form submit
  requestOtpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    email = document.getElementById('verifyEmail').value.trim();
    if (!email) {
      showMessage('Please enter your email.', true);
      return;
    }
    // Save email for later use
    localStorage.setItem('pendingEmail', email);
    sendOtp();
    // Switch to OTP form
    emailSection.classList.add('hidden');
    verifyOtpForm.classList.remove('hidden');
  });

  // Handle OTP form submit
  verifyOtpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!email) {
      showMessage('No email found. Please enter your email.', true);
      return;
    }
    if (Date.now() - otpSentTime > 180000) {
      showMessage('OTP expired. Please resend OTP.', true);
      return;
    }
    const code = otpInput.value.trim();
    if (!/^\d{6}$/.test(code)) {
      showMessage('Please enter a valid 6-digit OTP.', true);
      return;
    }
    fetch('https://localhost:7020/api/v1.0/Users/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Email: email,
        ConfirmationCode: code
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.isSuccess) {
        showMessage('Email verified successfully!');
        clearInterval(timerInterval);
        setTimeout(() => {
          window.location.href = 'Login.html';
        }, 1200);
      } else {
        showMessage(result.message || 'Failed to verify OTP.', true);
      }
    })
    .catch(err => {
      showMessage('Error verifying OTP: ' + err.message, true);
    });
  });

  // Handle resend OTP
  resendLink.addEventListener('click', function (e) {
    e.preventDefault();
    sendOtp();
  });

  // Check if we should auto-send an OTP on page load.
  // This happens when the user is redirected from signup.
  const otpSentInSession = sessionStorage.getItem('otp_sent');
  if (localStorage.getItem('pendingEmail') && !otpSentInSession) {
    email = localStorage.getItem('pendingEmail');
    emailSection.classList.add('hidden');
    verifyOtpForm.classList.remove('hidden');
    
    // Set a flag in sessionStorage to prevent auto-resending on refresh
    sessionStorage.setItem('otp_sent', 'true');
    
    sendOtp();
  }
});
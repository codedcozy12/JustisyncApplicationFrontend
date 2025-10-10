document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById("forgotCodeForm");
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const code = document.getElementById("resetCode").value.trim();
        if (!code) {
          Swal.fire({
            icon: 'warning',
            title: 'Missing Code',
            text: 'Please enter the reset code sent to your email.',
            timer: 2000,
            showConfirmButton: false
          });
          return;
        }
        // Store code in localStorage for use in reset password page
        localStorage.setItem("resetCode", code);
        Swal.fire({
          icon: 'success',
          title: 'Code Verified',
          text: 'Proceed to reset your password.',
          timer: 1500,
          showConfirmButton: false
        });
        setTimeout(() => {
          window.location.href = "/LoginPage/ResetForgotten.html";
        }, 1500);
      });
    });
document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetPasswordForm");

    if (resetForm) {
      resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = localStorage.getItem("pendingEmail"); // Get email from storage
        const password = document.getElementById("newPassword").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // The reset code is stored in localStorage from the previous step
        const code = localStorage.getItem("resetCode");

        if (!password || !confirmPassword) {
          if (window.Swal) {
            Swal.fire({
              icon: 'warning',
              title: 'Missing Fields',
              text: 'Please fill all fields.',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            alert("⚠️ Please fill all fields.");
          }
          return;
        }

        if (!email) {
            if (window.Swal) {
              Swal.fire({
                icon: 'error',
                title: 'Missing Email',
                text: 'User email not found. Please start the process again.',
                timer: 3000,
                showConfirmButton: false
              });
            } else {
              alert("❌ User email not found. Please start the process again.");
            }
            return;
        }

        if (!code) {
          if (window.Swal) {
            Swal.fire({
              icon: 'error',
              title: 'Missing Code',
              text: 'Reset code not found. Please go back and enter the code from your email.',
              timer: 3000,
              showConfirmButton: false
            });
          } else {
            alert("❌ Reset code not found. Please go back and enter the code from your email.");
          }
          return;
        }

        if (password !== confirmPassword) {
          if (window.Swal) {
            Swal.fire({
              icon: 'error',
              title: 'Password Mismatch',
              text: 'Passwords do not match.',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            alert("❌ Passwords do not match.");
          }
          return;
        }

        try {
          const response = await fetch("https://localhost:7020/api/v1.0/Users/verify-forget-password-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              token: code,
              password,
              confirmPassword
            }),
          });

          // Handle both JSON and text responses
          const isJsonResponse = response.headers.get('content-type')?.includes('application/json');
          const data = isJsonResponse ? await response.json() : { isSuccess: false, message: await response.text() };

          if (response.ok && data.isSuccess) {
            if (window.Swal) {
              Swal.fire({
                icon: 'success',
                title: 'Password Reset',
                text: 'Password reset successful. Please log in with your new password.',
                timer: 2500,
                showConfirmButton: false
              });
              setTimeout(() => {
                localStorage.removeItem("resetCode"); // Clean up code
                localStorage.removeItem("pendingEmail"); // Clean up email
                window.location.href = "/LoginPage/Login.html";
              }, 2500);
            } else {
              alert("✅ Password reset successful. Please log in with your new password.");
              localStorage.removeItem("resetCode"); // Clean up code
              localStorage.removeItem("pendingEmail"); // Clean up email
              window.location.href = "/LoginPage/Login.html";
            }
          } else {
            if (window.Swal) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || "Something went wrong.",
                timer: 2500,
                showConfirmButton: false
              });
            } else {
              alert("❌ Error: " + (data.message || "Something went wrong."));
            }
          }
        } catch (error) {
          console.error("Request failed:", error);
          if (window.Swal) {
            Swal.fire({
              icon: 'error',
              title: 'Network Error',
              text: "Could not connect to server. Please try again later.",
              timer: 2500,
              showConfirmButton: false
            });
          } else {
            alert("⚠️ Could not connect to server. Please try again later.");
          }
        }
      });
    }
  });
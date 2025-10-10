document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    // Inject SweetAlert2 if not already present
    if (!window.Swal) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      document.head.appendChild(script);
    }

    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("forgotEmail").value.trim();

        if (!email) {
          if (window.Swal) {
            Swal.fire({
              icon: 'warning',
              title: 'Missing Email',
              text: 'Please enter your email address.',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            alert("Please enter your email address.");
          }
          return;
        }

        try {
          const response = await fetch("https://localhost:7020/api/v1.0/Users/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (response.ok) {
            const msg = await response.text();
            if (window.Swal) {
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: msg || "Password reset link sent to your email.",
                timer: 2500,
                showConfirmButton: false
              });
            } else {
              alert("✅ " + (msg || "Password reset link sent to your email."));
            }
            // Store email for the next steps
            localStorage.setItem("pendingEmail", email);
            // Redirect to forgot password code page after a short delay
            setTimeout(() => {
              window.location.href = "/LoginPage/ForgotPasswordCode.html";
            }, 2500);
          } else {
            const errorText = await response.text();
            if (window.Swal) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorText || "Failed to process forgot password request.",
                timer: 2500,
                showConfirmButton: false
              });
            } else {
              alert("❌ Error: " + (errorText || "Failed to process forgot password request."));
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
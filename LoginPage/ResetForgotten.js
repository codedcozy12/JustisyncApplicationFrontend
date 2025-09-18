  document.addEventListener("DOMContentLoaded", () => {
    const verifyForm = document.getElementById("verifyForgetPasswordForm");

    if (verifyForm) {
      verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // The token is passed via query string in the reset link
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!email || !password || !confirmPassword) {
          alert("⚠️ Please fill all fields.");
          return;
        }

        if (password !== confirmPassword) {
          alert("❌ Passwords do not match.");
          return;
        }

        try {
          const response = await fetch("https://localhost:7020/api/Users/verify-forget-password-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              confirmPassword,
              token
            }),
          });

          const data = await response.json();

          if (response.ok && data.isSuccess) {
            alert("✅ Password reset successful. Please log in with your new password.");
            window.location.href = "login.html";
          } else {
            alert("❌ Error: " + (data.message || "Something went wrong."));
          }
        } catch (error) {
          console.error("Request failed:", error);
          alert("⚠️ Could not connect to server. Please try again later.");
        }
      });
    }
  });
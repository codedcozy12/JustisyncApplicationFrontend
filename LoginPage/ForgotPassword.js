  document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email) {
          alert("Please enter your email address.");
          return;
        }

        try {
          const response = await fetch("https://localhost:7020/api/Users/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (response.ok) {
            alert("✅ A password reset link has been sent to your email.");
            // Optionally redirect or show a slide-up "check your email" page
          } else {
            const errorData = await response.json();
            alert("❌ Error: " + (errorData.message || "Something went wrong."));
          }
        } catch (error) {
          console.error("Request failed:", error);
          alert("⚠️ Could not connect to server. Please try again later.");
        }
      });
    }
  });
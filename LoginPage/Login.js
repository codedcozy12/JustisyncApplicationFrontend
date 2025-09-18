document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get form values
    const emailOrUsername = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basic validation
    if (!emailOrUsername || !password) {
        alert("Please enter both email/username and password.");
        return;
    }

    // Build request body
    const loginData = {
        email: emailOrUsername,  // backend expects "Email"
        password: password       // backend expects "Password"
    };

    try {
        const response = await fetch("https://localhost:7020/api/Users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (result.isSuccess) {
            alert("Login successful ✅");
            console.log("User Data:", result.data);

            // Example: Save token or user data to localStorage
            localStorage.setItem("user", JSON.stringify(result.data));

            // Redirect to dashboard/homepage
            window.location.href = "/dashboard.html";
        } else {
            alert("Login failed ❌: " + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
    }
});
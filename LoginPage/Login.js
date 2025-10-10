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
        email: emailOrUsername,
        password: password
    };

    let result;

    try {
        const response = await fetch("https://localhost:7020/api/v1.0/Users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        try {
            result = await response.json();
        } catch (jsonErr) {
            alert("Invalid server response.");
            return;
        }

        // ✅ Successful login
        if (
            response.ok &&
            result.token &&
            result.user &&
            (result.user.isSuccess === undefined || result.user.isSuccess === true)
        ) {
            const userData = result.user.data;
            const username = userData && (userData.username || userData.email || "User");
            const message = (result.user.message || "Login Successful") + `\nWelcome, ${username}!`;
            alert(message);

            // Save token and user data
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(userData));

            // JWT decode to get role
            let role = null;
            if (result.token) {
                const payload = parseJwt(result.token);
                localStorage.setItem("adminId",payload['UserId']);
                role =
                    (payload && (payload.role || payload.Role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])) ||
                    (userData && userData.role);

                if (typeof role === "number") {
                    if (role === 0) role = "Admin";
                    else if (role === 1) role = "Client";
                    else if (role === 2) role = "Lawyer";
                    else if (role === 3) role = "Judge";
                } else if (typeof role === "string") {
                    role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
                }
                localStorage.setItem("userRole", role);
            }

            // Redirect based on role
            if (role === "Admin") {
                window.location.href = "/Roles/Admin/AdminDashboard.html";
            } else if (role === "Lawyer") {
                window.location.href = "/Roles/Lawyer/Lawyer.html";
            } else if (role === "Client") {
                window.location.href = "/Roles/Client/Client.html";
            } else if (role === "Judge") {
                window.location.href = "/Roles/Judge/Judge.html";
            } else {
                window.location.href = "/dashboard.html";
            }
        } else {
            // ✅ Handle "please confirm your email" case
            const errorMsg =
                (result && result.message) ||
                (result && result.user && result.user.message) ||
                "Invalid email or password.";

            if (errorMsg.includes("Please confirm your email before logging in")) {
                alert("Please confirm your email before logging in.");
                localStorage.setItem("pendingEmail", loginData.email);

                try {
                    await sendCode({ email: loginData.email });
                } catch (sendErr) {
                    console.error("Failed to send confirmation code:", sendErr);
                }

                // ✅ Always redirect after showing message
                window.location.href = "/LoginPage/VerifyOtp.html";
            } else {
                alert("Login failed ❌: " + errorMsg);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
    }
});

// Helper: decode JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// API: send confirmation code
async function sendCode(data) {
    const response = await fetch("https://localhost:7020/api/v1.0/Users/send-email-confirmation-code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Failed to send confirmation code");
    }

    const resData = await response.json();
    alert("Confirmation code sent to your email.");
    return resData;
}
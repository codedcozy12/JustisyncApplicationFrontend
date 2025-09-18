  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Collect form values
      const username = document.getElementById("userName").value.trim();
      const email = document.getElementById("email").value.trim();
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const middleName = document.getElementById("middleName").value.trim();
      const phoneNumber = document.getElementById("phoneNo").value.trim();
      const password = document.getElementById("password").value;
      const profilePicture = document.getElementById("profilePic").files[0];

      // Basic validation
      // if (password !== confirmPassword) {
      //   document.getElementById("confirmPasswordError").classList.remove("hidden");
      //   return;
      // } else {
      //   document.getElementById("confirmPasswordError").classList.add("hidden");
      // }

      // Prepare FormData for multipart/form-data
      const formData = new FormData();
      formData.append("Username", username);
      formData.append("Email", email);
      formData.append("FirstName", firstName);
      formData.append("LastName", lastName);
      formData.append("MiddleName", middleName);
      formData.append("PhoneNumber", phoneNumber);
      formData.append("Password", password); // assuming your backend accepts this
      if (profilePicture) {
        formData.append("ProfilePictureUrl", profilePicture);
      }

      try {
        const response = await fetch("https://localhost:7020/api/Users/register", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = response.json();
          
          let errorMessage = errorData.detail || errorData.title || errorData.message || errorData;
          console.log(errorMessage)
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (result.isSuccess) {
          console.log("enterd here")
          alert(result.message || "Registration successful!");
          console.log("Signup successful")
          window.location.href = "/login.html"; // redirect to login page
        } else {
          alert(result.message || "Registration failed.");
        }
      } catch (error) {
        console.log(error);

        console.log("Error:", error.message);
        alert("Something went wrong. Please try again.");
      }
    });
  });
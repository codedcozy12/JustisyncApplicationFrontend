// ====== CONFIG ======
    const API_URL = "https://your-api-url.com/api/lawyers"; // <-- change to your endpoint

    // ====== Helpers ======
    const statusEl = document.getElementById("status");
    function showStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = "mb-3 text-sm p-2 rounded-md " + (type === "error"
        ? "bg-red-50 text-red-700 border border-red-200"
        : "bg-green-50 text-green-700 border border-green-200");
      statusEl.classList.remove("hidden");
    }
    function clearStatus(){ statusEl.classList.add("hidden"); }

    // ====== Profile Picture Preview ======
    const profilePicInput = document.getElementById("profilePic");
    const ppPreviewWrap = document.getElementById("ppPreviewWrap");
    const ppPreview = document.getElementById("ppPreview");

    profilePicInput.addEventListener("change", () => {
      const file = profilePicInput.files && profilePicInput.files[0];
      if (!file) { ppPreviewWrap.classList.add("hidden"); return; }
      const reader = new FileReader();
      reader.onload = e => {
        ppPreview.src = e.target.result;
        ppPreviewWrap.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });

    // ====== Certificates (compact UI) ======
    const container = document.getElementById("certificatesContainer");
    const addBtn = document.getElementById("addCertificateBtn");

    function makeCertRow(index){
      const row = document.createElement("div");
      row.className = "grid grid-cols-12 gap-2 items-center";
      row.dataset.index = index;

      // CertificateType (select small)
      const typeWrap = document.createElement("div");
      typeWrap.className = "col-span-5";
      typeWrap.innerHTML = `
        <select class="w-full rounded-md border border-gray-300 p-2 text-xs focus:ring-indigo-500 focus:border-indigo-500 cert-type">
          <option value="LawSchool">Law School Certificate</option>
          <option value="University">University Certificate</option>
          <option value="Bar">Bar/Professional</option>
          <option value="Other">Other</option>
        </select>
      `;

      // File
      const fileWrap = document.createElement("div");
      fileWrap.className = "col-span-6";
      fileWrap.innerHTML = `
        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
               class="w-full text-xs border border-gray-300 rounded-md p-1.5 cert-file">
      `;

      // Remove
      const removeWrap = document.createElement("div");
      removeWrap.className = "col-span-1 text-right";
      removeWrap.innerHTML = `
        <button type="button" class="px-2 py-1 text-xs rounded-md bg-gray-200 hover:bg-gray-300 remove-cert" title="Remove">×</button>
      `;

      row.appendChild(typeWrap);
      row.appendChild(fileWrap);
      row.appendChild(removeWrap);
      return row;
    }

    function reindexCertRows(){
      // purely visual; actual index is assigned when building FormData
      [...container.children].forEach((row, i) => row.dataset.index = i);
    }

    addBtn.addEventListener("click", () => {
      container.appendChild(makeCertRow(container.children.length));
      reindexCertRows();
    });

    container.addEventListener("click", (e) => {
      if (e.target.closest(".remove-cert")) {
        const row = e.target.closest("[data-index]");
        row.remove();
        reindexCertRows();
      }
    });

    // Add one row by default (optional)
    addBtn.click();

    // ====== Submit handling (ASP.NET-friendly binding) ======
    const form = document.getElementById("lawyerSignupForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus();

      // Validate password match
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordError.classList.remove("hidden");
        return;
      } else {
        confirmPasswordError.classList.add("hidden");
      }

      const fd = new FormData();

      // Top-level properties (match C# names for smooth model binding)
      fd.append("Username", document.getElementById("username").value.trim());
      fd.append("Email", document.getElementById("email").value.trim());
      fd.append("Password", passwordInput.value);
      fd.append("FirstName", document.getElementById("firstname").value.trim());
      fd.append("LastName", document.getElementById("lastname").value.trim());
      fd.append("MiddleName", document.getElementById("middlename").value.trim() || "");
      fd.append("PhoneNumber", document.getElementById("phone").value.trim());
      fd.append("LawSchoolName", document.getElementById("lawSchoolName").value.trim());
      fd.append("UniversityName", document.getElementById("universityName").value.trim());
      fd.append("BarMembershipNumber", document.getElementById("barMembershipNumber").value.trim());
      fd.append("LawyerSpecialization", document.getElementById("lawyerSpecialization").value); // enum numeric string

      // Profile picture
      const pp = profilePicInput.files[0];
      if (pp) fd.append("ProfilePictureUrl", pp);

      // Certificates list
      const rows = [...container.children];
      rows.forEach((row, i) => {
        const type = row.querySelector(".cert-type").value;
        const file = row.querySelector(".cert-file").files[0];
        if (!file) return; // skip empty rows

        // Required by your DTO:
        fd.append(`Certificates[${i}].CertificateType`, type);
        fd.append(`Certificates[${i}].FilePath`, file.name); // server can ignore/overwrite
        fd.append(`Certificates[${i}].File`, file);
        // NOTE: Certificates[${i}].LawyerId omitted (server should set it)
      });

      try {
        const res = await fetch(API_URL, { method: "POST", body: fd });
        if (!res.ok) {
          let msg = "Signup failed.";
          try { const j = await res.json(); msg = j.message || JSON.stringify(j); } catch {}
          showStatus(msg, "error");
          return;
        }
        showStatus("Signup successful!", "success");
        form.reset();
        ppPreviewWrap.classList.add("hidden");
        container.innerHTML = "";
        addBtn.click(); // re-add one blank cert row
      } catch (err) {
        console.error(err);
        showStatus("Network error. Please try again.", "error");
      }
    });
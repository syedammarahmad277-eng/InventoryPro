const API_URL = "http://127.0.0.1:5000";

// If already logged in, go directly to dashboard
const loggedInUser = localStorage.getItem("inventoryUser");

if (loggedInUser) {
    window.location.href = "index.html";
}


document
    .getElementById("login-form")
    .addEventListener("submit", async function(e) {

        e.preventDefault();

        const email =
            document.getElementById("login-email").value.trim();

        const password =
            document.getElementById("login-password").value;

        const errorBox =
            document.getElementById("login-error");

        errorBox.textContent = "";

        try {

            const response = await fetch(`${API_URL}/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });


            const result = await response.json();


            if (!response.ok) {

                errorBox.textContent =
                    result.error || "Login failed";

                return;
            }


            // Save logged-in user
            localStorage.setItem(
                "inventoryUser",
                JSON.stringify(result.user)
            );


            // Open inventory system
            window.location.href = "index.html";


        } catch (error) {

            console.error(error);

            errorBox.textContent =
                "Cannot connect to the server. Please start the backend.";
        }

    });
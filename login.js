const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginButton = document.getElementById("login-submit");
const passwordInput = document.getElementById("login-password");
const passwordToggle = document.getElementById("password-toggle");

passwordToggle.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(showPassword));
    passwordToggle.setAttribute(
        "aria-label",
        showPassword ? "Hide password" : "Show password"
    );
    passwordToggle.querySelector("i").className = showPassword
        ? "fa-regular fa-eye-slash"
        : "fa-regular fa-eye";
});

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.querySelector("span").textContent = "Signing in...";

    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("login-email").value.trim(),
                password: passwordInput.value
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to sign in");
        }

        window.location.replace("index.html");
    } catch (error) {
        loginError.textContent = error instanceof TypeError
            ? "Cannot connect to the server. Check that the backend is running."
            : error.message;
        loginButton.disabled = false;
        loginButton.querySelector("span").textContent = "Sign in";
    }
});

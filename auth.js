const AUTH_API_URL =
    `${window.location.protocol}//${window.location.hostname}:5000`;

window.apiFetch = async function (url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "include"
    });

    if (response.status === 401 && !window.location.pathname.endsWith("/login.html")) {
        window.location.replace("login.html");
    }

    return response;
};

window.logout = async function () {
    try {
        const response = await fetch(`${AUTH_API_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Could not sign out");
        }
    } catch (error) {
        console.error(error);
    } finally {
        window.location.replace("login.html");
    }
};

if (window.location.pathname.endsWith("/login.html")) {
    fetch(`${AUTH_API_URL}/session`, { credentials: "include" })
        .then(response => {
            if (response.ok) {
                window.location.replace("index.html");
            }
        })
        .catch(error => console.error("Unable to check sign-in status:", error));
} else {
    window.authReady = fetch(`${AUTH_API_URL}/session`, { credentials: "include" })
        .then(async response => {
            if (response.status === 401) {
                window.location.replace("login.html");
                return false;
            }

            if (!response.ok) {
                throw new Error("Unable to verify sign-in status");
            }

            const { user } = await response.json();
            const displayName = user.name || user.email;
            const initial = displayName.trim().charAt(0).toUpperCase() || "U";

            document.getElementById("profile-name").textContent = displayName;
            document.getElementById("profile-role").textContent = user.role || "User";
            document.getElementById("profile-avatar").textContent = initial;
            document.getElementById("sidebar-name").textContent = displayName;
            document.getElementById("sidebar-role").textContent = user.role || "User";
            document.getElementById("sidebar-avatar").textContent = initial;
            document.documentElement.classList.remove("auth-pending");
            return true;
        })
        .catch(error => {
            console.error("Unable to verify sign-in status:", error);
            document.documentElement.classList.remove("auth-pending");
            return true;
        });
}

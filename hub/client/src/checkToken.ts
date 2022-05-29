// if somehow the token is undefined (because of implementation errors), clear it and start over
if (window.sessionStorage.getItem("sysMonitorSessionToken") === 'undefined') {
    window.sessionStorage.clear();
}

if (window.sessionStorage.getItem("sysMonitorSessionToken") !== null) {
    // check session token and page redirection
    // if session token is in session storage, check it and redirect to index.html if still valid
    const token = JSON.parse(sessionStorage.getItem("sysMonitorSessionToken"));
    // token is of form: [generationTimestamp, expirationDate, uniqueSessionId]
    if (token[1] > Date.now() && window.location.pathname === "/login.html") {
        window.location.replace("index.html");
    }
} else {
    if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
        // if there is no session token in session storage, redirect to login page
        window.location.replace("/login.html")
    }
}
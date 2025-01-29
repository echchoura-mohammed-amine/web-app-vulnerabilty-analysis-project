function navigateToTasks() {
    window.location.href = '/protected/dashboard.html';
}

function logout() {
    fetch('/logout')
        .then(() => {
            window.location.href = '/public/login.html';
        })
        .catch(() => {
            alert('Logout failed. Please try again.');
        });
}

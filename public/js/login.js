const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/protected/index.html';
        } else {
            const error = await response.text();
            errorMessage.textContent = error || 'Login failed. Please try again.';
        }
    } catch (err) {
        errorMessage.textContent = 'An error occurred. Please try again later.';
    }
});

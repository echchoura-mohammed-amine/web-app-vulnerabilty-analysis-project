const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            successMessage.textContent = 'Registration successful! You can now log in.';
            registerForm.reset();
            setTimeout(() => {
                window.location.href = '/public/login.html';
            }, 2000);
        } else {
            const error = await response.text();
            errorMessage.textContent = error || 'Registration failed. Please try again.';
        }
    } catch (err) {
        errorMessage.textContent = 'An error occurred. Please try again later.';
    }
});

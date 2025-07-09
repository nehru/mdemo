// --- app.js (Conceptual File) ---
const express = require('express');
const app = express();
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const bodyParser = require('body-parser'); // For parsing request bodies

// Simulate a very basic user data store (NOT secure for real use!)
const users = {
    'alice': { password: 'password123', role: 'user' },
    'bob': { password: 'securepass', role: 'admin' }
};

// Middleware to parse URL-encoded and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- VULNERABILITY 1: Hardcoded Secret / Sensitive Data Exposure ---
// DANGER: Hardcoding a JWT secret or API key directly in the code
const JWT_SECRET = "my_super_insecure_jwt_secret_that_everyone_can_see";

// --- VULNERABILITY 2: Cross-Site Scripting (XSS) via Reflected Input ---
app.get('/search', (req, res) => {
    const query = req.query.q; // User input from URL query parameter
    if (query) {
        // DANGER: Directly embedding unsanitized user input into HTML
        res.send(`<h1>Search Results for: ${query}</h1><p>...</p>`);
    } else {
        res.send('<h1>Please enter a search query.</h1>');
    }
});

// --- VULNERABILITY 3: Command Injection ---
app.get('/download', (req, res) => {
    const filename = req.query.file; // User input from URL query parameter
    if (filename) {
        // DANGER: Using user input directly in 'exec' without sanitization
        const command = `cat ./downloads/${filename}`; // Attacker could inject `; rm -rf /`
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('File download failed.');
            }
            res.send(stdout);
        });
    } else {
        res.status(400).send('Filename missing.');
    }
});

// --- VULNERABILITY 4: Insecure Direct Object Reference (IDOR) ---
app.get('/profile/:username', (req, res) => {
    const requestedUsername = req.params.username; // User input from URL path parameter
    const currentUser = req.session ? req.session.user : null; // Assume user is logged in (conceptually)

    // DANGER: No check if 'currentUser' is authorized to view 'requestedUsername's' profile
    // An attacker logged in as 'alice' could access 'bob's profile by changing the URL.
    if (users[requestedUsername]) {
        res.json({
            username: requestedUsername,
            role: users[requestedUsername].role
            // Potentially other sensitive info like email, address could be here
        });
    } else {
        res.status(404).send('User not found.');
    }
});

// --- VULNERABILITY 5: Broken Authentication (Simple Credential Stuffing / No Hashing) ---
app.post('/login', (req, res) => {
    const { username, password } = req.body; // User input from POST request body

    // DANGER: Storing passwords in plain text (users object above) and direct comparison
    // No password hashing or salting. Vulnerable to credential stuffing and database leaks.
    if (users[username] && users[username].password === password) {
        // In a real app, you'd generate a JWT or session here
        res.send(`Logged in as ${username}. Welcome!`);
    } else {
        res.status(401).send('Invalid credentials.');
    }
});


app.get('/', (req, res) => {
    res.send('Welcome to the vulnerable app!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// vulnerable_app.js

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const session = require('express-session'); // For session management
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Insecure Session Configuration (Vulnerability 10: Missing Security Headers/Insecure Config)
// Not strictly a code vulnerability, but common misconfiguration
app.use(session({
    secret: 'insecure_hardcoded_secret', // Vulnerability 1: Hardcoded Secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Vulnerability 10: Insecure Cookie (http only also missing)
}));

// Basic user storage for demonstration (not production ready)
const users = [
    { id: '101', username: 'admin', passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' }, // 'password' (SHA256, no salt)
    { id: '102', username: 'user', passwordHash: '0a049d5300540d51025066068205737b864ac00a060b2d41578e932463e2e008' }  // '123456' (SHA256, no salt)
];

// Vulnerability 2: Arbitrary Code Execution (eval abuse)
app.get('/calculate', (req, res) => {
    const expr = req.query.expr; // User controlled input
    try {
        // BAD: Using eval() with untrusted input
        const result = eval(expr);
        res.send(`Result: ${result}`);
    } catch (e) {
        res.status(400).send(`Error: ${e.message}`);
    }
});

// Vulnerability 3: Command Injection
app.get('/exec', (req, res) => {
    const cmd = req.query.cmd; // User controlled input
    // BAD: Executing shell command directly with untrusted input
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send(`Error executing command: ${stderr}`);
        }
        res.send(`Command Output:\n${stdout}`);
    });
});

// Vulnerability 4: Path Traversal
app.get('/download', (req, res) => {
    const filename = req.query.file; // User controlled input
    // BAD: Directly using user input to construct file path without validation
    const filePath = path.join(__dirname, 'uploads', filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`File read error: ${err}`);
            return res.status(404).send('File not found');
        }
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(data);
    });
});

// Vulnerability 5: Insecure Direct Object Reference (IDOR)
app.get('/profile/:id', (req, res) => {
    const userId = req.params.id; // User controlled ID
    // BAD: No authorization check to ensure the user is allowed to view this profile
    const user = users.find(u => u.id === userId);
    if (user) {
        // Removing passwordHash for basic protection, but still IDOR
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
    } else {
        res.status(404).send('User not found');
    }
});

// Vulnerability 6: Weak Cryptography / Missing Salt (or reused salt)
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // BAD: Using SHA256 directly for password hashing (no salt, no enough rounds)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // This is for demonstration; in a real app, you'd save to a DB
    // Assume user is registered
    res.status(200).send('User registered (insecurely)!');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const inputHash = crypto.createHash('sha256').update(password).digest('hex'); // BAD: Same weak hashing

    const user = users.find(u => u.username === username && u.passwordHash === inputHash);

    if (user) {
        req.session.userId = user.id; // Log user in
        res.send('Logged in successfully (insecurely)!');
    } else {
        res.status(401).send('Invalid credentials!');
    }
});

// Vulnerability 7: Mass Assignment
app.post('/update_settings', (req, res) => {
    // Imagine req.session.userId authenticates a user
    const user = users.find(u => u.id === req.session.userId);

    if (!user) {
        return res.status(401).send('Not authenticated');
    }

    // BAD: Directly assigning entire req.body to user object
    // An attacker could send { "isAdmin": true } in the request body
    // and potentially elevate privileges if not filtered.
    Object.assign(user, req.body);

    res.json({ message: 'Settings updated!', user: user });
});

// Vulnerability 8: Regular Expression Denial of Service (ReDoS)
app.get('/check_email', (req, res) => {
    const email = req.query.email;
    // BAD: Inefficient regex pattern vulnerable to ReDoS
    // Example payload: "a" + "a".repeat(100) + "!"
    const regex = /^(a+)+$/; // This is a classic ReDoS pattern
    if (regex.test(email)) {
        res.send('Email format might be problematic for regex engines.');
    } else {
        res.send('Email format seems okay.');
    }
});

// Vulnerability 9: Unsafe Deserialization
// This often involves libraries that deserialize complex objects.
// For simplicity, simulating with JSON.parse, but real-world involves 'node-serialize' or similar.
app.post('/load_data', (req, res) => {
    const userData = req.body.data; // User-controlled serialized data
    try {
        // BAD: Deserializing untrusted data without validation.
        // If 'userData' was from a library like 'node-serialize',
        // it could execute arbitrary code when parsing a crafted payload.
        const parsedData = JSON.parse(userData);
        res.json({ message: 'Data loaded', data: parsedData });
    } catch (e) {
        res.status(400).send(`Error parsing data: ${e.message}`);
    }
});

// Vulnerability 11: Insecure Randomness for sensitive operations (e.g., token generation)
app.get('/generate_token_insecure', (req, res) => {
    // BAD: Using Math.random() for security-sensitive tokens
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.send(`Insecure Token: ${token}`);
});

// Vulnerability 12: Client-side XSS (via reflected input in template, not directly expressed in pure JS file)
// This is harder to show purely in a JS file without a templating engine.
// However, an SAST tool might flag direct reflection of user input in response.
app.get('/search', (req, res) => {
    const query = req.query.q; // User-controlled input
    // BAD: Reflecting user input directly into HTML without proper encoding
    // This could lead to XSS if not handled by a proper templating engine that auto-escapes.
    // SAST might flag `res.send()` with unsanitized user input in an HTML context.
    res.send(`
        <html>
            <body>
                <h1>Search Results for: ${query}</h1>
                <div id="results">No results found for "${query}"</div>
            </body>
        </html>
    `);
});


app.listen(PORT, () => {
    console.log(`Vulnerable app running on http://localhost:${PORT}`);
    console.log('Use this for educational purposes ONLY. DO NOT USE IN PRODUCTION.');
});

// To run this:
// 1. Make sure you have Node.js and npm installed.
// 2. Create a folder named 'uploads' in the same directory as this file.
// 3. Install dependencies: npm install express body-parser crypto fs path session child_process
//    (Note: 'crypto', 'fs', 'path', 'child_process' are built-in, but 'express', 'body-parser', 'express-session' need installation)
// 4. Run: node vulnerable_app.js
// 5. Test with a tool like Postman or a browser with crafted requests.
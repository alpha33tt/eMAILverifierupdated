const express = require('express');
const dns = require('dns'); // Using the built-in DNS module

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Validate email domain with MX record lookup
function isValidDomain(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                reject(false); // No MX records found
            } else {
                resolve(true); // MX records found, domain is valid
            }
        });
    });
}

// Endpoint to validate emails
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    if (!emails) {
        return res.status(400).json({ error: 'No emails provided' });
    }

    for (const email of emails) {
        const trimmedEmail = email.trim();
        const domain = trimmedEmail.split('@')[1];

        if (domain && domain.includes('.')) {
            try {
                // Perform MX lookup on the domain
                const isValid = await isValidDomain(domain);
                if (isValid) {
                    validEmails.push(trimmedEmail);
                } else {
                    invalidEmails.push({ email: trimmedEmail, reason: 'No MX records found' });
                }
            } catch (error) {
                invalidEmails.push({ email: trimmedEmail, reason: 'Error in MX lookup' });
            }
        } else {
            invalidEmails.push({ email: trimmedEmail, reason: 'Invalid email format' });
        }
    }

    res.json({ validEmails, invalidEmails });
});

// Serve static files (like index.html)
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

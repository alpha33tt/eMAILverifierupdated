const express = require('express');
const dns = require('dns');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Validate email domain with MX record lookup
function isValidDomain(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, records) => {
            if (err || records.length === 0) {
                reject(false); // Reject if no MX records found
            } else {
                resolve(true); // Resolve if MX records found
            }
        });
    });
}

// Validate the email format using a regular expression
function isValidEmailFormat(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Endpoint to validate emails
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    if (!emails || emails.length === 0) {
        return res.status(400).json({ error: 'No emails provided' });
    }

    for (const email of emails) {
        const trimmedEmail = email.trim();

        // Validate email format
        if (!isValidEmailFormat(trimmedEmail)) {
            invalidEmails.push({ email: trimmedEmail, reason: 'Invalid email format' });
            continue;
        }

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
                invalidEmails.push({ email: trimmedEmail, reason: 'Error during MX lookup' });
            }
        } else {
            invalidEmails.push({ email: trimmedEmail, reason: 'Invalid domain' });
        }
    }

    // Properly format the invalid emails to return readable strings
    const formattedInvalidEmails = invalidEmails.map(item => {
        return `${item.email} - Reason: ${item.reason}`;
    });

    res.json({ validEmails, invalidEmails: formattedInvalidEmails });
});

// Serve static files (like index.html)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

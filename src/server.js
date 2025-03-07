const express = require('express');
const dns = require('dns');
const mxRecords = require('mx-records');

const app = express();
const port = 3000;

app.use(express.json());

// Check email syntax
function isValidEmailFormat(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Check if the domain is disposable
const disposableEmailProviders = [
    'mailinator.com', '10minutemail.com', 'guerrillamail.com', // etc.
];

function isDisposableEmail(email) {
    const domain = email.split('@')[1];
    return disposableEmailProviders.includes(domain);
}

// Validate email domain with MX record lookup
function isValidDomain(domain) {
    return new Promise((resolve, reject) => {
        mxRecords(domain, (err, records) => {
            if (err || records.length === 0) {
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
}

// Endpoint to validate emails
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    for (const email of emails) {
        const trimmedEmail = email.trim();

        // Syntax check
        if (!isValidEmailFormat(trimmedEmail)) {
            invalidEmails.push(trimmedEmail);
            continue;
        }

        // Disposable email check
        if (isDisposableEmail(trimmedEmail)) {
            invalidEmails.push(trimmedEmail);
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
                    invalidEmails.push(trimmedEmail);
                }
            } catch (error) {
                invalidEmails.push(trimmedEmail); // Domain lookup failed, consider it invalid
            }
        } else {
            invalidEmails.push(trimmedEmail); // Invalid domain format
        }
    }

    res.json({ validEmails, invalidEmails });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const dns = require('dns');
const mxRecords = require('mx-records');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to perform MX lookup on the domain
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

// Function to check if the email domain is blacklisted (for example, using EmailRep.io API)
async function isBlacklisted(domain) {
    try {
        const response = await axios.get(`https://emailrep.io/${domain}`);
        return response.data.blacklisted ? { blacklisted: true, reason: response.data.reason, score: response.data.score } : { blacklisted: false };
    } catch (error) {
        return { blacklisted: false };  // If error occurs, assume not blacklisted
    }
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
                    // Check if domain is blacklisted
                    const blacklistInfo = await isBlacklisted(domain);
                    validEmails.push({
                        email: trimmedEmail,
                        domain,
                        blacklisted: blacklistInfo.blacklisted,
                        reason: blacklistInfo.blacklisted ? blacklistInfo.reason : null,
                        score: blacklistInfo.blacklisted ? blacklistInfo.score : null
                    });
                } else {
                    invalidEmails.push({
                        email: trimmedEmail,
                        reason: 'No MX records found'
                    });
                }
            } catch (error) {
                invalidEmails.push({
                    email: trimmedEmail,
                    reason: 'Error during validation'
                });
            }
        } else {
            invalidEmails.push({
                email: trimmedEmail,
                reason: 'Invalid email format'
            });
        }
    }

    res.json({
        validEmails: validEmails,
        invalidEmails: invalidEmails
    });
});

// Serve static files (like index.html)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const dns = require('dns');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '../public')));

// Validate email domain with MX record lookup
function isValidDomain(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
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

    for (const email of emails) {
        const trimmedEmail = email.trim();
        const domain = trimmedEmail.split('@')[1];

        if (domain && domain.includes('.')) {
            try {
                // Perform MX lookup on the domain
                const isValid = await isValidDomain(domain);
                if (isValid) {
                    validEmails.push(trimmedEmail);
                }
            } catch (error) {
                // Domain is not valid
            }
        }
    }

    res.json({ validEmails });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

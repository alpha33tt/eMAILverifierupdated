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
                reject(false); // Invalid domain if no MX records found
            } else {
                resolve(true); // Valid domain with MX records
            }
        });
    });
}

// Endpoint to validate emails
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    // Create promises for each email validation
    const promises = emails.map((email) => {
        const trimmedEmail = email.trim();
        const domain = trimmedEmail.split('@')[1];

        if (domain && domain.includes('.')) {
            return isValidDomain(domain)
                .then((isValid) => {
                    if (isValid) {
                        validEmails.push(trimmedEmail);
                    } else {
                        invalidEmails.push(trimmedEmail);
                    }
                })
                .catch((error) => {
                    invalidEmails.push(trimmedEmail);
                });
        } else {
            invalidEmails.push(trimmedEmail);
            return Promise.resolve(); // Skip invalid email format
        }
    });

    // Wait for all email validations to complete
    await Promise.all(promises);

    // Send the response with valid and invalid emails
    res.json({ validEmails, invalidEmails });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

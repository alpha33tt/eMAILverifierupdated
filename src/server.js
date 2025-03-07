const express = require('express');
const mxRecords = require('mx-records'); // MX records lookup
const app = express();
const port = 3000;

app.use(express.json());

// MX Lookup for domain
function isValidDomain(domain) {
    return new Promise((resolve, reject) => {
        mxRecords(domain, (err, records) => {
            if (err || records.length === 0) {
                reject('No MX records found');
            } else {
                resolve(true);
            }
        });
    });
}

// Email validation endpoint
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    for (const email of emails) {
        const domain = email.trim().split('@')[1];
        
        if (domain && domain.includes('.')) {
            try {
                // Perform MX lookup on the domain
                await isValidDomain(domain); // wait for MX validation
                validEmails.push(email); // If valid, add to validEmails
            } catch (error) {
                invalidEmails.push(email); // If invalid, add to invalidEmails
            }
        } else {
            invalidEmails.push(email); // Invalid format
        }
    }

    res.json({ validEmails, invalidEmails });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const express = require('express');
const dns = require('dns');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '../public')));

// Helper function to check MX records for domain
async function checkMX(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                reject("MX record not found for " + domain);
            } else {
                resolve("MX records found for " + domain);
            }
        });
    });
}

// Helper function to perform DNS lookup
async function checkDNS(domain) {
    return new Promise((resolve, reject) => {
        dns.resolve(domain, (err, records) => {
            if (err || records.length === 0) {
                reject("DNS records not found for " + domain);
            } else {
                resolve("DNS records found for " + domain);
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
    const promises = emails.map(async (email) => {
        const trimmedEmail = email.trim();
        const domain = trimmedEmail.split('@')[1];

        if (domain) {
            // Start MX lookup immediately
            const mxPromise = checkMX(domain);

            // Wait for MX lookup to complete
            let mxResult;
            try {
                mxResult = await mxPromise;
                validEmails.push(trimmedEmail); // MX lookup successful
            } catch (err) {
                invalidEmails.push(trimmedEmail); // MX lookup failed
                mxResult = err;
            }

            // DNS lookup should start after 10 seconds from MX lookup starting
            setTimeout(async () => {
                try {
                    await checkDNS(domain);
                    // DNS check successful
                } catch (dnsErr) {
                    // Handle DNS failure
                    console.log(dnsErr);
                }
            }, 10000); // Delay DNS check by 10 seconds
        }
    });

    // Wait for all promises to complete
    await Promise.all(promises);

    // Send the response with valid and invalid emails
    res.json({ validEmails, invalidEmails });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

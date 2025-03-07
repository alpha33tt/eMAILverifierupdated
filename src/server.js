const express = require('express');
const dns = require('dns');
const axios = require('axios');  // Used for blacklist check
const whois = require('whois');  // Used for additional domain info

const app = express();
const port = 3000;

app.use(express.json());

// Function to check MX records
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

// Function to check if the domain is blacklisted
async function isBlacklisted(domain) {
    try {
        const response = await axios.get(`https://api.abuseipdb.com/api/v2/check?ipAddress=${domain}`, {
            headers: {
                'Key': 'your-abuseipdb-api-key',  // Replace with your actual API key
                'Accept': 'application/json'
            }
        });
        return response.data.data.is_blacklisted ? 'Yes' : 'No';
    } catch (error) {
        return 'No';  // Default to No if there's an error in the API request
    }
}

// Function to get WHOIS data for a domain
function getDomainWhois(domain) {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, (err, data) => {
            if (err) {
                reject('Unable to retrieve WHOIS data');
            } else {
                resolve(data);
            }
        });
    });
}

// Validate email addresses
app.post('/validate-emails', async (req, res) => {
    const emails = req.body.emails;
    const validEmails = [];
    const invalidEmails = [];

    if (!emails || emails.length === 0) {
        return res.status(400).json({ error: 'No emails provided' });
    }

    for (const email of emails) {
        const trimmedEmail = email.trim();
        const domain = trimmedEmail.split('@')[1];

        if (domain && domain.includes('.')) {
            try {
                const isDomainValid = await isValidDomain(domain);

                if (isDomainValid) {
                    const blacklistStatus = await isBlacklisted(domain);
                    const whoisData = await getDomainWhois(domain);
                    validEmails.push({
                        email: trimmedEmail,
                        domain: domain,
                        blacklist: blacklistStatus,
                        whois: whoisData
                    });
                } else {
                    invalidEmails.push({
                        email: trimmedEmail,
                        reason: 'Invalid domain (MX record not found)'
                    });
                }
            } catch (error) {
                invalidEmails.push({
                    email: trimmedEmail,
                    reason: 'Invalid domain (MX record lookup failed)'
                });
            }
        } else {
            invalidEmails.push({
                email: trimmedEmail,
                reason: 'Invalid email format'
            });
        }
    }

    res.json({ validEmails, invalidEmails });
});

// Serve static files (like index.html)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

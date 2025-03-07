const express = require('express');
const dns = require('dns');
const axios = require('axios');
const whois = require('whois');

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

// Function to fetch domain information (whois lookup)
function getDomainInfo(domain) {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Function to check if the domain is blacklisted (example using EmailRep.io API)
async function checkBlacklist(domain) {
    const blacklistAPI = 'https://emailrep.io/' + domain;
    try {
        const response = await axios.get(blacklistAPI, { headers: { 'User-Agent': 'Email Validation Service' } });
        if (response.data.blacklist_count > 0) {
            return {
                isBlacklisted: true,
                blacklistPercentage: response.data.blacklist_count / 100 // Example of percentage
            };
        } else {
            return { isBlacklisted: false, blacklistPercentage: 0 };
        }
    } catch (error) {
        return { isBlacklisted: false, blacklistPercentage: 0 }; // Default to not blacklisted if error
    }
}

// Function for SMTP validation (simplified version)
async function checkSMTP(email) {
    // For real SMTP check, you would query the SMTP server, here it's simplified.
    const domain = email.split('@')[1];
    try {
        const smtpServer = await dns.promises.resolveMx(domain);
        if (smtpServer && smtpServer.length > 0) {
            return true; // SMTP server exists
        } else {
            return false; // No SMTP server found
        }
    } catch (err) {
        return false;
    }
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

        // Check for email format validity
        if (!isValidEmailFormat(trimmedEmail)) {
            invalidEmails.push({ email: trimmedEmail, reason: 'Invalid email format' });
            continue;  // Skip further validation if the format is invalid
        }

        const domain = trimmedEmail.split('@')[1];

        if (domain && domain.includes('.')) {
            try {
                // Perform MX lookup on the domain
                const isValid = await isValidDomain(domain);
                if (isValid) {
                    // Get domain info from Whois lookup
                    const domainInfo = await getDomainInfo(domain);
                    // Check if the domain is blacklisted
                    const blacklistInfo = await checkBlacklist(domain);
                    // Perform SMTP check
                    const isSMTPValid = await checkSMTP(trimmedEmail);
                    
                    validEmails.push({
                        email: trimmedEmail,
                        domainInfo: domainInfo.split('\n')[0],  // Just the first line as an example
                        isBlacklisted: blacklistInfo.isBlacklisted,
                        blacklistPercentage: blacklistInfo.blacklistPercentage,
                        isSMTPValid: isSMTPValid
                    });
                } else {
                    invalidEmails.push({ email: trimmedEmail, reason: 'No MX records found' });
                }
            } catch (error) {
                invalidEmails.push({ email: trimmedEmail, reason: 'Error during validation' });
            }
        } else {
            invalidEmails.push({ email: trimmedEmail, reason: 'Invalid domain' });
        }
    }

    // Format the invalid emails to return readable strings
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

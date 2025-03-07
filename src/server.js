const express = require('express');
const axios = require('axios');
const whois = require('whois');
const dns = require('dns');
const app = express();

app.use(express.json());

function isBlacklisted(domain) {
    // You would need a proper blacklist check API or service here
    const blacklistedDomains = ['spam.com', 'malicious.com'];
    return blacklistedDomains.includes(domain);
}

function getDomain(email) {
    const domain = email.split('@')[1];
    return domain;
}

function checkMXRecords(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err) {
                reject('Error fetching MX records');
            } else {
                resolve(addresses);
            }
        });
    });
}

function getWhoisInfo(domain) {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, (err, data) => {
            if (err) {
                reject('Error fetching Whois data');
            } else {
                resolve(data);
            }
        });
    });
}

app.post('/validate-emails', async (req, res) => {
    const { emails } = req.body;
    let validEmails = [];
    let invalidEmails = [];

    for (const email of emails) {
        const domain = getDomain(email);

        try {
            const mxRecords = await checkMXRecords(domain);
            const isBlacklistedDomain = isBlacklisted(domain);
            const whoisData = await getWhoisInfo(domain);

            if (mxRecords.length > 0 && !isBlacklistedDomain) {
                validEmails.push({
                    email,
                    domain,
                    mxRecords,
                    whoisData
                });
            } else {
                invalidEmails.push({ email, domain });
            }
        } catch (err) {
            invalidEmails.push({ email, domain, error: err });
        }
    }

    res.json({ validEmails, invalidEmails });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

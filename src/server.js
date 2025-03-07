const express = require('express');
const dns = require('dns');
const axios = require('axios');
const whois = require('whois');
const mxRecords = require('mx-records');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to get WHOIS data
function getWhoisInfo(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
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
          // Get WHOIS data for the domain
          const whoisData = await getWhoisInfo(domain);
          
          // Extract some useful details from the WHOIS data (simplified)
          const whoisDetails = {
            domain: domain,
            registrar: whoisData.match(/Registrar:\s*(\S+)/)?.[1] || "N/A",
            country: whoisData.match(/Country:\s*(\S+)/)?.[1] || "N/A"
          };
          
          validEmails.push({
            email: trimmedEmail,
            domain: domain,
            whois: whoisDetails
          });
        }
      } catch (error) {
        // Domain is not valid or could not fetch WHOIS data
        invalidEmails.push({
          email: trimmedEmail,
          reason: 'Invalid email format or failed WHOIS lookup'
        });
      }
    } else {
      invalidEmails.push({
        email: trimmedEmail,
        reason: 'Invalid domain format'
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

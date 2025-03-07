const express = require('express');
const dns = require('dns'); // Built-in DNS module for domain lookup
const mxRecords = require('mx-records'); // For MX record lookup

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files from 'public'
app.use(express.json()); // To parse JSON bodies

// Function to check if a domain has MX records
const checkMXRecord = (domain) => {
  return new Promise((resolve, reject) => {
    mxRecords(domain, (err, records) => {
      if (err || records.length === 0) {
        reject(`No MX records found for domain: ${domain}`);
      } else {
        resolve(true);
      }
    });
  });
};

// Function to perform DNS lookup for the domain
const checkDNS = (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolve(domain, 'A', (err, addresses) => {
      if (err || !addresses) {
        reject(`No DNS records found for domain: ${domain}`);
      } else {
        resolve(true);
      }
    });
  });
};

// Validate emails and check MX/DNS
app.post('/validate-emails', async (req, res) => {
  const emails = req.body.emails;

  const validEmails = [];
  const invalidEmails = [];

  for (const email of emails) {
    const domain = email.split('@')[1]; // Get the domain part of the email

    try {
      // First, check DNS records for the domain
      await checkDNS(domain);

      // Then, check MX records for the domain
      await checkMXRecord(domain);

      validEmails.push(email); // If both checks pass, consider the email valid
    } catch (err) {
      invalidEmails.push(email); // If any check fails, consider the email invalid
    }
  }

  res.json({ validEmails, invalidEmails });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

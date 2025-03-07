const express = require('express');
const dns = require('dns');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Ensure static files are served from the 'public' directory

// Function to validate email format
const isValidEmailFormat = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Function to perform MX lookup
const checkMXRecord = (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        reject('No MX records found for domain');
      } else {
        resolve(true); // Valid MX record found
      }
    });
  });
};

// Email validation API
app.post('/validate-email', async (req, res) => {
  const email = req.body.email;
  
  if (!isValidEmailFormat(email)) {
    return res.json({ valid: false, message: 'Invalid email format' });
  }

  const domain = email.split('@')[1];

  try {
    await checkMXRecord(domain);  // Check MX record for domain
    return res.json({ valid: true, message: 'Valid email' });
  } catch (err) {
    return res.json({ valid: false, message: 'No valid MX records found for the email domain' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const express = require('express');
const dns = require('dns');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve index.html when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST request to validate email
app.post('/validate-email', (req, res) => {
  const email = req.body.email;

  // Basic email format validation (to ensure it's a valid email format)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ valid: false, message: 'Invalid email format' });
  }

  // Extract the domain from the email
  const domain = email.split('@')[1];

  // Use DNS to lookup MX records for the domain
  dns.resolveMx(domain, (err, addresses) => {
    if (err) {
      return res.status(400).send({ valid: false, message: 'Invalid domain or MX records not found' });
    }

    // Check if MX records are found
    if (addresses && addresses.length > 0) {
      return res.status(200).send({ valid: true, message: 'Email is valid' });
    } else {
      return res.status(400).send({ valid: false, message: 'No MX records found for this domain' });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

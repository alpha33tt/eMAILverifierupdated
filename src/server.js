const express = require('express');
const dns = require('dns');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors());

// Serve 'index.html' on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to validate email
app.post('/validate-email', (req, res) => {
  const email = req.body.email;

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ valid: false, message: 'Invalid email format' });
  }

  const domain = email.split('@')[1];

  // Perform MX record lookup to check if the domain has valid email servers
  dns.resolveMx(domain, (err, addresses) => {
    if (err) {
      return res.status(400).send({ valid: false, message: 'Invalid domain or MX records not found' });
    }

    // Check if MX records exist for the domain
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

// Import necessary modules
const express = require('express');
const axios = require('axios');
const whois = require('whois');
const pino = require('pino');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;  // Use environment port or default to 3000

// Initialize logger
const logger = pino({ level: 'info' });

// Middleware to log each request
app.use((req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  next();
});

// Route for root path "/"
app.get('/', (req, res) => {
  res.send('Welcome to the Email Validation App!');
});

// Example email validation route
app.get('/validate-email', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).send('Email parameter is required');
  }

  try {
    // Placeholder logic for email validation
    const isValidEmail = validateEmail(email); // A mock validation function
    if (isValidEmail) {
      return res.status(200).send(`Email ${email} is valid!`);
    } else {
      return res.status(400).send(`Email ${email} is invalid.`);
    }
  } catch (error) {
    logger.error('Error during email validation', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Placeholder email validation function
function validateEmail(email) {
  // Simple mock validation: check if email contains "@" (this can be more complex)
  return email.includes('@');
}

// Example route to look up domain info (whois query)
app.get('/whois', (req, res) => {
  const { domain } = req.query;
  if (!domain) {
    return res.status(400).send('Domain parameter is required');
  }

  whois.lookup(domain, (err, data) => {
    if (err) {
      logger.error(`Error looking up domain: ${domain}`, err);
      return res.status(500).send('Internal Server Error');
    }
    res.send(data);
  });
});

// Handle 404 errors for routes not found
app.use((req, res) => {
  res.status(404).send('Sorry, we cannot find that route!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

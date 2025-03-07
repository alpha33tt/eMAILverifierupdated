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
// Import necessary modules
const express = require('express');
const axios = require('axios');
const whois = require('whois');
const pino = require('pino');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;  // Use environment port or default to 3000

// Initialize logger
const logger = pino({ level: 'info' });

// Use bodyParser to parse JSON data for POST requests
app.use(bodyParser.json());

// Middleware to log each request
app.use((req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  next();
});

// Route for root path "/"
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Email Validation</title></head>
      <body>
        <h1>Welcome to the Email Validation App!</h1>
        <form action="/validate-email" method="get">
          <label for="email">Enter Email for Validation: </label>
          <input type="email" id="email" name="email" required>
          <button type="submit">Validate Email</button>
        </form>
      </body>
    </html>
  `);
});

// Route to validate email
app.get('/validate-email', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email parameter is required');
  }

  try {
    // Perform basic email validation
    const isValidEmail = validateEmail(email);
    let validationMessage = '';

    if (isValidEmail) {
      validationMessage = `Email ${email} is valid!`;
    } else {
      validationMessage = `Email ${email} is invalid. Please enter a valid email address.`;
    }

    res.send(`
      <html>
        <head><title>Email Validation</title></head>
        <body>
          <h1>${validationMessage}</h1>
          <a href="/">Go Back</a>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error during email validation', error);
    return res.status(500).send('Internal Server Error');
  }
});

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

// Placeholder email validation function (basic check)
function validateEmail(email) {
  // Simple mock validation: check if email contains "@" and "."
  return email.includes('@') && email.includes('.');
}

// Handle 404 errors for routes not found
app.use((req, res) => {
  res.status(404).send('Sorry, we cannot find that route!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

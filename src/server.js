const express = require('express');
const emailVerifier = require('email-verifier'); // Make sure you have a correct email verification library installed
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files from 'public'
app.use(express.json()); // To parse JSON bodies

app.post('/validate-emails', (req, res) => {
  const emails = req.body.emails;

  // Simulate email validation process
  const validEmails = [];
  const invalidEmails = [];

  emails.forEach(email => {
    emailVerifier.verify(email, (err, data) => {
      if (data.isValid) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }

      if (emails.length === validEmails.length + invalidEmails.length) {
        // Send the result after all emails are validated
        res.json({ validEmails, invalidEmails });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

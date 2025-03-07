function validateEmails() {
    const emailInput = document.getElementById('emails').value;
    const emails = emailInput.split(',').map(email => email.trim());
    
    fetch('/validate-emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails: emails })
    })
    .then(response => response.json())
    .then(data => {
        // Display valid emails
        const validEmailsSection = document.getElementById('valid-emails');
        const invalidEmailsSection = document.getElementById('invalid-emails');

        // Format and display valid emails
        validEmailsSection.innerHTML = JSON.stringify(data.validEmails, null, 2);

        // Format and display invalid emails
        invalidEmailsSection.innerHTML = JSON.stringify(data.invalidEmails, null, 2);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

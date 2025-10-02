const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Stub authentication endpoints
app.post('/api/auth/signup', (req, res) => {
  // Stub response
  res.json({
    success: true,
    message: 'User created successfully',
    user: {
      id: '12345',
      username: 'testuser',
      email: 'test@example.com'
    },
    token: 'stub_token_12345'
  });
});

app.post('/api/auth/signin', (req, res) => {
  // Stub response
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: '12345',
      username: 'testuser',
      email: 'test@example.com'
    },
    token: 'stub_token_12345'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
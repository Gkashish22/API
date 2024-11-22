const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const plansRoutes = require('./routes/plans');
const usersRoutes = require('./routes/users'); // Add user-related routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(
  session({
    secret: 'your_secret_key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
  })
);

// Routes
app.use('/api/plans', plansRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Plans API!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

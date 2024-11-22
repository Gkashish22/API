const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const router = express.Router();

// User Registration
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error during signup:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    res.status(200).json({ message: 'Logged in successfully!', userId: user.id });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// User Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout.' });
    }
    res.status(200).json({ message: 'Logged out successfully!' });
  });
});

// Add Friend
router.post('/add-friend', async (req, res) => {
  const { userId, friendId } = req.body;

  try {
    await db.execute('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, friendId]);
    res.status(201).json({ message: 'Friend added successfully!' });
  } catch (err) {
    console.error('Error adding friend:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Remove Friend
router.delete('/remove-friend', async (req, res) => {
  const { userId, friendId } = req.body;

  try {
    await db.execute(
      'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
      [userId, friendId]
    );
    res.status(200).json({ message: 'Friend removed successfully.' });
  } catch (err) {
    console.error('Error removing friend:', err.message);
    res.status(500).json({ error: err.message });
  }
});
router.get('/:userId/friends', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const query = `
        SELECT u.id, u.username, u.email 
        FROM users u
        INNER JOIN friends f ON u.id = f.friend_id
        WHERE f.user_id = ?
      `;
      const [friends] = await db.execute(query, [userId]);
  
      res.status(200).json(friends);
    } catch (err) {
      console.error('Error fetching friends:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;

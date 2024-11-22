const express = require('express');
const db = require('../models/db');
const router = express.Router();
const moment = require('moment');  // To help with date calculations

// List Plans with Advanced Filtering, Sorting, and Timeline
router.get('/list', async (req, res) => {
  const {
    user_id,
    filter_by_people,
    category,
    price_min,
    price_max,
    location,
    duration,
    sort_by,
    sort_order,
    timeline,
    months_within,
    years_within,
  } = req.query;

  // Check if user_id is provided when filtering by people
  if ((filter_by_people === 'friends' || filter_by_people === 'friends_of_friends') && !user_id) {
    return res.status(400).json({ error: 'user_id is required for friends or friends_of_friends filters.' });
  }

  let query = 'SELECT * FROM plans WHERE 1=1';
  const params = [];

  // Filter by friends or friends of friends
  if (filter_by_people === 'friends') {
    query += `
      AND posted_by IN (
        SELECT friend_id FROM friends WHERE user_id = ?
        UNION
        SELECT user_id FROM friends WHERE friend_id = ?
      )
    `;
    params.push(user_id, user_id);
  } else if (filter_by_people === 'friends_of_friends') {
    query += `
      AND posted_by IN (
        SELECT friend_id FROM friends WHERE user_id IN (
          SELECT friend_id FROM friends WHERE user_id = ?
        )
      )
    `;
    params.push(user_id);
  }

  // Filter by category
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  // Filter by price range
  if (price_min) {
    query += ' AND price >= ?';
    params.push(price_min);
  }
  if (price_max) {
    query += ' AND price <= ?';
    params.push(price_max);
  }

  // Filter by location
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }

  // Filter by duration
  if (duration) {
    query += ' AND duration = ?';
    params.push(duration);
  }

  // Timeline filtering - Active or Upcoming
  if (timeline === 'active') {
    query += ' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE';
  } else if (timeline === 'upcoming') {
    query += ' AND start_date > CURRENT_DATE';
  }

  // Filter by time range (Months or Years)
  if (months_within) {
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() + parseInt(months_within));
    query += ' AND start_date <= ?';
    params.push(dateLimit.toISOString().split('T')[0]);
  }

  if (years_within) {
    const dateLimit = new Date();
    dateLimit.setFullYear(dateLimit.getFullYear() + parseInt(years_within));
    query += ' AND start_date <= ?';
    params.push(dateLimit.toISOString().split('T')[0]);
  }

  // Sorting logic
  if (sort_by) {
    if (sort_by === 'posted_date') {
      query += ' ORDER BY created_at';
    } else if (sort_by === 'given_dates') {
      query += ' ORDER BY start_date';
    }

    if (sort_order && ['asc', 'desc'].includes(sort_order.toLowerCase())) {
      query += ` ${sort_order.toUpperCase()}`;
    } else {
      query += ' ASC'; // Default to ascending order
    }
  }

  try {
    const [plans] = await db.execute(query, params);
    res.status(200).json(plans);
  } catch (err) {
    console.error('Error fetching plans:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Create a New Plan
router.post('/', async (req, res) => {
  const {
    title,
    description,
    price,
    duration,
    category,
    location,
    location_lat,
    location_lon,
    features,
    start_date,
    end_date,
    max_participants,
    posted_by,
  } = req.body;

  try {
    await db.execute(
      `INSERT INTO plans 
      (title, description, price, duration, category, location, location_lat, location_lon, features, start_date, end_date, max_participants, posted_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        price,
        duration,
        category,
        location,
        location_lat,
        location_lon,
        features,
        start_date,
        end_date,
        max_participants,
        posted_by,
      ]
    );
    res.status(201).json({ message: 'Plan created successfully!' });
  } catch (err) {
    console.error('Error creating plan:', err.message);
    res.status(500).json({ error: err.message });
  }
});



// PUT route to update a plan
router.put('/:planId', async (req, res) => {
  const { planId } = req.params;  // Extract plan ID from the URL
  const { title, description, price, duration, category, location, location_lat, location_lon, features, start_date, end_date, max_participants } = req.body;

  // Ensure required fields are provided
  if (!title || !description || !price || !duration || !category || !location || !location_lat || !location_lon || !features || !start_date || !end_date || !max_participants) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // SQL query to update the plan
    const query = `
      UPDATE plans 
      SET title = ?, description = ?, price = ?, duration = ?, category = ?, location = ?, location_lat = ?, location_lon = ?, features = ?, start_date = ?, end_date = ?, max_participants = ?
      WHERE id = ?
    `;
    
    // Execute the query
    await db.execute(query, [title, description, price, duration, category, location, location_lat, location_lon, features, start_date, end_date, max_participants, planId]);

    res.status(200).json({ message: 'Plan updated successfully!' });
  } catch (err) {
    console.error('Error updating plan:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


// Delete a Plan
router.delete('/:planId', async (req, res) => {
  const { planId } = req.params;

  try {
    await db.execute('DELETE FROM plans WHERE id = ?', [planId]);
    res.status(200).json({ message: 'Plan deleted successfully.' });
  } catch (err) {
    console.error('Error deleting plan:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

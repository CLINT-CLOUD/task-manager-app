const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');

// ✅ Create a new task
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, status, priority, email } = req.body;

  try {
    const newTask = await Task.create({
      title,
      description,
      status,
      priority,
      assignedTo: email,             // assigned using email string
      createdBy: req.user.id,        // ✅ use user ID for ObjectId reference
    });

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// ✅ Get all tasks created by or assigned to the current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const tasks = await Task.find({
      $or: [
        { createdBy: userId },        // ✅ match ObjectId properly
        { assignedTo: userEmail },    // string match on email
      ],
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// ✅ Get only tasks assigned to the current user
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const tasks = await Task.find({ assignedTo: userEmail });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching my tasks', error: err.message });
  }
});

module.exports = router;

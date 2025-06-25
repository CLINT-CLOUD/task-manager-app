const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');

// ✅ Create a new task (with status normalization and deadline support)
router.post('/', authMiddleware, async (req, res) => {
  let { title, description, status = 'Pending', priority, email, deadline } = req.body;

  // Normalize status to Title Case
  status = status
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  try {
    const newTask = await Task.create({
      title,
      description,
      status,
      priority,
      deadline, // ✅ New
      assignedTo: email,
      createdBy: req.user.id,
    });

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// ✅ Get all tasks created by or assigned to current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const tasks = await Task.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userEmail },
      ],
    }).populate('createdBy', 'name email');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// ✅ Get only tasks assigned to current user — used by UserDashboard
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const tasks = await Task.find({ assignedTo: userEmail });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching my tasks', error: err.message });
  }
});

// ✅ Get tasks assigned to user — used by Dashboard.js for grouped view
router.get('/assigned', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const tasks = await Task.find({ assignedTo: userEmail });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assigned tasks', error: err.message });
  }
});

// ✅ Admin: Get all tasks
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const query = {};
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all tasks', error: err.message });
  }
});

// ✅ Admin/User: Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;

    if (req.user.role === 'admin') {
      const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, { new: true });
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.json(updatedTask);
    }

    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.email },
      ],
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const currentStatus = task.status?.toLowerCase();
    if (currentStatus === 'complete' || currentStatus === 'completed') {
      return res.status(400).json({ message: 'Cannot update a task that is already completed.' });
    }

    task.status = req.body.status;
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

// ✅ Admin: Delete any task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete tasks' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
});

// ✅ Admin: Get task counts grouped by status
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const rawStats = await Task.aggregate([
      {
        $group: {
          _id: {
            $trim: {
              input: { $toUpper: "$status" }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    const allStatuses = ['PENDING', 'WORKING', 'IN PROGRESS', 'COMPLETED'];
    const stats = allStatuses.map(status => {
      const match = rawStats.find(s => s.status === status);
      return { status, count: match ? match.count : 0 };
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;

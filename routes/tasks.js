// routes/tasks.js - Task Routes
const express = require('express');
const router = express.Router();

// Import database pool
const { pool } = require('../config/database');

// GET /api/tasks - Get all tasks or filter by category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    let params = [];
    
    if (category && category !== 'all') {
      query = 'SELECT * FROM tasks WHERE category = ? ORDER BY created_at DESC';
      params = [category];
    }
    
    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const { title, category } = req.body;
    
    // Validation
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }
    
    if (!['personal', 'work'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Category must be either "personal" or "work"'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO tasks (title, category) VALUES (?, ?)',
      [title, category]
    );
    
    // Fetch the created task
    const [newTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask[0]
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// GET /api/tasks/:id - Get single task by ID
router.get('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, category, completed } = req.body;
    
    // Check if task exists
    const [existingTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (existingTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (category !== undefined) {
      if (!['personal', 'work'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Category must be either "personal" or "work"'
        });
      }
      updates.push('category = ?');
      values.push(category);
    }
    
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    values.push(taskId);
    await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Fetch updated task
    const [updatedTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask[0]
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

module.exports = router;
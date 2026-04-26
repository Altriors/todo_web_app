// server.js - Main Node.js Server Application
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Start server function
async function startServer() {
  try {
    // Initialize database first
    const { initializeDatabase, pool } = require('./config/database');
    await initializeDatabase();
    
    console.log('Database initialized, setting up routes...');
    
    // Import and setup task routes
    const tasksRoutes = require('./routes/tasks');
    app.use('/api/tasks', tasksRoutes);
    
    // Stats endpoint - direct implementation to avoid routing conflicts
    app.get('/api/stats', async (req, res) => {
      try {
        const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM tasks');
        const [personalResult] = await pool.execute('SELECT COUNT(*) as personal FROM tasks WHERE category = ?', ['personal']);
        const [workResult] = await pool.execute('SELECT COUNT(*) as work FROM tasks WHERE category = ?', ['work']);
        const [completedResult] = await pool.execute('SELECT COUNT(*) as completed FROM tasks WHERE completed = ?', [true]);
        
        res.json({
          success: true,
          data: {
            total: totalResult[0].total,
            personal: personalResult[0].personal,
            work: workResult[0].work,
            completed: completedResult[0].completed,
            pending: totalResult[0].total - completedResult[0].completed
          }
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch statistics'
        });
      }
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });
    
    // Serve the main HTML file
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Express error:', err.stack);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    });
    
    // Handle 404 - must be last
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
      });
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running successfully on port ${PORT}`);
      console.log(`🌐 Access the application at: http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at: http://localhost:${PORT}/api/`);
    });
    
    // Graceful shutdown handler
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      try {
        await pool.end();
        console.log('✅ Database connections closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

module.exports = app;
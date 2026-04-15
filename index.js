const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database connection
const { connectDB } = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const batchRoutes = require('./src/routes/batchRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const testRoutes = require('./src/routes/testRoutes');
const classRoutes = require('./src/routes/classRoutes');
const centreRoutes = require('./src/routes/centreRoutes');
const instructorRoutes = require('./src/routes/instructorRoutes');
const studentRoutes = require('./src/routes/students.jsx');
const bookRoutes = require('./src/routes/bookroutes');
const getStartedRoutes = require('./src/routes/getStartedRoutes');

// Import error handlers
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Increase body size limits to handle larger JSON payloads (e.g., base64 images)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from public directory
app.use('/Uploads', express.static(path.join(__dirname, 'public', 'Uploads')));

// Simple logging to console
app.use(morgan('dev'));

// Connect to database
connectDB();

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/bookdemo', bookRoutes);
app.use('/api/get-started', getStartedRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Initialize Socket.IO
const { initializeSocket } = require('./src/socket/socketServer');
initializeSocket(server);

module.exports = app;

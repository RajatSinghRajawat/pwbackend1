const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/authsuermodel');
const Class = require('../models/Classmodel');

// Store active connections per class
const classRooms = new Map(); // classId -> Set of socketIds
const socketUsers = new Map(); // socketId -> { userId, userName, classId }

let io;

// Initialize Socket.IO server
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                // Allow anonymous connections but mark them as guest
                socket.userId = null;
                socket.userName = 'Guest';
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id).select('name email');
            
            if (!user) {
                socket.userId = null;
                socket.userName = 'Guest';
                return next();
            }

            socket.userId = user._id.toString();
            socket.userName = user.name || user.email;
            next();
        } catch (error) {
            // Allow connection even if auth fails (guest mode)
            socket.userId = null;
            socket.userName = 'Guest';
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id} (${socket.userName || 'Guest'})`);

        // Join live class room
        socket.on('join_class', async (data) => {
            try {
                const { classId } = data;
                
                if (!classId) {
                    socket.emit('error', { message: 'Class ID is required' });
                    return;
                }

                // Verify class exists and is live
                const classData = await Class.findById(classId);

                if (!classData) {
                    socket.emit('error', { message: 'Class not found' });
                    return;
                }

                // Join the room
                socket.join(`class_${classId}`);
                
                // Store user info
                socketUsers.set(socket.id, {
                    userId: socket.userId,
                    userName: socket.userName || 'Guest',
                    classId: classId
                });

                // Add to class room tracking
                if (!classRooms.has(classId)) {
                    classRooms.set(classId, new Set());
                }
                classRooms.get(classId).add(socket.id);

                // Add attendee to class if user is authenticated
                if (socket.userId) {
                    const existingAttendee = classData.attendees.find(
                        a => a.userId.toString() === socket.userId
                    );

                    if (!existingAttendee) {
                        classData.attendees.push({
                            userId: socket.userId,
                            joinedAt: new Date()
                        });
                        await classData.save();
                    }
                }

                // Get current participants count
                const participantsCount = classRooms.get(classId)?.size || 0;

                // Notify the user they joined
                socket.emit('joined_class', {
                    classId,
                    participantsCount,
                    classData: {
                        title: classData.title,
                        instructor: 'Instructor',
                        status: classData.status
                    }
                });

                // Notify others in the room
                socket.to(`class_${classId}`).emit('user_joined', {
                    userName: socket.userName || 'Guest',
                    participantsCount
                });

                // Send initial class state
                socket.emit('class_state', {
                    classId,
                    participantsCount,
                    isLive: classData.status === 'live',
                    startTime: classData.startTime,
                    endTime: classData.endTime
                });

                console.log(`User ${socket.userName || 'Guest'} joined class ${classId}`);
            } catch (error) {
                console.error('Error joining class:', error);
                socket.emit('error', { message: 'Error joining class', error: error.message });
            }
        });

        // Leave live class room
        socket.on('leave_class', async (data) => {
            try {
                const { classId } = data;
                const userInfo = socketUsers.get(socket.id);

                if (classId) {
                    socket.leave(`class_${classId}`);

                    // Remove from class room tracking
                    if (classRooms.has(classId)) {
                        classRooms.get(classId).delete(socket.id);
                        const participantsCount = classRooms.get(classId).size;

                        // Notify others
                        socket.to(`class_${classId}`).emit('user_left', {
                            userName: userInfo?.userName || 'Guest',
                            participantsCount
                        });

                        // Update attendee in database if user is authenticated
                        if (userInfo?.userId) {
                            const classData = await Class.findById(classId);
                            if (classData) {
                                const attendee = classData.attendees.find(
                                    a => a.userId.toString() === userInfo.userId
                                );
                                if (attendee && !attendee.leftAt) {
                                    attendee.leftAt = new Date();
                                    const joinedAt = attendee.joinedAt || new Date();
                                    attendee.duration = Math.floor((new Date() - joinedAt) / 1000 / 60); // in minutes
                                    await classData.save();
                                }
                            }
                        }
                    }
                }

                socketUsers.delete(socket.id);
                console.log(`User ${userInfo?.userName || 'Guest'} left class ${classId || 'unknown'}`);
            } catch (error) {
                console.error('Error leaving class:', error);
            }
        });

        // Send chat message
        socket.on('send_message', async (data) => {
            try {
                const { classId, message } = data;
                const userInfo = socketUsers.get(socket.id);

                if (!classId || !message) {
                    socket.emit('error', { message: 'Class ID and message are required' });
                    return;
                }

                const messageData = {
                    id: `msg_${Date.now()}_${socket.id}`,
                    userName: userInfo?.userName || 'Guest',
                    userId: userInfo?.userId || null,
                    message: message.trim(),
                    timestamp: new Date(),
                    isInstructor: false // Can be enhanced to check if user is instructor
                };

                // Broadcast to all in the class room
                io.to(`class_${classId}`).emit('new_message', messageData);

                console.log(`Message sent in class ${classId} by ${userInfo?.userName || 'Guest'}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message', error: error.message });
            }
        });

        // Update video time (for synchronization)
        socket.on('video_time_update', (data) => {
            try {
                const { classId, currentTime } = data;
                // Broadcast to others (not sender) if instructor
                // This allows instructor to control playback for all students
                socket.to(`class_${classId}`).emit('video_time_sync', {
                    currentTime,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Error updating video time:', error);
            }
        });

        // Get current participants
        socket.on('get_participants', (data) => {
            try {
                const { classId } = data;
                const participants = Array.from(classRooms.get(classId) || [])
                    .map(socketId => socketUsers.get(socketId))
                    .filter(Boolean);

                socket.emit('participants_list', {
                    classId,
                    participants: participants.map(p => ({
                        userName: p.userName,
                        userId: p.userId
                    })),
                    count: participants.length
                });
            } catch (error) {
                console.error('Error getting participants:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            try {
                const userInfo = socketUsers.get(socket.id);
                
                if (userInfo?.classId) {
                    const classId = userInfo.classId;
                    
                    // Remove from class room tracking
                    if (classRooms.has(classId)) {
                        classRooms.get(classId).delete(socket.id);
                        const participantsCount = classRooms.get(classId).size;

                        // Notify others
                        socket.to(`class_${classId}`).emit('user_left', {
                            userName: userInfo.userName || 'Guest',
                            participantsCount
                        });

                        // Update attendee in database
                        if (userInfo.userId) {
                            const classData = await Class.findById(classId);
                            if (classData) {
                                const attendee = classData.attendees.find(
                                    a => a.userId.toString() === userInfo.userId
                                );
                                if (attendee && !attendee.leftAt) {
                                    attendee.leftAt = new Date();
                                    const joinedAt = attendee.joinedAt || new Date();
                                    attendee.duration = Math.floor((new Date() - joinedAt) / 1000 / 60);
                                    await classData.save();
                                }
                            }
                        }
                    }
                }

                socketUsers.delete(socket.id);
                console.log(`User disconnected: ${socket.id}`);
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });

    return io;
};

// Helper function to get socket instance
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO
};



// Simple validation middleware without express-validator
// Can be enhanced later with express-validator if needed

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = req.validationErrors || [];
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }
    next();
};

// Course validation
const validateCourse = {
    create: (req, res, next) => {
        const errors = [];
        const { title, description, category, price, originalPrice } = req.body;

        if (!title || title.trim().length < 3 || title.trim().length > 200) {
            errors.push({ field: 'title', message: 'Title is required and must be between 3 and 200 characters' });
        }

        if (!description || description.trim().length < 10) {
            errors.push({ field: 'description', message: 'Description is required and must be at least 10 characters' });
        }

        const validCategories = ['jee', 'neet', 'gate', 'upsc', 'defence', 'ese', 'foundation', 'commerce', 'arts', 'tech', 'business', 'design', 'marketing', 'data', 'other'];
        if (!category || !validCategories.includes(category)) {
            errors.push({ field: 'category', message: 'Valid category is required' });
        }

        if (!price || isNaN(price) || price < 0) {
            errors.push({ field: 'price', message: 'Price must be a positive number' });
        }

        if (!originalPrice || isNaN(originalPrice) || originalPrice < 0) {
            errors.push({ field: 'originalPrice', message: 'Original price must be a positive number' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    update: (req, res, next) => {
        const errors = [];
        const { id } = req.params;
        const { title, description, price, originalPrice } = req.body;

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            errors.push({ field: 'id', message: 'Invalid course ID' });
        }

        if (title && (title.trim().length < 3 || title.trim().length > 200)) {
            errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters' });
        }

        if (description && description.trim().length < 10) {
            errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
        }

        if (price !== undefined && (isNaN(price) || price < 0)) {
            errors.push({ field: 'price', message: 'Price must be a positive number' });
        }

        if (originalPrice !== undefined && (isNaN(originalPrice) || originalPrice < 0)) {
            errors.push({ field: 'originalPrice', message: 'Original price must be a positive number' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    getById: (req, res, next) => {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
        }
        next();
    },
    delete: (req, res, next) => {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
        }
        next();
    }
};

// Batch validation
const validateBatch = {
    create: (req, res, next) => {
        const errors = [];
        const { title, description, courseId, examType, instructorId, startDate, endDate, duration, totalClasses, maxStudents, price, originalPrice } = req.body;

        if (!title || title.trim().length < 3 || title.trim().length > 200) {
            errors.push({ field: 'title', message: 'Title is required and must be between 3 and 200 characters' });
        }

        if (!description || description.trim().length < 10) {
            errors.push({ field: 'description', message: 'Description is required and must be at least 10 characters' });
        }

        if (!courseId || !courseId.match(/^[0-9a-fA-F]{24}$/)) {
            errors.push({ field: 'courseId', message: 'Valid course ID is required' });
        }

        const validExamTypes = ['jee', 'neet', 'gate', 'upsc', 'defence', 'ese', 'foundation', 'commerce', 'arts', 'other'];
        if (!examType || !validExamTypes.includes(examType)) {
            errors.push({ field: 'examType', message: 'Valid exam type is required' });
        }

        if (!instructorId || !instructorId.match(/^[0-9a-fA-F]{24}$/)) {
            errors.push({ field: 'instructorId', message: 'Valid instructor ID is required' });
        }

        if (!startDate || isNaN(new Date(startDate).getTime())) {
            errors.push({ field: 'startDate', message: 'Valid start date is required' });
        }

        if (!endDate || isNaN(new Date(endDate).getTime())) {
            errors.push({ field: 'endDate', message: 'Valid end date is required' });
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            errors.push({ field: 'endDate', message: 'End date must be after start date' });
        }

        if (!duration || duration.trim().length === 0) {
            errors.push({ field: 'duration', message: 'Duration is required' });
        }

        if (totalClasses === undefined || isNaN(totalClasses) || totalClasses < 0) {
            errors.push({ field: 'totalClasses', message: 'Total classes must be a non-negative integer' });
        }

        if (!maxStudents || isNaN(maxStudents) || maxStudents < 1) {
            errors.push({ field: 'maxStudents', message: 'Max students must be at least 1' });
        }

        if (!price || isNaN(price) || price < 0) {
            errors.push({ field: 'price', message: 'Price must be a positive number' });
        }

        if (!originalPrice || isNaN(originalPrice) || originalPrice < 0) {
            errors.push({ field: 'originalPrice', message: 'Original price must be a positive number' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    update: (req, res, next) => {
        const errors = [];
        const { id } = req.params;
        const { title, price } = req.body;

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            errors.push({ field: 'id', message: 'Invalid batch ID' });
        }

        if (title && (title.trim().length < 3 || title.trim().length > 200)) {
            errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters' });
        }

        if (price !== undefined && (isNaN(price) || price < 0)) {
            errors.push({ field: 'price', message: 'Price must be a positive number' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    getById: (req, res, next) => {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid batch ID'
            });
        }
        next();
    },
    delete: (req, res, next) => {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid batch ID'
            });
        }
        next();
    }
};

// Auth validation
const validateAuth = {
    register: (req, res, next) => {
        const errors = [];
        const { name, email, password, phone } = req.body;

        if (!name || name.trim().length < 2 || name.trim().length > 50) {
            errors.push({ field: 'name', message: 'Name is required and must be between 2 and 50 characters' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Valid email is required' });
        }

        if (!password || password.length < 6) {
            errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phone || !phoneRegex.test(phone)) {
            errors.push({ field: 'phone', message: 'Phone must be exactly 10 digits' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    login: (req, res, next) => {
        const errors = [];
        const { email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Valid email is required' });
        }

        if (!password) {
            errors.push({ field: 'password', message: 'Password is required' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    updatePassword: (req, res, next) => {
        const errors = [];
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword) {
            errors.push({ field: 'oldPassword', message: 'Old password is required' });
        }

        if (!newPassword || newPassword.length < 6) {
            errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    }
};

// Admin validation
const validateAdmin = {
    create: (req, res, next) => {
        const errors = [];
        const { name, email, password, phone } = req.body;

        if (!name || name.trim().length === 0) {
            errors.push({ field: 'name', message: 'Name is required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Valid email is required' });
        }

        if (!password || password.length < 6) {
            errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        if (!phone || phone.trim().length === 0) {
            errors.push({ field: 'phone', message: 'Phone is required' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    },
    login: (req, res, next) => {
        const errors = [];
        const { email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Valid email is required' });
        }

        if (!password) {
            errors.push({ field: 'password', message: 'Password is required' });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    }
};

// Pagination validation
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (isNaN(page) || parseInt(page) < 1)) {
        return res.status(400).json({
            success: false,
            message: 'Page must be a positive integer'
        });
    }

    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be between 1 and 100'
        });
    }

    next();
};

module.exports = {
    handleValidationErrors,
    validateCourse,
    validateBatch,
    validateAuth,
    validateAdmin,
    validatePagination
};

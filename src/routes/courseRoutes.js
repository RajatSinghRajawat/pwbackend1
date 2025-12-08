const express = require('express');
const router = express.Router();
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCoursesByCategory,
    getFeaturedCourses,
    getPopularCourses,
    updateCourseRating,
    incrementStudentCount
} = require('../controller/CourseController');
const { validateCourse, validatePagination } = require('../middleware/validation');
const { authenticateUser, authenticateAdmin, authorize } = require('../middleware/auth');
const { fieldsImages } = require('../../multer');

// Public routes
router.get('/', validatePagination, getAllCourses);
router.get('/featured', getFeaturedCourses);
router.get('/popular', getPopularCourses);
router.get('/category/:category', getCoursesByCategory);
router.get('/:id', validateCourse.getById, getCourseById);

// Protected routes (Admin only)
router.post('/createCourse',  fieldsImages, createCourse);
router.put('/update/:id',  fieldsImages ,updateCourse);
router.delete('/:id',  validateCourse.delete, deleteCourse);

// Protected routes (User/Admin)
router.put('/:id/rating',  updateCourseRating);
router.put('/:id/students',  incrementStudentCount);

module.exports = router;


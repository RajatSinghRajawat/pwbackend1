const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { validateAdmin } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/auth');
const {
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    updateAdminStatus,
    registerAdmin,
    loginAdmin
} = require('../controller/AdminController');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);


router.get('/list',  getAllAdmins);

router.get('/:id',  getAdminById);

router.put('/:id', updateAdmin);

router.delete('/:id',  deleteAdmin);

router.put('/:id/status',  updateAdminStatus);

module.exports = router;



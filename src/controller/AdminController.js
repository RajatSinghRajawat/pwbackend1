const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin with hashed password
        const admin = await Admin.create({ 
            name, 
            email, 
            password: hashedPassword,
            phone 
        });

        // Generate token
        const token = jwt.sign(
            { id: admin._id, role: admin.role }, 
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering admin',
            error: error.message
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find admin
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, role: admin.role }, 
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        // Return success response with token and admin data
        res.status(200).json({
            success: true,
            message: 'Admin logged in successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    phone: admin.phone,
                    role: admin.role
                },
                token: token
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error logging in admin", 
            error: error.message 
        });
    }
};
  

const getAllAdmins = async (req, res) => {
    try {
        const { isActive, role, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (role) filter.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const admins = await Admin.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Admin.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: admins,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching admins',
            error: error.message
        });
    }
};

const getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching admin',
            error: error.message
        });
    }
};

const updateAdmin = async (req, res) => {
    try {
        // Check authorization
        if (req.admin.role !== 'super-admin' && req.admin._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this admin'
            });
        }

        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin updated successfully',
            data: admin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating admin',
            error: error.message
        });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can delete admins'
            });
        }

        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully',
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting admin',
            error: error.message
        });
    }
};

const updateAdminStatus = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can update admin status'
            });
        }

        const { isActive } = req.body;

        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { isActive, updatedAt: Date.now() },
            { new: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin status updated successfully',
            data: admin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating admin status',
            error: error.message
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    updateAdminStatus
};

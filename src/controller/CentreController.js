const Centre = require('../models/Centremodel');

// @desc    Get all centres
// @route   GET /api/centres
// @access  Public
const getAllCentres = async (req, res) => {
    try {
        const {
            city,
            state,
            isActive,
            isOpen,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (city) filter['address.city'] = city;
        if (state) filter['address.state'] = state;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isOpen !== undefined) filter.isOpen = isOpen === 'true';

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const centres = await Centre.find(filter)
            .populate('courses', 'title')
            .populate('batches', 'title')
            .populate('instructors', 'name')
            .sort({ rating: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Centre.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: centres,
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
            message: 'Error fetching centres',
            error: error.message
        });
    }
};

// @desc    Get centre by ID
// @route   GET /api/centres/:id
// @access  Public
const getCentreById = async (req, res) => {
    try {
        const centre = await Centre.findById(req.params.id)
            .populate('courses')
            .populate('batches')
            .populate('instructors');

        if (!centre) {
            return res.status(404).json({
                success: false,
                message: 'Centre not found'
            });
        }

        res.status(200).json({
            success: true,
            data: centre
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching centre',
            error: error.message
        });
    }
};

// @desc    Create centre
// @route   POST /api/centres
// @access  Private (Admin)
const createCentre = async (req, res) => {
    try {
        const centre = new Centre(req.body);
        const savedCentre = await centre.save();
        await savedCentre.populate('courses batches instructors');

        res.status(201).json({
            success: true,
            message: 'Centre created successfully',
            data: savedCentre
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating centre',
            error: error.message
        });
    }
};

// @desc    Update centre
// @route   PUT /api/centres/:id
// @access  Private (Admin)
const updateCentre = async (req, res) => {
    try {
        const centre = await Centre.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('courses batches instructors');

        if (!centre) {
            return res.status(404).json({
                success: false,
                message: 'Centre not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Centre updated successfully',
            data: centre
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating centre',
            error: error.message
        });
    }
};

// @desc    Delete centre
// @route   DELETE /api/centres/:id
// @access  Private (Admin)
const deleteCentre = async (req, res) => {
    try {
        const centre = await Centre.findByIdAndDelete(req.params.id);

        if (!centre) {
            return res.status(404).json({
                success: false,
                message: 'Centre not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Centre deleted successfully',
            data: centre
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting centre',
            error: error.message
        });
    }
};

// @desc    Find centres by location
// @route   GET /api/centres/nearby
// @access  Public
const findNearbyCentres = async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const centres = await Centre.find({
            isActive: true,
            isOpen: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        })
            .limit(10);

        res.status(200).json({
            success: true,
            count: centres.length,
            data: centres
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finding nearby centres',
            error: error.message
        });
    }
};

module.exports = {
    getAllCentres,
    getCentreById,
    createCentre,
    updateCentre,
    deleteCentre,
    findNearbyCentres
};


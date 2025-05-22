const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');

const router = express.Router();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);


// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

module.exports = router;
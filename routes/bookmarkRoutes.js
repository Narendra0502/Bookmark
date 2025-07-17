const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  createBookmark, 
  getBookmarks, 
  getBookmarkById, 
  updateBookmark, 
  deleteBookmark, 
  regenerateSummary,
  reorderBookmarks 
} = require('../controllers/bookmarkController');

const router = express.Router();



// @route   POST /api/bookmarks
// @desc    Create a new bookmark
// @access  Private
router.post('/', protect, createBookmark);

// @route   GET /api/bookmarks
// @desc    Get all bookmarks for a user
// @access  Private
router.get('/', protect, getBookmarks);

// @route   GET /api/bookmarks/:id
// @desc    Get a bookmark by ID
// @access  Private
router.get('/:id', protect, getBookmarkById);

// @route   PUT /api/bookmarks/reorder
// @desc    Reorder bookmarks
// @access  Private
router.put('/reorder', protect, reorderBookmarks);

// @route   PUT /api/bookmarks/:id
// @desc    Update a bookmark
// @access  Private
router.put('/:id', protect, updateBookmark);

// @route   DELETE /api/bookmarks/:id
// @desc    Delete a bookmark
// @access  Private
router.delete('/:id', protect, deleteBookmark);

// @route   POST /api/bookmarks/:id/regenerate-summary
// @desc    Regenerate summary for a bookmark
// @access  Private
router.post('/:id/regenerate-summary', protect, regenerateSummary);

module.exports = router;
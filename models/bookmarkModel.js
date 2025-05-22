const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  favicon: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
bookmarkSchema.index({ userId: 1, createdAt: -1 });
bookmarkSchema.index({ userId: 1, tags: 1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
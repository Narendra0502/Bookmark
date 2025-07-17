const axios = require('axios');
const cheerio = require('cheerio');
const Bookmark = require('../models/bookmarkModel');

// Utility function to extract metadata from URL
async function extractMetadata(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const urlObj = new URL(url);
    
    // Extract title
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content')?.trim() || 
                 $('meta[name="title"]').attr('content')?.trim() || 
                 url;
    
    // Extract favicon with multiple selectors in priority order
    let favicon = null;
    
    // Try different favicon selectors in order of preference
    const faviconSelectors = [
      'link[rel="icon"][sizes="32x32"]',
      'link[rel="icon"][sizes="16x16"]', 
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];
    
    for (const selector of faviconSelectors) {
      const faviconHref = $(selector).attr('href');
      if (faviconHref) {
        favicon = faviconHref;
        break;
      }
    }
    
    // If no favicon found in HTML, try default locations
    if (!favicon) {
      const defaultPaths = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png'];
      
      for (const path of defaultPaths) {
        try {
          const testUrl = `${urlObj.protocol}//${urlObj.host}${path}`;
          const testResponse = await axios.head(testUrl, { timeout: 5000 });
          if (testResponse.status === 200) {
            favicon = testUrl;
            break;
          }
        } catch (error) {
          // Continue to next default path
          continue;
        }
      }
    }
    
    // Convert relative URLs to absolute URLs
    if (favicon) {
      if (favicon.startsWith('//')) {
        // Protocol-relative URL
        favicon = `${urlObj.protocol}${favicon}`;
      } else if (favicon.startsWith('/')) {
        // Root-relative URL  
        favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`;
      } else if (!favicon.startsWith('http')) {
        // Relative URL
        favicon = `${urlObj.protocol}//${urlObj.host}/${favicon}`;
      }
      
      // Validate the favicon URL works
      try {
        const faviconResponse = await axios.head(favicon, { timeout: 5000 });
        if (faviconResponse.status !== 200) {
          favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`; // Fallback
        }
      } catch (error) {
        console.log(`Favicon validation failed for ${favicon}, using fallback`);
        favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
      }
    } else {
      // Ultimate fallback
      favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    }
    
    return { title, favicon };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    const urlObj = new URL(url);
    return { 
      title: url, 
      favicon: `${urlObj.protocol}//${urlObj.host}/favicon.ico` 
    };
  }
}

// Function to generate summary using Jina AI
async function generateSummary(url) {
  try {
    console.log('Starting summary generation for URL:', url);
    
    // URL encode the target URL
    const target = encodeURIComponent(url);
    
    // Call the Jina AI API as described in the requirements
    const response = await axios.get(`https://r.jina.ai/http://${target}`, {
      timeout: 15000 // 15 second timeout
    });
    
    // Get the plain text summary
    let summary = response.data;
    
    // Handle if the response is not a string
    if (typeof summary !== 'string') {
      summary = 'Summary temporarily unavailable.';
    }
    
    // Trim the summary if it's too long
    if (summary.length > 500) {
      summary = summary.substring(0, 497) + '...';
    }
    
    console.log('Summary generation completed. Length:', summary.length);
    return summary;
    
  } catch (error) {
    console.error('Summary generation error:', error.message);
    return 'Summary temporarily unavailable.';
  }
}

// @desc    Create a new bookmark
// @route   POST /api/bookmarks
// @access  Private
const createBookmark = async (req, res) => {
  try {
    const { url, tags, title: customTitle } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    // Ensure URL has http:// or https:// prefix
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Check if bookmark already exists for this user
    const existingBookmark = await Bookmark.findOne({ userId: req.user._id, url: formattedUrl });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Bookmark already exists' });
    }

    // Extract metadata from URL
    const { title: extractedTitle, favicon } = await extractMetadata(formattedUrl);
    
    // Use custom title if provided, otherwise use extracted title
    const title = customTitle || extractedTitle;
    
    // Generate summary using Jina AI
    const summary = await generateSummary(formattedUrl);

    // Get the highest order number for this user
    const highestOrderBookmark = await Bookmark.findOne({ userId: req.user._id })
      .sort({ order: -1 })
      .limit(1);
    
    const order = highestOrderBookmark ? highestOrderBookmark.order + 1 : 0;

    // Create bookmark
    const bookmarkData = {
      userId: req.user._id,
      url: formattedUrl,
      title,
      favicon,
      summary: summary || '',
      tags: tags || ['uncategorized'],
      order
    };
    
    const bookmark = await Bookmark.create(bookmarkData);
    
    res.status(201).json(bookmark);
    
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
};

// @desc    Get all bookmarks for a user
// @route   GET /api/bookmarks
// @access  Private
const getBookmarks = async (req, res) => {
  try {
    const { tag, sort } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    if (tag) {
      query.tags = tag;
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'alphabetical') {
      sortOptions = { title: 1 };
    } else {
      // Default sort by order
      sortOptions = { order: 1 };
    }
    
    const bookmarks = await Bookmark.find(query).sort(sortOptions);
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single bookmark
// @route   GET /api/bookmarks/:id
// @access  Private
const getBookmarkById = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    res.json(bookmark);
  } catch (error) {
    console.error('Get bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a bookmark
// @route   PUT /api/bookmarks/:id
// @access  Private
const updateBookmark = async (req, res) => {
  try {
    const { title, tags, order } = req.body;
    
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    // Update fields
    if (title) bookmark.title = title;
    if (tags) bookmark.tags = tags;
    if (order !== undefined) bookmark.order = order;
    
    const updatedBookmark = await bookmark.save();
    
    res.json(updatedBookmark);
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a bookmark
// @route   DELETE /api/bookmarks/:id
// @access  Private
const deleteBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    await bookmark.deleteOne();
    
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Regenerate summary for a bookmark
// @route   POST /api/bookmarks/:id/regenerate-summary
// @access  Private
const regenerateSummary = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    // Generate new summary using Jina AI
    const summary = await generateSummary(bookmark.url);
    
    // Update bookmark with new summary
    bookmark.summary = summary || '';
    const updatedBookmark = await bookmark.save();
    
    res.json(updatedBookmark);
    
  } catch (error) {
    console.error('Regenerate summary error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Reorder bookmarks
// @route   PUT /api/bookmarks/reorder
// @access  Private
const reorderBookmarks = async (req, res) => {
  try {
    const { bookmarkIds } = req.body;
    
    if (!bookmarkIds || !Array.isArray(bookmarkIds)) {
      return res.status(400).json({ message: 'Invalid bookmarkIds array' });
    }
    
    // Update order for each bookmark
    const updatePromises = bookmarkIds.map(({ id, order }) => {
      return Bookmark.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { order },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Bookmarks reordered successfully' });
  } catch (error) {
    console.error('Reorder bookmarks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBookmark,
  getBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  regenerateSummary,
  reorderBookmarks
};
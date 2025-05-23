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
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) {
      console.warn('Jina API key not found');
      return '';
    }

    console.log('Calling Jina AI for URL:', url);

    // Use Jina AI Reader API - correct endpoint
    const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('Jina AI response status:', response.status);
    console.log('Jina AI response data:', response.data);

    // Extract content from Jina AI response
    const content = response.data;
    
    if (!content) {
      console.log('No content returned from Jina AI');
      return '';
    }

    console.log('Content type:', typeof content);
    console.log('Content structure:', Object.keys(content));

    // Generate summary from the content
    let summary = '';
    let textToProcess = '';
    
    // Handle different response formats from Jina AI
    // Based on your logs, the structure is: response.data.data.content
    if (content.data) {
      // Combine title and description if available
      const title = content.data.title || '';
      const description = content.data.description || '';
      
      if (description) {
        return description; // Use description as summary if available
      }
      
      textToProcess = [
        content.data.content,
        content.data.description,
        content.data.title
      ].filter(Boolean).join(' ');
    }

    // If no meaningful text was found, return the description or title
    if (!textToProcess || textToProcess.length < 30) {
      if (content.data && content.data.description) {
        return content.data.description;
      }
      if (content.data && content.data.title) {
        return `${content.data.title} webpage`;
      }
      return 'No summary available';
    }

    console.log('Text to process length:', textToProcess.length);
    console.log('First 200 chars:', textToProcess.substring(0, 200));

    if (textToProcess && typeof textToProcess === 'string' && textToProcess.length > 0) {
      // Clean and process the text
      const cleanedText = textToProcess.replace(/\s+/g, ' ').trim();
      
      // Remove YouTube UI elements and navigation text
      const filteredText = cleanedText
        .replace(/Skip navigation|Search|Watch later|Share|Copy link|Info|Shopping|Tap to unmute/gi, '')
        .replace(/Subscribe|Subscribed|Like|Dislike|Reply|Show less|Read more/gi, '')
        .replace(/\d+K?\s*(views|subscribers|likes)/gi, '')
        .replace(/\d+:\d+/g, '') // Remove timestamps
        .replace(/Image \d+:/g, '') // Remove image references
        .replace(/\[.*?\]/g, '') // Remove bracketed content
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .trim();
      
      // Split into sentences and find meaningful content
      const sentences = filteredText.split(/[.!?]+/).filter(sentence => {
        const trimmed = sentence.trim();
        return trimmed.length > 30 && 
               !trimmed.match(/^\d+$/) && // Not just numbers
               !trimmed.match(/^[^\w]*$/) && // Not just special characters
               trimmed.includes(' '); // Contains at least one space
      });
      
      console.log('Found meaningful sentences:', sentences.length);
      
      if (sentences.length > 0) {
        // Get the first few meaningful sentences
        summary = sentences.slice(0, 2).join('. ').trim();
        if (summary && !summary.endsWith('.')) {
          summary += '.';
        }
        
        // If summary is too long, truncate it
        if (summary.length > 300) {
          summary = summary.substring(0, 297) + '...';
        }
      }
    }

    console.log('Generated summary:', summary);
    return summary || '';
    
  } catch (error) {
    console.error('Jina AI Error:', error.response?.data || error.message);
    console.error('Full error:', error);
    return 'No summary available';
  }
}

// @desc    Create a new bookmark
// @route   POST /api/bookmarks
// @access  Private
const createBookmark = async (req, res) => {
  try {
    const { url, tags } = req.body;
    
    // Validate URL
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ message: 'Valid URL is required' });
    }
    
    // Check if bookmark already exists for this user
    const existingBookmark = await Bookmark.findOne({ userId: req.user._id, url });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Bookmark already exists' });
    }

    // Extract metadata from URL
    const { title, favicon } = await extractMetadata(url);
    
    // Generate summary using Jina AI
    console.log('Starting summary generation for URL:', url);
    const summary = await generateSummary(url);
    console.log('Summary generation completed:', summary);

    // Get the highest order number for this user
    const highestOrderBookmark = await Bookmark.findOne({ userId: req.user._id })
      .sort({ order: -1 })
      .limit(1);
    
    const order = highestOrderBookmark ? highestOrderBookmark.order + 1 : 0;

    // Create bookmark
    const bookmarkData = {
      userId: req.user._id,
      url,
      title,
      favicon,
      summary: summary || '',
      tags: tags || [],
      order
    };
    
    console.log('Creating bookmark with summary:', bookmarkData.summary);
    
    const bookmark = await Bookmark.create(bookmarkData);
    
    console.log('Bookmark created successfully with summary length:', bookmark.summary.length);

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
    
    console.log('Regenerating summary for bookmark:', bookmark.url);
    
    // Generate new summary using Jina AI
    const summary = await generateSummary(bookmark.url);
    
    console.log('New summary generated:', summary);
    
    // Update bookmark with new summary
    bookmark.summary = summary || '';
    const updatedBookmark = await bookmark.save();
    
    console.log('Bookmark updated with new summary length:', updatedBookmark.summary.length);
    
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
    const updatePromises = bookmarkIds.map((id, index) => {
      return Bookmark.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { order: index },
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

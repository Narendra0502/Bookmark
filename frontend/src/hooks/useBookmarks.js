'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import bookmarkService from '../services/bookmarkService';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const data = await bookmarkService.getBookmarks();
      setBookmarks(data);
      setFilteredBookmarks(data);

      // Extract all unique tags
      const tags = new Set();
      data.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  // Add bookmark
  const addBookmark = async (bookmarkData) => {
    if (!bookmarkData.url) {
      toast.error('URL is required');
      return;
    }

    try {
      const loadingToast = toast.loading('Adding bookmark...');
      setLoading(true);
      
      const data = await bookmarkService.addBookmark(bookmarkData);
      toast.dismiss(loadingToast);
      
      setBookmarks([...bookmarks, data]);
      setFilteredBookmarks([...filteredBookmarks, data]);
      toast.success('Bookmark added!');

      // Update tags
      const newTags = new Set(allTags);
      bookmarkData.tags.forEach((tag) => newTags.add(tag));
      setAllTags(Array.from(newTags).sort());
      
      return data;
    } catch (error) {
      console.error('Add bookmark error:', error);
      toast.error(error.response?.data?.message || 'Failed to add bookmark');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete bookmark
  const deleteBookmark = async (id) => {
    try {
      setLoading(true);
      await bookmarkService.deleteBookmark(id);

      // Update the bookmarks state immediately
      const updatedBookmarks = bookmarks.filter(bookmark => bookmark._id !== id);
      setBookmarks(updatedBookmarks);
      setFilteredBookmarks(filteredBookmarks.filter(bookmark => bookmark._id !== id));

      // Recalculate tags
      const tags = new Set();
      updatedBookmarks.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());

      toast.success('Bookmark deleted!');
    } catch (error) {
      console.error('Delete bookmark error:', error);
      toast.error('Failed to delete bookmark');
    } finally {
      setLoading(false);
    }
  };

  // Reorder bookmarks
  const reorderBookmarks = async (items) => {
    try {
      // Update local state immediately for better UX
      setFilteredBookmarks(items);
      
      // Update the main bookmarks array to match the new order
      const updatedBookmarks = [...bookmarks];
      items.forEach((item, index) => {
        const bookmarkIndex = updatedBookmarks.findIndex(b => b._id === item._id);
        if (bookmarkIndex !== -1) {
          updatedBookmarks[bookmarkIndex] = { ...item, order: index };
        }
      });
      setBookmarks(updatedBookmarks);

      // Prepare the reorder data
      const reorderData = {
        bookmarkIds: items.map((bookmark, index) => ({
          id: bookmark._id,
          order: index
        }))
      };

      // Update the order in the database
      await bookmarkService.reorderBookmarks(reorderData);
      toast.success('Bookmarks reordered successfully');
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      toast.error('Failed to save bookmark order');
      // Revert to original order if API call fails
      await fetchBookmarks();
    }
  };

  // Filter bookmarks based on search query and selected tags
  useEffect(() => {
    if (bookmarks.length > 0) {
      let filtered = [...bookmarks];
      
      // Apply search filter if query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(bookmark => 
          bookmark.title?.toLowerCase().includes(query) || 
          bookmark.url?.toLowerCase().includes(query) || 
          bookmark.summary?.toLowerCase().includes(query) ||
          bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Apply tag filters if any are selected
      if (selectedTags.length > 0) {
        filtered = filtered.filter(bookmark => 
          selectedTags.every(tag => bookmark.tags.includes(tag))
        );
      }
      
      setFilteredBookmarks(filtered);
    } else {
      setFilteredBookmarks([]);
    }
  }, [searchQuery, selectedTags, bookmarks]);

  return {
    bookmarks,
    filteredBookmarks,
    loading,
    selectedTags,
    allTags,
    searchQuery,
    setSearchQuery,
    setSelectedTags,
    fetchBookmarks,
    addBookmark,
    deleteBookmark,
    reorderBookmarks
  };
};

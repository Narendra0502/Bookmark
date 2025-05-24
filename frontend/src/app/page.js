'use client';

import { useState, useEffect } from 'react';
import axios from "axios"
import Axios from '../utils/Axios';
import { toast, Toaster } from 'react-hot-toast';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiTrash2, FiPlus, FiLogOut, FiTag, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Components
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import BookmarkCard from '../components/BookmarkCard';
import AddBookmarkForm from '../components/AddBookmarkForm';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
 const API_URL = 'https://bookmark-kkxc.onrender.com/api';
 // const API_URL = 'https://bookmark-kkxc.onrender.com/api';


export default function Home() {
  const router = useRouter(); // Add router instance

  // State
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };

          // Verify token and get user data
          const { data } = await Axios.get(`${API_URL}/users/profile`, config);
          setUser(data);
          fetchBookmarks(token);
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async (token, tag = '') => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: tag ? { tag } : {},
      };

      const { data } = await Axios.get(`${API_URL}/bookmarks`, config);
      setBookmarks(data);

      // Extract all unique tags
      const tags = new Set();
      data.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const { data } = await Axios.post(`${API_URL}/users/login`, credentials, { withCredentials: true });
      localStorage.setItem('token', data.token);
      setUser(data);
      fetchBookmarks(data.token);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      const { data } = await Axios.post(`${API_URL}/users/register`, userData);
      localStorage.setItem('token', data.token);
      setUser(data);
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   setUser(null);
  //   setBookmarks([]);
  //   toast.info('Logged out');
  // };

  // Add bookmark
  const handleAddBookmark = async (bookmarkData) => {
    // Check for empty fields
    if (!bookmarkData.title || !bookmarkData.url) {
      toast.error('Title and URL are required');
      return;
    }

    // Check if tags array exists and has at least one tag
    if (!bookmarkData.tags || bookmarkData.tags.length === 0) {
      toast.error('At least one tag is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await Axios.post(`${API_URL}/bookmarks`, bookmarkData, config);
      setBookmarks([...bookmarks, data]);
      setShowAddForm(false);
      toast.success('Bookmark added!');

      // Update tags
      const newTags = new Set(allTags);
      bookmarkData.tags.forEach((tag) => newTags.add(tag));
      setAllTags(Array.from(newTags));
    } catch (error) {
      console.error('Add bookmark error:', error);
      toast.error(error.response?.data?.message || 'Failed to add bookmark');
    } finally {
      setLoading(false);
    }
  };

  // Delete bookmark
  const handleDeleteBookmark = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await Axios.delete(`${API_URL}/bookmarks/${id}`, config);

      // Update the bookmarks state immediately
      setBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark._id !== id));

      // Recalculate tags
      const remainingBookmarks = bookmarks.filter((bookmark) => bookmark._id !== id);
      const tags = new Set();
      remainingBookmarks.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags));

      toast.success('Bookmark deleted!');
    } catch (error) {
      console.error('Delete bookmark error:', error);
      toast.error('Failed to delete bookmark');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(bookmarks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setBookmarks(items);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Prepare the reorder data with new positions
      const reorderData = {
        bookmarkIds: items.map((bookmark, index) => ({
          id: bookmark._id,
          order: index
        }))
      };

      // Call the API to update the order in the database
      await Axios.put(`${API_URL}/bookmarks/reorder`, reorderData, config);
      toast.success('Bookmarks reordered successfully');
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      toast.error('Failed to save bookmark order');
      // Revert to original order if API call fails
      fetchBookmarks(localStorage.getItem('token'), selectedTag);
    }
  };

  // Filter bookmarks by tag
  const handleTagFilter = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    const token = localStorage.getItem('token');
    fetchBookmarks(token, tag === selectedTag ? '' : tag);
  };

  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTag('');
    const token = localStorage.getItem('token');
    fetchBookmarks(token);
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="loading-spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      {!user ? (
        <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
          <div className="glass-card p-6 sm:p-8 rounded-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Book Marker
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Save and organize your favorite links</p>
            </div>

            <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8">
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${showLoginForm
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => setShowLoginForm(true)}
              >
                Login
              </button>
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${!showLoginForm
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => setShowLoginForm(false)}
              >
                Register
              </button>
            </div>

            {showLoginForm ? (
              <LoginForm onLogin={handleLogin} />
            ) : (
              <RegisterForm onRegister={handleRegister} />
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookmarks</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Organize and access your favorite links</p>
            </div>
            <div className="flex items-center space-x-3">

              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center space-x-2 text-sm sm:text-base"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add</span>
                <span className="hidden sm:inline">Bookmark</span>
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <h2 className="text-base sm:text-lg font-medium text-gray-700">Filter by Tags</h2>
                </div>
                {selectedTag && (
                  <button
                    onClick={clearTagFilter}
                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 text-sm"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${selectedTag === tag
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <FiTag className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTag && (
                <div className="mt-3 text-sm text-gray-600">
                  Showing results for: <span className="font-medium text-blue-600">#{selectedTag}</span>
                </div>
              )}
            </div>
          )}

          {/* Bookmarks Grid */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="bookmarks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
                >
            

                  {bookmarks.map((bookmark, index) => (
                    <Draggable
                      key={bookmark._id}
                      draggableId={bookmark._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging
                              ? provided.draggableProps.style?.transform
                              : 'none',
                          }}
                        >
                          <BookmarkCard
                            bookmark={bookmark}
                            onDelete={handleDeleteBookmark}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Empty State */}
          {bookmarks.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                {selectedTag ? `No bookmarks found for "${selectedTag}"` : 'No Bookmarks Yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {selectedTag
                  ? 'Try selecting a different tag or clear the filter'
                  : 'Start by adding your first bookmark'
                }
              </p>
              {selectedTag ? (
                <button
                  onClick={clearTagFilter}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Clear Filter</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Your First Bookmark</span>
                </button>
              )}
            </div>
          )}

          {/* Add Bookmark Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-2xl">
                <AddBookmarkForm
                  onAddBookmark={handleAddBookmark}
                  onClose={() => setShowAddForm(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

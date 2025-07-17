'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Axios from '../utils/Axios';

import { DragDropContext, Draggable } from '../utils/dndHelpers';
import { StrictModeDroppable } from '../utils/dndHelpers';
import { FiTrash2, FiPlus, FiLogOut, FiTag, FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeContext';

// Components
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import BookmarkCard from '../components/BookmarkCard'; // Using the updated component
import AddBookmarkForm from '../components/AddBookmarkForm';

const API_URL = "https://bookmark-kkxc.onrender.com/api"

export default function Home() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  // State
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

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
          const { data } = await Axios.get(`/users/profile`, config);
          setUser(data);
          await fetchBookmarks(token);
          
          // Force a small delay to ensure everything is properly initialized
          setTimeout(() => {
            setLoading(false);
          }, 100);
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Filter bookmarks when search query or selected tags change
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

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTagDropdown && !event.target.closest('.tag-dropdown-container')) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown]);
  
  // Handle window resize for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async (token) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      };

      const { data } = await Axios.get(`/bookmarks`, config);
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

  // Handle login
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const { data } = await Axios.post(`/users/login`, credentials);
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
      const { data } = await Axios.post(`/users/register`, userData);
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

  // Add bookmark
  const handleAddBookmark = async (bookmarkData) => {
    // Check for empty fields
    if (!bookmarkData.url) {
      toast.error('URL is required');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Adding bookmark...');
      
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const axios = (await import('axios')).default;
      const { data } = await axios.post(`${API_URL}/bookmarks`, bookmarkData, config);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      setBookmarks([...bookmarks, data]);
      setFilteredBookmarks([...filteredBookmarks, data]);
      setShowAddForm(false);
      toast.success('Bookmark added!');

      // Update tags
      const newTags = new Set(allTags);
      bookmarkData.tags.forEach((tag) => newTags.add(tag));
      setAllTags(Array.from(newTags).sort());
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

      const axios = (await import('axios')).default;
      await axios.delete(`${API_URL}/bookmarks/${id}`, config);

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

  // Handle drag and drop reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    
    // Create a new array from the current filtered bookmarks
    const items = Array.from(filteredBookmarks);
    // Remove the dragged item from its original position
    const [reorderedItem] = items.splice(result.source.index, 1);
    // Insert the dragged item at its new position
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setFilteredBookmarks([...items]);
    
    // Also update the main bookmarks array
    const updatedBookmarks = [...bookmarks];
    const bookmarkIndex = updatedBookmarks.findIndex(b => b._id === reorderedItem._id);
    if (bookmarkIndex !== -1) {
      updatedBookmarks.splice(bookmarkIndex, 1);
      const destinationIndex = result.destination.index;
      updatedBookmarks.splice(destinationIndex, 0, reorderedItem);
      setBookmarks([...updatedBookmarks]);
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Saving new order...');

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
      const axios = (await import('axios')).default;
      await axios.put(`${API_URL}/bookmarks/reorder`, reorderData, config);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Order saved');
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to save order');
      // Revert to original order if API call fails
      fetchBookmarks(localStorage.getItem('token'));
    }
  };

  // Toggle tag selection
  const toggleTagSelection = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Clear tag filters
  const clearTagFilters = () => {
    setSelectedTags([]);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading && !user) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="loading-spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {!user ? (
        <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
          <div className={`glass-card p-6 sm:p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Book Marker
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Save and organize your favorite links
              </p>
            </div>

            <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8">
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${showLoginForm
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                onClick={() => setShowLoginForm(true)}
              >
                Login
              </button>
              <button
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${!showLoginForm
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                My Bookmarks
              </h1>
              <p className={`mt-1 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Organize and access your favorite links
              </p>
            </div>
            <div>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center space-x-2 text-sm sm:text-base"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Bookmark</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Section */}
          <div className={`mb-6 sm:mb-8 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Tag Filter Section */}
              <div className="flex-grow">
                <div className="flex items-center mb-3">
                  <FiFilter className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'} mr-2`} />
                  <h2 className={`text-base sm:text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Filter by Tags
                  </h2>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={clearTagFilters}
                      className={`ml-3 flex items-center space-x-1 px-2 py-1 rounded-full ${
                        darkMode 
                          ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } transition-colors duration-200 text-xs`}
                    >
                      <FiX className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Show first 4 tags initially */}
                  {allTags.slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTagSelection(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? darkMode 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiTag className="inline-block w-3 h-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                  
                  {/* Dropdown for more tags */}
                  {allTags.length > 4 && (
                    <div className="relative tag-dropdown-container">
                      <button
                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        More Tags
                        <FiChevronDown className={`ml-1 w-3 h-3 transition-transform ${showTagDropdown ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {showTagDropdown && (
                        <div 
                          className={`absolute left-0 mt-2 w-64 p-3 rounded-lg shadow-lg z-10 ${
                            darkMode ? 'bg-gray-700' : 'bg-white'
                          } border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                          <div className="max-h-60 overflow-y-auto">
                            {allTags.slice(4).map((tag) => (
                              <div key={tag} className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`tag-${tag}`}
                                  checked={selectedTags.includes(tag)}
                                  onChange={() => toggleTagSelection(tag)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`tag-${tag}`} 
                                  className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} cursor-pointer`}
                                >
                                  {tag}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Active filters:
                </span>
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      darkMode 
                        ? 'bg-blue-900/50 text-blue-200' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <FiTag className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => toggleTagSelection(tag)}
                      className={`ml-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'} hover:text-red-500`}
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarks Grid */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <StrictModeDroppable droppableId="bookmarks" type="BOOKMARK">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`transition-all duration-200 min-h-[50px] ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-gray-800/50' : ''}`}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}
                >
                  {filteredBookmarks.map((bookmark, index) => (
                    <Draggable
                      key={bookmark._id}
                      draggableId={bookmark._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'z-50' : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                            zIndex: snapshot.isDragging ? 100 : 'auto',
                            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(37, 99, 235, 0.2)' : '',
                            width: windowWidth < 640 ? 'calc(100% - 1rem)' : 
                                  windowWidth < 1024 ? 'calc(50% - 1rem)' : 'calc(33.333% - 1rem)',
                            margin: '0.5rem',
                            transition: snapshot.isDragging ? 'none' : 'all 0.3s ease',
                            touchAction: 'none' // Improve touch device handling
                          }}
                        >
                          <BookmarkCard
                            bookmark={bookmark}
                            onDelete={handleDeleteBookmark}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>

          {/* Empty State */}
          {filteredBookmarks.length === 0 && !loading && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlus className={`w-6 h-6 sm:w-8 sm:h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`text-lg sm:text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {searchQuery 
                  ? 'No bookmarks match your search'
                  : selectedTags.length > 0
                    ? 'No bookmarks match your filters'
                    : 'No Bookmarks Yet'
                }
              </h3>
              <p className={`mb-6 text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchQuery
                  ? 'Try different keywords or clear the search'
                  : selectedTags.length > 0
                    ? 'Try selecting different tags or clear the filters'
                    : 'Start by adding your first bookmark'
                }
              </p>
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Clear Search</span>
                </button>
              ) : selectedTags.length > 0 ? (
                <button
                  onClick={clearTagFilters}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Clear Filters</span>
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
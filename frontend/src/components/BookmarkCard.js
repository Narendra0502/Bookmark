'use client';
import { FiTrash2 } from 'react-icons/fi';
import { getRandomColor } from '../utils/colors';
import React from 'react';
import { useTheme } from './ThemeContext';

// Helper function for text truncation
const truncateText = (text, limit) => {
  if (!text || text.length <= limit) return text || '';
  return text.substring(0, limit) + '...';
};

// Tag component for better reusability
const BookmarkTag = ({ tag }) => (
  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
    {tag}
  </span>
);

// Favicon component with error handling
const Favicon = ({ src }) => (
  <div className="flex-shrink-0">
    <img
      src={src}
      alt=""
      className="w-8 h-8 rounded object-cover"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  </div>
);

const BookmarkCard = ({ bookmark, onDelete, dragHandleProps, isDragging }) => {
  const cardColor = React.useMemo(() => getRandomColor(), []);
  const { darkMode } = useTheme();

  const handleClick = (e) => {
    // Don't open the URL when clicking on buttons or drag handle
    if (e.target.closest('.delete-button') || e.target.closest('.drag-handle')) {
      e.stopPropagation();
      return;
    }
    window.open(bookmark.url, '_blank');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(bookmark._id);
  };
  
  // Drag handle is implemented directly in the component

  return (
    <div 
      className={`relative group ${
        isDragging ? 'shadow-2xl scale-105' : ''
      } transition-all duration-200`}
    >
      <div 
        className={`h-full p-4 rounded-lg ${
          darkMode 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : 'bg-white hover:bg-gray-50'
        } shadow-md transition-all duration-200`}
        onClick={handleClick}
      >
        {dragHandleProps && (
          <div 
            className="drag-handle absolute top-2 right-12 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing transition-colors duration-200 z-10"
            {...dragHandleProps}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="5" r="1"/>
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="19" r="1"/>
            </svg>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            {bookmark.favicon && <Favicon src={bookmark.favicon} />}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
                {bookmark.title || 'Untitled Bookmark'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {truncateText(bookmark.url, 40)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="delete-button flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            aria-label="Delete bookmark"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
        
        {bookmark.summary && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {truncateText(bookmark.summary, 60)}
            </p>
          </div>
        )}
        
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {bookmark.tags.slice(0, 5).map((tag, index) => (
              <BookmarkTag key={index} tag={tag} />
            ))}
            {bookmark.tags.length > 5 && (
              <BookmarkTag tag={`+${bookmark.tags.length - 5} more`} />
            )}
          </div>
        )}
        
        {bookmark.createdAt && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Added {new Date(bookmark.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
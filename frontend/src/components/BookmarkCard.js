'use client';
import { FiTrash2, FiX } from 'react-icons/fi';
// import { getRandomColor } from '@/utils/colors';
import { getRandomColor } from '../utils/colors';
import React from 'react';

const BookmarkCard = ({ bookmark, onDelete }) => {
  const cardColor = React.useMemo(() => getRandomColor(), []);

  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const handleClick = (e) => {
    // Prevent click if clicking delete button
    if (e.target.closest('.delete-button')) {
      return;
    }
    window.open(bookmark.url, '_blank');
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click
    onDelete(bookmark._id);
  };

  return (
    <div
      onClick={handleClick}
      className={`${cardColor} rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {bookmark.favicon && (
            <div className="flex-shrink-0">
              <img
                src={bookmark.favicon}
                alt=""
                className="w-8 h-8 rounded object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
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
          {bookmark.tags.slice(0, 5).map((tag, index) => {
            return (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200`}
              >
                {tag}
              </span>
            );
          })}
          {bookmark.tags.length > 5 && (
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
              +{bookmark.tags.length - 5} more
            </span>
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
  );
};

export default BookmarkCard;
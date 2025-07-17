import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import BookmarkCard from './BookmarkCard';

export default function BookmarkList({ bookmarks, onDeleteBookmark, onReorderBookmarks }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(bookmarks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorderBookmarks(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="bookmarks">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
          >
            {bookmarks.map((bookmark, index) => (
              <Draggable key={bookmark._id} draggableId={bookmark._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                      ...provided.draggableProps.style,
                      zIndex: snapshot.isDragging ? 100 : 'auto',
                      boxShadow: snapshot.isDragging ? '0 8px 24px rgba(37, 99, 235, 0.2)' : '',
                      transform: snapshot.isDragging
                        ? `${provided.draggableProps.style?.transform || ''} scale(1.05)`
                        : provided.draggableProps.style?.transform || '',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                  >
                    <BookmarkCard
                      bookmark={bookmark}
                      onDelete={onDeleteBookmark}
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
      </Droppable>
    </DragDropContext>
  );
}
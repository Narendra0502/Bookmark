'use client';
import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// This is a workaround for the issue with react-beautiful-dnd in React 18 strict mode
// https://github.com/atlassian/react-beautiful-dnd/issues/2399

export const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    // This is a workaround for the fact that react-beautiful-dnd doesn't support React 18's strict mode
    // Using a small timeout to ensure the component is fully mounted before enabling drag and drop
    const timeout = setTimeout(() => setEnabled(true), 100);
    return () => {
      clearTimeout(timeout);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    // Return a placeholder with the same structure as what would be returned by Droppable
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', minHeight: '50px' }}>
        {children({
          droppableProps: {
            'data-rbd-droppable-context-id': '',
            'data-rbd-droppable-id': '',
          },
          innerRef: () => {},
          placeholder: null,
        }, { isDraggingOver: false })}
      </div>
    );
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

export { DragDropContext, Draggable };
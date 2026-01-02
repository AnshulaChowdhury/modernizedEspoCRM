/**
 * SortableFieldList - A sortable list of fields for row-based layouts
 */
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SortableItem {
  name: string;
  label: string;
  [key: string]: unknown;
}

interface SortableFieldListProps {
  items: SortableItem[];
  onReorder: (items: SortableItem[]) => void;
  onRemove?: (name: string) => void;
  onEdit?: (name: string) => void;
  title?: string;
  emptyMessage?: string;
  showEditButton?: boolean;
}

interface SortableItemProps {
  item: SortableItem;
  onRemove?: (name: string) => void;
  onEdit?: (name: string) => void;
  showEditButton?: boolean;
}

function SortableFieldItem({
  item,
  onRemove,
  onEdit,
  showEditButton,
}: SortableItemProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md',
        'group hover:border-gray-300',
        isDragging && 'opacity-50 shadow-lg border-blue-300 z-10'
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <span className="flex-1 text-sm truncate">{item.label}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showEditButton && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item.name)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.name)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SortableFieldList({
  items,
  onReorder,
  onRemove,
  onEdit,
  title = 'Enabled Fields',
  emptyMessage = 'No fields enabled. Drag fields here to add them.',
  showEditButton = false,
}: SortableFieldListProps): React.ReactElement {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.name === active.id);
      const newIndex = items.findIndex(item => item.name === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px]">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 text-center">
                {emptyMessage}
              </p>
            ) : (
              items.map(item => (
                <SortableFieldItem
                  key={item.name}
                  item={item}
                  onRemove={onRemove}
                  onEdit={onEdit}
                  showEditButton={showEditButton}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default SortableFieldList;

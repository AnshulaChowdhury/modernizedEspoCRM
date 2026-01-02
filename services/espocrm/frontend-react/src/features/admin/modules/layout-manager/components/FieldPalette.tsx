/**
 * FieldPalette - Draggable list of available fields
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FieldItem } from '../types';

interface FieldPaletteProps {
  fields: FieldItem[];
  title?: string;
  droppableId?: string;
}

interface DraggableFieldProps {
  field: FieldItem;
  isDisabled?: boolean;
}

function DraggableField({ field, isDisabled }: DraggableFieldProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.name,
    disabled: isDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm',
        'hover:border-gray-300 hover:shadow-sm cursor-grab',
        isDragging && 'opacity-50 shadow-lg border-blue-300',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="truncate">{field.label}</span>
      {field.notSortable && (
        <span className="text-xs text-gray-400 ml-auto">(not sortable)</span>
      )}
    </div>
  );
}

export function FieldPalette({
  fields,
  title = 'Available Fields',
}: FieldPaletteProps): React.ReactElement {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No fields available</p>
        ) : (
          fields.map(field => (
            <DraggableField key={field.name} field={field} />
          ))
        )}
      </div>
    </div>
  );
}

export default FieldPalette;

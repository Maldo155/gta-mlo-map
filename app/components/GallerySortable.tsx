"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

type Props = {
  items: string[];
  onReorder: (items: string[]) => void;
  onRemove: (index: number) => void;
  renderAddButton?: React.ReactNode;
  dropActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

function SortableThumb({ id, url, index, onRemove }: { id: string; url: string; index: number; onRemove: (i: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    position: "relative",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="gallery-sortable-thumb">
      <img
        src={url}
        alt=""
        style={{
          width: 80,
          height: 60,
          objectFit: "cover",
          borderRadius: 8,
          border: "1px solid #374151",
          display: "block",
        }}
      />
      <div
        {...attributes}
        {...listeners}
        className="gallery-sortable-drag-handle"
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          width: 24,
          height: 24,
          borderRadius: 4,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          lineHeight: 1,
          userSelect: "none",
        }}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        ⋮⋮
      </div>
      <button
        type="button"
        className="gallery-sortable-remove"
        onClick={(ev) => {
          ev.stopPropagation();
          onRemove(index);
        }}
        aria-label="Remove"
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#ef4444",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function GallerySortable({
  items,
  onReorder,
  onRemove,
  renderAddButton,
  dropActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace("item-", ""), 10);
      const newIndex = parseInt(String(over.id).replace("item-", ""), 10);
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    }
  }

  const itemIds = items.map((_, i) => `item-${i}`);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "flex-start",
        marginTop: 8,
        padding: dropActive ? 16 : 0,
        borderRadius: 12,
        border: dropActive ? "2px dashed #22c55e" : "2px dashed transparent",
        background: dropActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
        transition: "all 0.15s ease",
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          {items.map((url, i) => (
            <SortableThumb
              key={itemIds[i]}
              id={itemIds[i]}
              url={url}
              index={i}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </DndContext>
      {renderAddButton}
    </div>
  );
}

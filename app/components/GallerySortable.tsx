"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
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
  } = useSortable({
    id,
    transition: { duration: 200, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
  });

  const style: CSSProperties = {
    position: "relative",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, cursor: isDragging ? "grabbing" : "grab" }}
      className="gallery-sortable-thumb"
      {...attributes}
      {...listeners}
    >
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
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          width: 24,
          height: 24,
          borderRadius: 4,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          lineHeight: 1,
        }}
        aria-hidden
      >
        ⋮⋮
      </div>
      <button
        type="button"
        className="gallery-sortable-remove"
        onPointerDown={(ev) => ev.stopPropagation()}
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

const dropAnimation = {
  duration: 200,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0",
        transition: "opacity 200ms cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  }),
};

function OverlayThumb({ url }: { url: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 60,
        borderRadius: 8,
        overflow: "hidden",
        border: "2px solid #6366f1",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        cursor: "grabbing",
      }}
    >
      <img
        src={url}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
      />
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace("item-", ""), 10);
      const newIndex = parseInt(String(over.id).replace("item-", ""), 10);
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    }
  }

  const itemIds = items.map((_, i) => `item-${i}`);
  const activeIndex = activeId != null ? parseInt(activeId.replace("item-", ""), 10) : null;
  const activeUrl = activeIndex != null && activeIndex >= 0 && activeIndex < items.length ? items[activeIndex] : null;

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
        <DragOverlay dropAnimation={dropAnimation}>
          {activeUrl ? <OverlayThumb url={activeUrl} /> : null}
        </DragOverlay>
      </DndContext>
      {renderAddButton}
    </div>
  );
}

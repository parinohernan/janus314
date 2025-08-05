<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface DraggableItem {
    id: string;
    [key: string]: any;
  }
  
  interface Props {
    items: DraggableItem[];
    itemKey?: string;
  }
  
  let { items, itemKey = 'id' } = $props();
  
  const dispatch = createEventDispatcher();
  
  let draggedItem: DraggableItem | null = null;
  let draggedIndex: number | null = null;
  let dropIndex: number | null = null;
  let isDragging = $state(false);
  
  function handleDragStart(event: DragEvent, item: DraggableItem, index: number) {
    if (!event.dataTransfer) return;
    
    draggedItem = item;
    draggedIndex = index;
    isDragging = true;
    
    // Configurar el drag
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item[itemKey]);
    
    // Agregar clase al elemento que se está arrastrando
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.add('opacity-50');
    }
  }
  
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    dropIndex = index;
  }
  
  function handleDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    dropIndex = index;
  }
  
  function handleDragLeave(event: DragEvent) {
    // Solo actualizar si no estamos sobre el mismo elemento
    const target = event.target as HTMLElement;
    if (target && !target.closest('.draggable-item')) {
      dropIndex = null;
    }
  }
  
  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index && draggedItem) {
      // Reordenar los elementos
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, removed);
      
      // Emitir el evento con el nuevo orden
      dispatch('reorder', {
        oldIndex: draggedIndex,
        newIndex: index,
        items: newItems
      });
    }
    
    // Limpiar estado
    draggedItem = null;
    draggedIndex = null;
    dropIndex = null;
    isDragging = false;
    
    // Remover clase de opacidad
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('opacity-50');
    }
  }
  
  function handleDragEnd(event: DragEvent) {
    // Limpiar estado
    draggedItem = null;
    draggedIndex = null;
    dropIndex = null;
    isDragging = false;
    
    // Remover clase de opacidad
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('opacity-50');
    }
  }
  
  function getDropZoneClass(index: number): string {
    if (dropIndex === index && draggedIndex !== index) {
      return 'border-t-2 border-blue-500 bg-blue-50';
    }
    return '';
  }
</script>

<div class="draggable-list">
  {#each items as item, index}
    <div
      class="draggable-item cursor-move transition-all duration-200 {getDropZoneClass(index)}"
      draggable="true"
      on:dragstart={(e) => handleDragStart(e, item, index)}
      on:dragover={(e) => handleDragOver(e, index)}
      on:dragenter={(e) => handleDragEnter(e, index)}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, index)}
      on:dragend={handleDragEnd}
    >
      <slot {item} {index} {isDragging} {draggedIndex} {dropIndex}>
        <div class="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
          <div class="flex items-center space-x-3 flex-1">
            <div class="text-gray-400 cursor-move">
              ⋮⋮
            </div>
            <span class="text-sm text-gray-700">{item[itemKey]}</span>
          </div>
        </div>
      </slot>
    </div>
  {/each}
</div>

<style>
  .draggable-item {
    user-select: none;
  }
  
  .draggable-item:active {
    cursor: grabbing;
  }
  
  .draggable-item.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
  }
  
  .drop-zone {
    border-top: 2px solid #3b82f6;
    background-color: #eff6ff;
  }
</style> 
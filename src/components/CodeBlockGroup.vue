<template>
  <v-group
    :config="{
      x: block.x,
      y: block.y,
      draggable: true
    }"
    @dragend="handleDragEnd"
    @click="handleClick"
    @dblclick="startEditing"
  >
    <!-- Drop shadow -->
    <v-rect
      :config="{
        x: 3,
        y: 3,
        width: block.width,
        height: block.height,
        fill: 'rgba(0, 0, 0, 0.1)',
        cornerRadius: 8,
      }"
    />
    
    <!-- Main background -->
    <v-rect
      :config="{
        width: block.width,
        height: block.height,
        fill: 'white',
        stroke: isSelected ? '#ff6b6b' : '#e1e5e9',
        strokeWidth: isSelected ? 3 : 1,
        cornerRadius: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 2 }
      }"
    />
    
    <!-- Header background -->
    <v-rect
      :config="{
        width: block.width,
        height: 35,
        fill: headerGradient,
        cornerRadius: [8, 8, 0, 0],
      }"
    />
    
    <!-- Language icon and title -->
    <v-text
      :config="{
        x: 10,
        y: 8,
        text: `${languageIcon} ${block.title}`,
        fontSize: 14,
        fill: 'white',
        fontStyle: 'bold'
      }"
    />
    
    <!-- Code content with syntax highlighting -->
    <v-group
      v-if="!isEditing"
      :config="{ x: 10, y: 45 }"
    >
      <v-text
        v-for="(segment, index) in highlightedSegments"
        :key="index"
        :config="{
          x: segment.x,
          y: segment.y,
          text: segment.text,
          fontSize: 12,
          fill: segment.color,
          fontFamily: 'Monaco, Consolas, monospace'
        }"
      />
    </v-group>
    
    <!-- Editing overlay -->
    <v-rect
      v-if="isEditing"
      :config="{
        x: 5,
        y: 40,
        width: block.width - 10,
        height: block.height - 45,
        fill: '#f8f9fa',
        stroke: '#007bff',
        strokeWidth: 2,
        cornerRadius: 4,
      }"
    />
    
    <!-- Connection points -->
    <v-circle
      v-for="point in connectionPoints"
      :key="point.id"
      :config="{
        x: point.x,
        y: point.y,
        radius: 6,
        fill: point.isActive ? '#007bff' : '#6c757d',
        stroke: 'white',
        strokeWidth: 2,
        opacity: showConnectionPoints ? 1 : 0
      }"
      @click="handleConnectionPointClick(point)"
      @mouseenter="point.isActive = true"
      @mouseleave="point.isActive = false"
    />
  </v-group>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { highlightCode, detectLanguage, getLanguageIcon } from '../utils/syntaxHighlighter.js'

const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  showConnectionPoints: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:position', 'click', 'edit', 'connect'])

const isEditing = ref(false)
const language = ref('javascript')
const languageIcon = ref('🟨')
const highlightedSegments = ref([])

// Compute header gradient based on language
const headerGradient = computed(() => {
  const gradients = {
    javascript: 'linear-gradient(135deg, #f7df1e, #f0db4f)',
    typescript: 'linear-gradient(135deg, #3178c6, #235a97)',
    python: 'linear-gradient(135deg, #3776ab, #ffd43b)',
    java: 'linear-gradient(135deg, #ed8b00, #5382a1)',
    // cpp: 'linear-gradient(135deg, #00599c, #004482)', // Temporarily disabled
  }
  return gradients[language.value] || 'linear-gradient(135deg, #6c757d, #495057)'
})

// Connection points around the block
const connectionPoints = computed(() => [
  { id: 'top', x: props.block.width / 2, y: 0, isActive: false },
  { id: 'right', x: props.block.width, y: props.block.height / 2, isActive: false },
  { id: 'bottom', x: props.block.width / 2, y: props.block.height, isActive: false },
  { id: 'left', x: 0, y: props.block.height / 2, isActive: false },
])

// Process syntax highlighting
const processHighlighting = () => {
  language.value = detectLanguage(props.block.code)
  languageIcon.value = getLanguageIcon(language.value)
  
  const segments = highlightCode(props.block.code, language.value)
  const lines = props.block.code.split('\n')
  const processedSegments = []
  
  let currentY = 0
  let currentX = 0
  
  segments.forEach(segment => {
    const segmentLines = segment.text.split('\n')
    
    segmentLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        currentY += 16 // Line height
        currentX = 0
      }
      
      if (line.length > 0) {
        processedSegments.push({
          text: line,
          color: segment.color,
          x: currentX,
          y: currentY
        })
        
        // Approximate character width for monospace font
        currentX += line.length * 7.2
      }
    })
  })
  
  highlightedSegments.value = processedSegments
}

// Watch for code changes
watch(() => props.block.code, processHighlighting, { immediate: true })

const handleDragEnd = (event) => {
  emit('update:position', {
    x: event.target.x(),
    y: event.target.y()
  })
}

const handleClick = () => {
  emit('click')
}

const startEditing = () => {
  isEditing.value = true
  emit('edit', props.block.id)
}

const handleConnectionPointClick = (point) => {
  emit('connect', {
    blockId: props.block.id,
    point: point.id,
    position: {
      x: props.block.x + point.x,
      y: props.block.y + point.y
    }
  })
}
</script>

<style scoped>
/* Add any additional styling if needed */
</style> 
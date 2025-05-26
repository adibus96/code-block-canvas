<template>
  <div class="canvas-container">
    <div class="canvas-controls">
      <button @click="zoomIn" class="zoom-btn">🔍+</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomOut" class="zoom-btn">🔍-</button>
      <button @click="toggleGrid" :class="{ active: showGrid }" class="grid-btn">📏</button>
    </div>
    <v-stage
      :config="stageConfig"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    >
      <v-layer>
        <!-- Grid Layer -->
        <v-group v-if="showGrid">
          <v-line
            v-for="i in gridLines.vertical"
            :key="`v-${i}`"
            :config="{
              points: [i * gridSize, 0, i * gridSize, stageConfig.height],
              stroke: '#ddd',
              strokeWidth: 1
            }"
          />
          <v-line
            v-for="i in gridLines.horizontal"
            :key="`h-${i}`"
            :config="{
              points: [0, i * gridSize, stageConfig.width, i * gridSize],
              stroke: '#ddd',
              strokeWidth: 1
            }"
          />
        </v-group>

        <!-- Background -->
        <v-rect
          :config="{
            x: 0,
            y: 0,
            width: stageConfig.width,
            height: stageConfig.height,
            fill: '#f5f5f5',
          }"
        />
        
        <!-- Existing CodeBlocks -->
        <v-group :config="{ scale: { x: scale, y: scale } }">
          <code-block-group
            v-for="block in codeBlocks"
            :key="block.id"
            :block="block"
            :is-selected="selectedBlockId === block.id"
            :show-connection-points="isConnecting"
            :grid-size="gridSize"
            :snap-to-grid="showGrid"
            @update:position="updateBlockPosition(block.id, $event)"
            @click="selectBlock(block.id)"
            @edit="startEditingBlock"
            @connect="handleConnectionPoint"
          />
          
          <!-- Connection lines with arrows -->
          <v-group
            v-for="connection in connections"
            :key="connection.id"
          >
            <v-line
              :config="{
                points: connection.points,
                stroke: '#4a90e2',
                strokeWidth: 3,
                lineCap: 'round',
                lineJoin: 'round',
              }"
            />
            <v-line
              :config="{
                points: connection.arrowPoints,
                stroke: '#4a90e2',
                strokeWidth: 3,
                lineCap: 'round',
                lineJoin: 'round',
                closed: true,
                fill: '#4a90e2'
              }"
            />
          </v-group>
          
          <!-- Temporary connection line while drawing -->
          <v-line
            v-if="tempConnection"
            :config="{
              points: tempConnection.points,
              stroke: '#ff6b6b',
              strokeWidth: 2,
              lineCap: 'round',
              dash: [5, 5]
            }"
          />
        </v-group>
      </v-layer>
    </v-stage>

    <!-- Minimap -->
    <div class="minimap">
      <v-stage
        :config="{
          width: 200,
          height: 150,
          scaleX: 0.1,
          scaleY: 0.1
        }"
      >
        <v-layer>
          <v-rect
            :config="{
              x: 0,
              y: 0,
              width: stageConfig.width,
              height: stageConfig.height,
              fill: '#f5f5f5',
            }"
          />
          <v-group>
            <v-rect
              v-for="block in codeBlocks"
              :key="block.id"
              :config="{
                x: block.x,
                y: block.y,
                width: block.width,
                height: block.height,
                fill: '#4a90e2',
              }"
            />
          </v-group>
          <v-rect
            :config="{
              x: -stageConfig.x / scale / 10,
              y: -stageConfig.y / scale / 10,
              width: stageConfig.width / scale / 10,
              height: stageConfig.height / scale / 10,
              stroke: '#ff6b6b',
              strokeWidth: 2,
              fill: 'rgba(255, 107, 107, 0.1)',
            }"
          />
        </v-layer>
      </v-stage>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CodeBlockGroup from './CodeBlockGroup.vue'

const scale = ref(1)
const showGrid = ref(true)
const gridSize = 20
const stagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const lastPointerPosition = ref(null)
const selectedBlockId = ref(null)
const isConnecting = ref(false)
const connectionStart = ref(null)
const tempConnection = ref(null)

const stageConfig = computed(() => ({
  width: window.innerWidth,
  height: window.innerHeight,
  x: stagePosition.value.x,
  y: stagePosition.value.y,
  draggable: true
}))

const gridLines = computed(() => ({
  vertical: Array.from({ length: Math.ceil(stageConfig.value.width / gridSize) }, (_, i) => i),
  horizontal: Array.from({ length: Math.ceil(stageConfig.value.height / gridSize) }, (_, i) => i)
}))

const codeBlocks = ref([
  {
    id: 'sample_1',
    x: 100,
    y: 100,
    width: 280,
    height: 140,
    title: 'Function Definition',
    code: 'function calculateSum(a, b) {\n  // Add two numbers together\n  return a + b;\n}'
  },
  {
    id: 'sample_2',
    x: 450,
    y: 200,
    width: 250,
    height: 120,
    title: 'Function Call',
    code: 'const result = calculateSum(5, 3);\nconsole.log(`Result: ${result}`);'
  },
  {
    id: 'sample_3',
    x: 200,
    y: 350,
    width: 300,
    height: 160,
    title: 'Python Example',
    code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))'
  }
])

const connections = ref([])

const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 3)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.3)
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const handleWheel = (e) => {
  e.evt.preventDefault()
  
  const scaleBy = 1.1
  const oldScale = scale.value
  
  const pointer = e.target.getStage().getPointerPosition()
  
  const mousePointTo = {
    x: (pointer.x - stagePosition.value.x) / oldScale,
    y: (pointer.y - stagePosition.value.y) / oldScale,
  }
  
  const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  scale.value = Math.max(0.3, Math.min(newScale, 3))
  
  stagePosition.value = {
    x: pointer.x - mousePointTo.x * scale.value,
    y: pointer.y - mousePointTo.y * scale.value,
  }
}

const handleMouseDown = (e) => {
  if (e.target === e.target.getStage()) {
    isDragging.value = true
    lastPointerPosition.value = e.target.getStage().getPointerPosition()
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  const stage = e.target.getStage()
  const pointer = stage.getPointerPosition()
  
  stagePosition.value = {
    x: stagePosition.value.x + (pointer.x - lastPointerPosition.value.x),
    y: stagePosition.value.y + (pointer.y - lastPointerPosition.value.y),
  }
  
  lastPointerPosition.value = pointer
}

const handleMouseUp = () => {
  isDragging.value = false
}

const updateBlockPosition = (id, position) => {
  const block = codeBlocks.value.find(b => b.id === id)
  if (block) {
    if (showGrid.value) {
      position.x = Math.round(position.x / gridSize) * gridSize
      position.y = Math.round(position.y / gridSize) * gridSize
    }
    block.x = position.x
    block.y = position.y
    updateConnections()
  }
}

const selectBlock = (id) => {
  selectedBlockId.value = id
}

const addConnection = (fromBlockId, toBlockId) => {
  const fromBlock = codeBlocks.value.find(b => b.id === fromBlockId)
  const toBlock = codeBlocks.value.find(b => b.id === toBlockId)
  
  if (fromBlock && toBlock) {
    connections.value.push({
      id: `connection_${Date.now()}`,
      fromBlockId,
      toBlockId,
      points: calculateConnectionPoints(fromBlock, toBlock)
    })
  }
}

const calculateConnectionPoints = (fromBlock, toBlock) => {
  const fromCenterX = fromBlock.x + fromBlock.width / 2
  const fromCenterY = fromBlock.y + fromBlock.height / 2
  const toCenterX = toBlock.x + toBlock.width / 2
  const toCenterY = toBlock.y + toBlock.height / 2
  
  let fromX, fromY, toX, toY
  
  if (fromCenterX < toCenterX) {
    fromX = fromBlock.x + fromBlock.width
    fromY = fromCenterY
    toX = toBlock.x
    toY = toCenterY
  } else {
    fromX = fromBlock.x
    fromY = fromCenterY
    toX = toBlock.x + toBlock.width
    toY = toCenterY
  }
  
  return [fromX, fromY, toX, toY]
}

const calculateArrowPoints = (points) => {
  const [x1, y1, x2, y2] = points
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowLength = 15
  const arrowAngle = Math.PI / 6
  
  return [
    x2,
    y2,
    x2 - arrowLength * Math.cos(angle - arrowAngle),
    y2 - arrowLength * Math.sin(angle - arrowAngle),
    x2 - arrowLength * Math.cos(angle + arrowAngle),
    y2 - arrowLength * Math.sin(angle + arrowAngle)
  ]
}

const updateConnections = () => {
  connections.value.forEach(connection => {
    const fromBlock = codeBlocks.value.find(b => b.id === connection.fromBlockId)
    const toBlock = codeBlocks.value.find(b => b.id === connection.toBlockId)
    if (fromBlock && toBlock) {
      connection.points = calculateConnectionPoints(fromBlock, toBlock)
      connection.arrowPoints = calculateArrowPoints(connection.points)
    }
  })
}

const startEditingBlock = (blockId) => {
  console.log('Start editing block:', blockId)
}

const handleConnectionPoint = (data) => {
  if (!isConnecting.value) {
    isConnecting.value = true
    connectionStart.value = data
  } else {
    if (connectionStart.value.blockId !== data.blockId) {
      addConnection(connectionStart.value.blockId, data.blockId)
    }
    isConnecting.value = false
    connectionStart.value = null
    tempConnection.value = null
  }
}

const toggleConnectionMode = () => {
  isConnecting.value = !isConnecting.value
  if (!isConnecting.value) {
    connectionStart.value = null
    tempConnection.value = null
  }
}

const addCodeBlock = (block) => {
  codeBlocks.value.push({
    id: `block_${Date.now()}`,
    ...block
  })
}

defineExpose({
  addCodeBlock,
  addConnection,
  toggleConnectionMode,
  zoomIn,
  zoomOut,
  toggleGrid
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
}

.canvas-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 8px;
  z-index: 1000;
}

.zoom-btn, .grid-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover, .grid-btn:hover {
  background: #f0f0f0;
}

.zoom-level {
  padding: 4px 8px;
  min-width: 60px;
  text-align: center;
}

.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 1000;
}
</style>
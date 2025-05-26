<template>
  <div class="canvas-container">
    <div class="canvas-controls">
      <button @click="zoomIn" class="zoom-btn">🔍+</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomOut" class="zoom-btn">🔍-</button>
      <button @click="toggleGrid" :class="{ active: showGrid }" class="grid-btn">📏</button>
      <select v-model="selectedConnectionType" class="connection-type-select">
        <option v-for="type in ConnectionTypes" :key="type.id" :value="type">
          {{ type.label }}
        </option>
      </select>
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
          
          <!-- Connection lines with arrows and labels -->
          <v-group
            v-for="connection in connections"
            :key="connection.id"
          >
            <v-shape
              :config="{
                sceneFunc: (context, shape) => drawConnection(context, shape, connection),
                ...connection.type.style
              }"
            />
            <connection-label
              :connection="connection"
              :points="connection.points"
            />
          </v-group>
          
          <!-- Temporary connection line while drawing -->
          <v-line
            v-if="tempConnection"
            :config="{
              points: tempConnection.points,
              ...selectedConnectionType.style,
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
import ConnectionLabel from './ConnectionLabel.vue'
import { ConnectionTypes, calculateCurvedPath, calculateSmartRoutingPath } from '../utils/connectionTypes'

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
const selectedConnectionType = ref(ConnectionTypes.CALLS)

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

const drawConnection = (context, shape, connection) => {
  context.beginPath()
  
  if (connection.curved) {
    const points = calculateCurvedPath(...connection.points)
    context.moveTo(points[0], points[1])
    context.bezierCurveTo(
      points[2], points[3],
      points[4], points[5],
      points[6], points[7]
    )
  } else {
    const points = connection.points
    context.moveTo(points[0], points[1])
    for (let i = 2; i < points.length; i += 2) {
      context.lineTo(points[i], points[i + 1])
    }
  }
  
  context.strokeShape(shape)
  
  // Draw arrow
  const endPoint = connection.points.slice(-2)
  const prevPoint = connection.points.slice(-4, -2)
  const angle = Math.atan2(endPoint[1] - prevPoint[1], endPoint[0] - prevPoint[0])
  const arrowLength = 15
  const arrowAngle = Math.PI / 6
  
  context.beginPath()
  context.moveTo(endPoint[0], endPoint[1])
  context.lineTo(
    endPoint[0] - arrowLength * Math.cos(angle - arrowAngle),
    endPoint[1] - arrowLength * Math.sin(angle - arrowAngle)
  )
  context.lineTo(
    endPoint[0] - arrowLength * Math.cos(angle + arrowAngle),
    endPoint[1] - arrowLength * Math.sin(angle + arrowAngle)
  )
  context.closePath()
  context.fillStrokeShape(shape)
}

// ... (rest of the existing methods remain unchanged)

const addConnection = (fromBlockId, toBlockId) => {
  const fromBlock = codeBlocks.value.find(b => b.id === fromBlockId)
  const toBlock = codeBlocks.value.find(b => b.id === toBlockId)
  
  if (fromBlock && toBlock) {
    const points = calculateSmartRoutingPath(
      { x: fromBlock.x + fromBlock.width / 2, y: fromBlock.y + fromBlock.height / 2 },
      { x: toBlock.x + toBlock.width / 2, y: toBlock.y + toBlock.height / 2 },
      codeBlocks.value
    )
    
    connections.value.push({
      id: `connection_${Date.now()}`,
      fromBlockId,
      toBlockId,
      points,
      curved: true,
      type: selectedConnectionType.value,
      label: selectedConnectionType.value.label
    })
  }
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

.connection-type-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
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
<template>
  <div class="canvas-container">
    <v-stage
      :config="stageConfig"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <v-layer>
        <!-- Background grid -->
        <v-rect
          :config="{
            x: 0,
            y: 0,
            width: stageConfig.width,
            height: stageConfig.height,
            fill: '#f5f5f5',
          }"
        />
        
        <!-- CodeBlocks -->
        <code-block-group
          v-for="block in codeBlocks"
          :key="block.id"
          :block="block"
          :is-selected="selectedBlockId === block.id"
          :show-connection-points="isConnecting"
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
          <!-- Arrow head -->
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
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CodeBlockGroup from './CodeBlockGroup.vue'

const stageConfig = computed(() => ({
  width: window.innerWidth,
  height: window.innerHeight
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
const isDragging = ref(false)
const selectedBlockId = ref(null)
const isConnecting = ref(false)
const connectionStart = ref(null)
const tempConnection = ref(null)

const addCodeBlock = (block) => {
  codeBlocks.value.push({
    id: `block_${Date.now()}`,
    ...block
  })
}

const updateBlockPosition = (id, position) => {
  const block = codeBlocks.value.find(b => b.id === id)
  if (block) {
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
  
  // Calculate which sides to connect based on relative positions
  let fromX, fromY, toX, toY
  
  if (fromCenterX < toCenterX) {
    // Connect from right side of fromBlock to left side of toBlock
    fromX = fromBlock.x + fromBlock.width
    fromY = fromCenterY
    toX = toBlock.x
    toY = toCenterY
  } else {
    // Connect from left side of fromBlock to right side of toBlock
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

const handleMouseDown = () => {
  isDragging.value = true
}

const handleMouseMove = () => {
  if (isDragging.value) {
    // Handle panning logic here
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const startEditingBlock = (blockId) => {
  // In a real implementation, you'd show an editing modal or inline editor
  console.log('Start editing block:', blockId)
}

const handleConnectionPoint = (data) => {
  if (!isConnecting.value) {
    // Start connection
    isConnecting.value = true
    connectionStart.value = data
  } else {
    // Complete connection
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

// Expose methods to parent components
defineExpose({
  addCodeBlock,
  addConnection,
  toggleConnectionMode
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
}
</style> 
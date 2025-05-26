<script setup>
import { ref } from 'vue'
import Canvas from './components/Canvas.vue'

const canvasRef = ref(null)
const isConnectionMode = ref(false)

const addNewCodeBlock = () => {
  if (canvasRef.value) {
    canvasRef.value.addCodeBlock({
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      width: 200,
      height: 120,
      title: 'New Code Block',
      code: '// Add your code here\nfunction example() {\n  // Your logic\n}'
    })
  }
}

const toggleConnectionMode = () => {
  isConnectionMode.value = !isConnectionMode.value
  if (canvasRef.value) {
    canvasRef.value.toggleConnectionMode()
  }
}

const addSampleConnection = () => {
  if (canvasRef.value) {
    // This is a demo - in a real app, you'd select two blocks first
    canvasRef.value.addConnection('sample_1', 'sample_2')
  }
}
</script>

<template>
  <div class="app">
    <div class="toolbar">
      <button @click="addNewCodeBlock" class="toolbar-button">
        ➕ Add Code Block
      </button>
      <button @click="toggleConnectionMode" class="toolbar-button" :class="{ active: isConnectionMode }">
        🔗 {{ isConnectionMode ? 'Exit Connect Mode' : 'Connect Mode' }}
      </button>
      <button @click="addSampleConnection" class="toolbar-button secondary">
        ⚡ Quick Connect
      </button>
    </div>
    <Canvas ref="canvasRef" />
  </div>
</template>

<style>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
}

.toolbar-button {
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.toolbar-button:hover {
  background-color: #357abd;
}

.toolbar-button:active {
  background-color: #2a5f94;
}

.toolbar-button.secondary {
  background-color: #6c757d;
}

.toolbar-button.secondary:hover {
  background-color: #5a6268;
}

.toolbar-button.secondary:active {
  background-color: #495057;
}

.toolbar-button.active {
  background-color: #28a745;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
}

.toolbar-button.active:hover {
  background-color: #218838;
}
</style>

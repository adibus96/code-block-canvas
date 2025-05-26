<template>
  <v-group>
    <!-- Label background -->
    <v-rect
      :config="{
        x: labelPosition.x - labelWidth / 2,
        y: labelPosition.y - 12,
        width: labelWidth,
        height: 24,
        fill: 'white',
        stroke: connection.style.stroke,
        strokeWidth: 1,
        cornerRadius: 4,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 4,
        shadowOffset: { x: 0, y: 2 }
      }"
    />
    <!-- Label text -->
    <v-text
      :config="{
        x: labelPosition.x,
        y: labelPosition.y,
        text: connection.label,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: connection.style.stroke,
        align: 'center',
        verticalAlign: 'middle'
      }"
    />
  </v-group>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  connection: {
    type: Object,
    required: true
  },
  points: {
    type: Array,
    required: true
  }
})

const labelWidth = computed(() => props.connection.label.length * 8 + 16)

const labelPosition = computed(() => {
  const midIndex = Math.floor(props.points.length / 2)
  return {
    x: (props.points[midIndex - 2] + props.points[midIndex]) / 2,
    y: (props.points[midIndex - 1] + props.points[midIndex + 1]) / 2
  }
})
</script>
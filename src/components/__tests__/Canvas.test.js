import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Canvas from '../Canvas.vue'

describe('Canvas', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Canvas, {
      global: {
        stubs: ['v-stage', 'v-layer', 'v-group', 'v-rect', 'v-line', 'code-block-group']
      }
    })
  })

  it('initializes with default state', () => {
    expect(wrapper.vm.scale).toBe(1)
    expect(wrapper.vm.showGrid).toBe(true)
    expect(wrapper.vm.codeBlocks.length).toBe(3)
  })

  it('handles zoom controls', async () => {
    const initialScale = wrapper.vm.scale
    
    await wrapper.vm.zoomIn()
    expect(wrapper.vm.scale).toBeGreaterThan(initialScale)
    
    await wrapper.vm.zoomOut()
    expect(wrapper.vm.scale).toBe(initialScale)
  })

  it('toggles grid visibility', async () => {
    const initialGridState = wrapper.vm.showGrid
    
    await wrapper.vm.toggleGrid()
    expect(wrapper.vm.showGrid).toBe(!initialGridState)
  })

  it('adds new code blocks', () => {
    const initialBlockCount = wrapper.vm.codeBlocks.length
    
    wrapper.vm.addCodeBlock({
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      title: 'New Block',
      code: 'console.log("test")'
    })
    
    expect(wrapper.vm.codeBlocks.length).toBe(initialBlockCount + 1)
  })
})
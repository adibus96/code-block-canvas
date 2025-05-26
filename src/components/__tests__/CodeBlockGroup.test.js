import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeBlockGroup from '../CodeBlockGroup.vue'

describe('CodeBlockGroup', () => {
  const defaultProps = {
    block: {
      id: 'test-block',
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      title: 'Test Block',
      code: 'function test() {\n  return true;\n}'
    },
    isSelected: false,
    showConnectionPoints: false
  }

  it('renders properly', () => {
    const wrapper = mount(CodeBlockGroup, {
      props: defaultProps,
      global: {
        stubs: ['v-group', 'v-rect', 'v-text', 'v-circle']
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props().block.title).toBe('Test Block')
  })

  it('emits update:position event on drag end', async () => {
    const wrapper = mount(CodeBlockGroup, {
      props: defaultProps,
      global: {
        stubs: ['v-group', 'v-rect', 'v-text', 'v-circle']
      }
    })

    await wrapper.trigger('dragend', {
      target: {
        x: () => 150,
        y: () => 150
      }
    })

    expect(wrapper.emitted()['update:position']).toBeTruthy()
    expect(wrapper.emitted()['update:position'][0]).toEqual([{
      x: 150,
      y: 150
    }])
  })

  it('shows connection points when showConnectionPoints is true', () => {
    const wrapper = mount(CodeBlockGroup, {
      props: {
        ...defaultProps,
        showConnectionPoints: true
      },
      global: {
        stubs: ['v-group', 'v-rect', 'v-text', 'v-circle']
      }
    })

    const connectionPoints = wrapper.findAll('.connection-point')
    expect(connectionPoints.length).toBeGreaterThan(0)
  })
})
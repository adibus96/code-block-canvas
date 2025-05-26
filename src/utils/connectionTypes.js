export const ConnectionTypes = {
  CALLS: {
    id: 'calls',
    label: 'Calls',
    style: {
      stroke: '#4a90e2',
      strokeWidth: 2,
      dash: null
    }
  },
  RETURNS: {
    id: 'returns',
    label: 'Returns',
    style: {
      stroke: '#28a745',
      strokeWidth: 2,
      dash: null
    }
  },
  INHERITS: {
    id: 'inherits',
    label: 'Inherits',
    style: {
      stroke: '#6f42c1',
      strokeWidth: 2,
      dash: [5, 5]
    }
  },
  EXTENDS: {
    id: 'extends',
    label: 'Extends',
    style: {
      stroke: '#fd7e14',
      strokeWidth: 2,
      dash: [10, 5]
    }
  }
}

export function calculateCurvedPath(startX, startY, endX, endY) {
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const controlPoint1X = startX + (midX - startX) * 0.5
  const controlPoint1Y = startY
  const controlPoint2X = endX - (endX - midX) * 0.5
  const controlPoint2Y = endY
  
  return [
    startX, startY,
    controlPoint1X, controlPoint1Y,
    controlPoint2X, controlPoint2Y,
    endX, endY
  ]
}

export function calculateSmartRoutingPath(startPoint, endPoint, blocks) {
  // Implement path finding algorithm to avoid block intersections
  // This is a simplified version - we'll enhance it later
  const padding = 20
  const points = []
  
  points.push(startPoint.x, startPoint.y)
  
  // Check for potential block intersections and add intermediate points
  const hasIntersection = blocks.some(block => {
    return (
      Math.min(startPoint.x, endPoint.x) <= block.x + block.width &&
      Math.max(startPoint.x, endPoint.x) >= block.x &&
      Math.min(startPoint.y, endPoint.y) <= block.y + block.height &&
      Math.max(startPoint.y, endPoint.y) >= block.y
    )
  })
  
  if (hasIntersection) {
    // Add intermediate points to route around blocks
    const midX = (startPoint.x + endPoint.x) / 2
    const midY = (startPoint.y + endPoint.y) / 2
    points.push(midX, startPoint.y + padding)
    points.push(midX, endPoint.y - padding)
  }
  
  points.push(endPoint.x, endPoint.y)
  return points
}
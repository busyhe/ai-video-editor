import Mock from 'mockjs'
import resourceMock from './resource'
import accountMock from './account'

// Set timeout for mock requests
Mock.setup({
  timeout: '200-600'
})

// Enable/disable mock based on environment variable
const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

// Apply mocks
if (enableMock) {
  // Apply resource mocks
  resourceMock()
  
  // Apply account mocks
  accountMock()
  
  console.log('Mock service enabled')
}

export default Mock 
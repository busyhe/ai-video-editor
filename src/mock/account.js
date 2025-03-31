import Mock from 'mockjs'

const Random = Mock.Random

// Mock user data
const mockUser = {
  id: Random.guid(),
  name: 'Demo User',
  account: 'demo@example.com',
  email: 'demo@example.com',
  authorities: ['USER'],
  avatar: '/assets/image/1.png'
}

// Mock tokens data
const mockTokens = {
  quantity: 1000
}

export default function() {
  // Mock user info
  Mock.mock(new RegExp('/user/info'), 'get', () => {
    return mockUser
  })
  
  // Mock tokens quantity
  Mock.mock(new RegExp('/tokens/quantity'), 'get', () => {
    return mockTokens.quantity
  })
  
  // Mock expend tokens
  Mock.mock(new RegExp('/tokens/expend'), 'post', (options) => {
    try {
      const data = JSON.parse(options.body)
      const quantity = parseInt(data.quantity) || 0
      
      if (mockTokens.quantity >= quantity) {
        mockTokens.quantity -= quantity
        return {
          success: true,
          message: 'Tokens expended successfully',
          remaining: mockTokens.quantity
        }
      } else {
        return {
          success: false,
          message: 'Not enough tokens',
          remaining: mockTokens.quantity
        }
      }
    } catch (e) {
      return {
        success: false,
        message: 'Invalid request',
        remaining: mockTokens.quantity
      }
    }
  })
} 
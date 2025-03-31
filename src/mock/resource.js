import Mock from 'mockjs'
import { getRandomInteger } from './utils'

const Random = Mock.Random

// Define resource types
const RESOURCE_TYPES = {
  VIDEO: 'video',
  AUDIO: 'bgm',
  IMAGE: 'image'
}

// Define demo data
const generateMockMediaItems = (type, count = 3) => {
  const items = []
  
  for (let i = 0; i < count; i++) {
    const id = Random.guid()
    const now = new Date().getTime()
    
    // Generate appropriate data based on type
    if (type === RESOURCE_TYPES.VIDEO) {
      items.push({
        id,
        name: `Demo Video ${i + 1}`,
        type,
        size: Random.integer(1024 * 1024, 10 * 1024 * 1024),
        duration: 90000,
        url: '/assets/video/1.mp4',
        cover: '/assets/image/1.png',
        creator: i % 2 === 0 ? Random.cname() : null,
        createTime: now - Random.integer(0, 30 * 24 * 60 * 60 * 1000)
      })
    } else if (type === RESOURCE_TYPES.AUDIO) {
      items.push({
        id,
        name: `Demo Audio ${i + 1}`,
        type,
        size: Random.integer(512 * 1024, 5 * 1024 * 1024),
        duration: i % 2 === 0 ? 7000 : 41000,
        url: i % 2 === 0 ? '/assets/audio/1.mp3' : '/assets/audio/2.mp3',
        cover: null,
        creator: i % 2 === 0 ? Random.cname() : null,
        createTime: now - Random.integer(0, 30 * 24 * 60 * 60 * 1000)
      })
    } else if (type === RESOURCE_TYPES.IMAGE) {
      console.debug('[DEBUG__mock/resource.js-i]', i % 2)
      items.push({
        id,
        name: `Demo Image ${i + 1}`,
        type,
        size: Random.integer(50 * 1024, 1024 * 1024),
        duration: 0,
        url: i % 2 === 0 ? '/assets/image/1.png' : '/assets/image/2.png',
        cover: i % 2 === 0 ? '/assets/image/pre1.png' : '/assets/image/pre2.png',
        creator: i % 2 === 0 ? Random.cname() : null,
        createTime: now - Random.integer(0, 30 * 24 * 60 * 60 * 1000)
      })
    }
  }
  
  return items
}

// Generate and store mock data
const mockData = {
  [RESOURCE_TYPES.VIDEO]: generateMockMediaItems(RESOURCE_TYPES.VIDEO, 2),
  [RESOURCE_TYPES.AUDIO]: generateMockMediaItems(RESOURCE_TYPES.AUDIO, 2),
  [RESOURCE_TYPES.IMAGE]: generateMockMediaItems(RESOURCE_TYPES.IMAGE, 2)
}

// Mock figures (avatars)
const mockFigures = Array.from({ length: 10 }, (_, i) => ({
  id: Random.guid(),
  name: `Avatar ${i + 1}`,
  type: ['human', 'cartoon', 'animal'][i % 3],
  url: '/assets/image/1.png'
}))

export default function() {
  // Mock resource list API
  Mock.mock(new RegExp('/resource/list'), 'get', (options) => {
    const url = new URL('http://example.com' + options.url)
    const type = url.searchParams.get('type')
    const current = parseInt(url.searchParams.get('current')) || 1
    const size = parseInt(url.searchParams.get('size')) || 10
    const keyword = url.searchParams.get('keyword') || ''
    
    let totalItems = mockData[type] || []

    // Filter by keyword if provided
    if (keyword) {
      totalItems = totalItems.filter(item => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        (item.creator && item.creator.toLowerCase().includes(keyword.toLowerCase())) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())))
      )
    }
    
    // Handle pagination
    const startIndex = (current - 1) * size
    const endIndex = startIndex + size
    const items = totalItems.slice(startIndex, endIndex)
    
    return items
  })
  
  // Mock resource count API
  Mock.mock(new RegExp('/resource/count'), 'get', (options) => {
    const url = new URL('http://example.com' + options.url)
    const type = url.searchParams.get('type')
    const keyword = url.searchParams.get('keyword') || ''
    
    let totalItems = mockData[type] || []
    
    // Filter by keyword if provided
    if (keyword) {
      totalItems = totalItems.filter(item => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        (item.creator && item.creator.toLowerCase().includes(keyword.toLowerCase())) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())))
      )
    }
    
    return totalItems.length
  })
  
  // Mock avatar list API
  Mock.mock(new RegExp('/avatar/list'), 'get', () => {
    return mockFigures
  })
  
  // Mock resource save API
  Mock.mock(new RegExp('/resource/save'), 'post', (options) => {
    const { body } = options
    let data = {}
    
    try {
      data = JSON.parse(body)
    } catch (e) {
      // Handle FormData (this is simplified, in a real case we would parse FormData properly)
      // For mock purposes, we'll create a new entry with provided or default values
      data = {
        id: Random.guid(),
        name: `New Resource ${Date.now()}`,
        type: RESOURCE_TYPES.VIDEO,
        size: 1024 * 1024,
        duration: 60,
        url: '/assets/video/1.mp4',
        cover: '/assets/image/1.png',
        creator: 'Current User',
        createTime: Date.now()
      }
    }
    
    // Add to mock data
    if (data.type && mockData[data.type]) {
      // If ID exists, update instead of creating new
      const existingIndex = mockData[data.type].findIndex(item => item.id === data.id)
      
      if (existingIndex >= 0) {
        mockData[data.type][existingIndex] = {
          ...mockData[data.type][existingIndex],
          ...data
        }
      } else {
        mockData[data.type].unshift({
          ...data,
          id: data.id || Random.guid(),
          createTime: Date.now()
        })
      }
    }
    
    return {
      success: true,
      message: 'Resource saved successfully'
    }
  })
  
  // Mock resource delete API
  Mock.mock(new RegExp('/resource/del/.*'), 'post', (options) => {
    const id = options.url.split('/').pop()
    
    // Remove from all collections
    Object.keys(mockData).forEach(type => {
      const index = mockData[type].findIndex(item => item.id === id)
      if (index !== -1) {
        mockData[type].splice(index, 1)
      }
    })
    
    return {
      success: true,
      message: 'Resource deleted successfully'
    }
  })
  
  // Mock resource rename API
  Mock.mock(new RegExp('/resource/rename/.*'), 'post', (options) => {
    const id = options.url.split('/').pop()
    const { body } = options
    let data = {}
    
    try {
      data = JSON.parse(body)
    } catch (e) {
      data = { name: `Renamed Resource ${Date.now()}` }
    }
    
    // Update in all collections
    Object.keys(mockData).forEach(type => {
      const item = mockData[type].find(item => item.id === id)
      if (item) {
        item.name = data.name
      }
    })
    
    return {
      success: true,
      message: 'Resource renamed successfully'
    }
  })
  
  // Mock resource search API (new endpoint)
  Mock.mock(new RegExp('/resource/search'), 'get', (options) => {
    const url = new URL('http://example.com' + options.url)
    const keyword = url.searchParams.get('keyword') || ''
    const current = parseInt(url.searchParams.get('current')) || 1
    const size = parseInt(url.searchParams.get('size')) || 10
    
    if (!keyword) {
      return []
    }
    
    // Search across all resource types
    let results = []
    Object.keys(mockData).forEach(type => {
      const matches = mockData[type].filter(item => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) || 
        (item.creator && item.creator.toLowerCase().includes(keyword.toLowerCase())) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())))
      )
      results = [...results, ...matches]
    })
    
    // Sort by createTime (newest first)
    results.sort((a, b) => b.createTime - a.createTime)
    
    // Handle pagination
    const startIndex = (current - 1) * size
    const endIndex = startIndex + size
    
    return {
      items: results.slice(startIndex, endIndex),
      total: results.length
    }
  })
} 
/**
 * Get random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get random item from array
 * @param {Array} array - Array to select from
 * @returns {*} Random item from array
 */
export function getRandomArrayItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Delay execution for specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Parse query parameters from URL string
 * @param {string} url - URL string
 * @returns {Object} Object containing query parameters
 */
export function parseQuery(url) {
  const queryString = url.split('?')[1] || ''
  if (!queryString) return {}
  
  return queryString.split('&').reduce((params, param) => {
    const [key, value] = param.split('=')
    params[key] = decodeURIComponent(value || '')
    return params
  }, {})
} 
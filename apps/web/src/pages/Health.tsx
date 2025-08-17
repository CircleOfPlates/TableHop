import { useEffect } from 'react'

const Health = () => {
  useEffect(() => {
    // Return a simple JSON response for health checks
    const response = { ok: true, service: 'tablehop-web', timestamp: new Date().toISOString() }
    
    // Set content type to JSON
    document.title = 'Health Check'
    
    // Create a simple JSON response
    const jsonResponse = JSON.stringify(response, null, 2)
    
    // Replace the entire document content with the JSON response
    document.body.innerHTML = `<pre>${jsonResponse}</pre>`
    document.body.style.fontFamily = 'monospace'
    document.body.style.padding = '20px'
    document.body.style.margin = '0'
    document.body.style.backgroundColor = '#f5f5f5'
  }, [])

  return null
}

export default Health

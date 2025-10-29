import { Platform } from 'react-native';

// TwinMind AI Server Configuration
export const API_BASE_URL = Platform.select({
  ios: 'http://10.127.154.99:5000',
  android: 'http://10.127.154.99:5000', 
  web: 'http://10.127.154.99:5000',
  default: 'http://10.127.154.99:5000'
});

export const API_ENDPOINTS = {
  HEALTH: '/health',
  GENERATE_INSIGHTS: '/generate-insights',
  TRANSCRIBE: '/transcribe',
  AI_MODE: '/ai-mode',
  CONVERSATION_HISTORY: '/conversation-history',
  MEMORY_STATS: '/memory-stats'
};

// Helper function for API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🔗 API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ API Error: ${url}`, error);
    throw error;
  }
};

console.log('🔗 TwinMind API configured for:', API_BASE_URL);

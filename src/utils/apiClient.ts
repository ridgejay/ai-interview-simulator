interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static rateLimitMap = new Map<string, number>();
  private static requestCount = 0;
  private static readonly MAX_REQUESTS_PER_MINUTE = 10;

  async makeOpenAIRequest(config: any): Promise<Response> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return response;
  }

  static async callWithRetry<T>(
    apiCall: () => Promise<Response>,
    options: RetryOptions = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
  ): Promise<ApiResponse<T>> {
    const { maxRetries, baseDelay, maxDelay } = options;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limiting
        if (!this.checkRateLimit()) {
          return {
            success: false,
            error: 'Too many requests. Please wait a moment before trying again.'
          };
        }

        const response = await apiCall();
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }

        // Handle specific error codes
        if (response.status === 429) {
          // Rate limited - wait longer
          const delay = Math.min(baseDelay * Math.pow(2, attempt + 1), maxDelay);
          if (attempt < maxRetries) {
            await this.sleep(delay);
            continue;
          }
          return {
            success: false,
            error: 'Service is busy. Please try again in a few moments.'
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            error: 'API authentication failed. Please check configuration.'
          };
        }

        if (response.status >= 500) {
          // Server error - retry
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          if (attempt < maxRetries) {
            await this.sleep(delay);
            continue;
          }
        }

        // Client error - don't retry
        return {
          success: false,
          error: `Request failed with status ${response.status}`
        };

      } catch (error) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error occurred'
          };
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: 'Maximum retry attempts exceeded'
    };
  }

  private static checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old entries
    this.rateLimitMap.forEach((timestamp, key) => {
      if (timestamp < oneMinuteAgo) {
        this.rateLimitMap.delete(key);
      }
    });

    // Check if we're under the limit
    if (this.rateLimitMap.size >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    // Add current request
    this.rateLimitMap.set(`${now}-${++this.requestCount}`, now);
    return true;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function safeApiCall<T>(
  apiCall: () => Promise<Response>,
  fallback?: T
): Promise<ApiResponse<T>> {
  const result = await ApiClient.callWithRetry<T>(apiCall);
  
  if (!result.success && fallback !== undefined) {
    return {
      success: true,
      data: fallback,
      error: 'Using fallback due to API issues'
    };
  }
  
  return result;
}
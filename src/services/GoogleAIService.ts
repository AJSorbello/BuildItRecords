interface GenerateContentRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GenerateContentResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

class GoogleAIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_AI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      console.error('Google AI API key is not configured');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const requestBody: GenerateContentRequest = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };

      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateContentResponse = await response.json();
      return data.candidates[0]?.content.parts[0]?.text || '';
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
}

export const googleAIService = new GoogleAIService();

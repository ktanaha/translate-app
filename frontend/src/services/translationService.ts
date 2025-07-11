import { TranslationRequest, TranslationResponse } from '../types/translation';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export interface TranslationService {
  translate(text: string): Promise<TranslationResponse>;
}

class ApiTranslationService implements TranslationService {
  async translate(text: string): Promise<TranslationResponse> {
    const request: TranslationRequest = { text };
    
    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`翻訳API呼び出しに失敗しました: ${response.status}`);
    }
    
    return response.json();
  }
}

// シングルトンパターンで翻訳サービスを提供
export const translationService: TranslationService = new ApiTranslationService();
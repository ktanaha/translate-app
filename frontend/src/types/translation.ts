// 翻訳リクエストの型定義
export interface TranslationRequest {
  text: string;
}

// 翻訳レスポンスの型定義
export interface TranslationResponse {
  original_text: string;
  intermediate_text: string;
  intermediate_language: string;
  final_text: string;
}

// 翻訳結果の表示用型定義
export interface TranslationResult {
  originalText: string;
  intermediateText: string;
  intermediateLanguage: string;
  finalText: string;
}
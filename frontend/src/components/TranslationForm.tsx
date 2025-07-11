import React, { useState } from 'react';
import { translationService } from '../services/translationService';
import { TranslationResult } from '../types/translation';
import { logger } from '../services/loggerService';

export const TranslationForm: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // コンポーネントのマウントをログに記録
  React.useEffect(() => {
    logger.info('TranslationFormコンポーネントがマウントされました');
    
    return () => {
      logger.info('TranslationFormコンポーネントがアンマウントされました');
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputText(newValue);
    
    // 一定の文字数ごとにログを記録（スパム防止）
    if (newValue.length % 10 === 0 && newValue.length > 0) {
      logger.debug('テキスト入力', {
        text_length: newValue.length,
        char_count_milestone: newValue.length
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ユーザーアクションをログに記録
    logger.logUserAction('translation_submit', 'submit_button', {
      text_length: inputText.length,
      has_text: !!inputText.trim()
    });
    
    if (!inputText.trim()) {
      logger.warn('空のテキストで翻訳が実行されようとしました');
      return;
    }

    // 翻訳操作の開始をログに記録
    const tracker = logger.startOperation('translation_process', {
      original_text: inputText,
      text_length: inputText.length
    });

    setIsLoading(true);
    setError(null);

    try {
      // API呼び出しをログに記録
      logger.logApiCall('POST', '/api/translate', {
        text_length: inputText.length
      });

      const response = await translationService.translate(inputText);
      
      const result: TranslationResult = {
        originalText: response.original_text,
        intermediateText: response.intermediate_text,
        intermediateLanguage: response.intermediate_language,
        finalText: response.final_text,
      };

      setTranslationResult(result);

      // 翻訳操作の完了をログに記録
      logger.completeOperation(tracker, {
        intermediate_language: response.intermediate_language,
        intermediate_text_length: response.intermediate_text.length,
        final_text_length: response.final_text.length
      });

    } catch (err) {
      const error = err as Error;
      setError('翻訳中にエラーが発生しました');
      
      // エラーをログに記録
      logger.errorOperation(tracker, error, 'ユーザーにエラーメッセージを表示');
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="translation-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="translation-input">翻訳したいテキスト</label>
          <input
            id="translation-input"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="ここにテキストを入力してください..."
          />
        </div>
        <button 
          type="submit" 
          disabled={!inputText.trim() || isLoading}
        >
          翻訳する
        </button>
      </form>

      {isLoading && <div className="loading">翻訳中...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {translationResult && (
        <div className="translation-result">
          <h3>元のテキスト</h3>
          <p>{translationResult.originalText}</p>
          
          <h3>中間言語での翻訳</h3>
          <p>{translationResult.intermediateText}</p>
          <p>言語: {translationResult.intermediateLanguage}</p>
          
          <h3>最終的な日本語翻訳</h3>
          <p>{translationResult.finalText}</p>
        </div>
      )}
    </div>
  );
};
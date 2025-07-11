import React, { useState } from 'react';
import { translationService } from '../services/translationService';
import { TranslationResult } from '../types/translation';
import { logger } from '../services/loggerService';

interface TranslationStep {
  id: number;
  originalText: string;
  intermediateText: string;
  intermediateLanguage: string;
  finalText: string;
  status: 'pending' | 'translating' | 'completed' | 'error';
}

export const MultiTranslationForm: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translationSteps, setTranslationSteps] = useState<TranslationStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [repeatCount, setRepeatCount] = useState(5);

  React.useEffect(() => {
    logger.info('MultiTranslationFormコンポーネントがマウントされました');
    
    return () => {
      logger.info('MultiTranslationFormコンポーネントがアンマウントされました');
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputText(newValue);
    
    if (newValue.length % 10 === 0 && newValue.length > 0) {
      logger.debug('テキスト入力', {
        text_length: newValue.length,
        char_count_milestone: newValue.length
      });
    }
  };

  const handleRepeatCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (count >= 1 && count <= 10) {
      setRepeatCount(count);
    }
  };

  const initializeSteps = (text: string, count: number): TranslationStep[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      originalText: text,
      intermediateText: '',
      intermediateLanguage: '',
      finalText: '',
      status: 'pending'
    }));
  };

  const executeTranslation = async (step: TranslationStep, index: number) => {
    const tracker = logger.startOperation('multi_translation_step', {
      step_id: step.id,
      original_text: step.originalText,
      text_length: step.originalText.length
    });

    try {
      // ステップのステータスを更新
      setTranslationSteps(prev => 
        prev.map((s, i) => 
          i === index ? { ...s, status: 'translating' as const } : s
        )
      );

      logger.logApiCall('POST', '/api/translate', {
        step_id: step.id,
        text_length: step.originalText.length
      });

      const response = await translationService.translate(step.originalText);
      
      // 翻訳結果でステップを更新
      setTranslationSteps(prev => 
        prev.map((s, i) => 
          i === index ? {
            ...s,
            intermediateText: response.intermediate_text,
            intermediateLanguage: response.intermediate_language,
            finalText: response.final_text,
            status: 'completed' as const
          } : s
        )
      );

      logger.completeOperation(tracker, {
        step_id: step.id,
        intermediate_language: response.intermediate_language,
        intermediate_text_length: response.intermediate_text.length,
        final_text_length: response.final_text.length
      });

      return response.final_text;

    } catch (err) {
      const error = err as Error;
      
      // エラーステータスを更新
      setTranslationSteps(prev => 
        prev.map((s, i) => 
          i === index ? { ...s, status: 'error' as const } : s
        )
      );

      logger.errorOperation(tracker, error, 'ステップをエラー状態に更新');
      
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.logUserAction('multi_translation_submit', 'submit_button', {
      text_length: inputText.length,
      repeat_count: repeatCount,
      has_text: !!inputText.trim()
    });
    
    if (!inputText.trim()) {
      logger.warn('空のテキストで複数回翻訳が実行されようとしました');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);
    
    // 初期化
    const steps = initializeSteps(inputText, repeatCount);
    setTranslationSteps(steps);

    const multiTranslationTracker = logger.startOperation('multi_translation_process', {
      original_text: inputText,
      text_length: inputText.length,
      repeat_count: repeatCount
    });

    try {
      let currentText = inputText;
      
      for (let i = 0; i < repeatCount; i++) {
        setCurrentStep(i + 1);
        
        // 前回の結果を次の入力として使用
        const stepWithCurrentText = { ...steps[i], originalText: currentText };
        
        const finalText = await executeTranslation(stepWithCurrentText, i);
        currentText = finalText;
        
        // 少し待機してUIの更新を見やすくする
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger.completeOperation(multiTranslationTracker, {
        total_steps: repeatCount,
        final_text: currentText,
        final_text_length: currentText.length
      });

    } catch (error) {
      logger.errorOperation(multiTranslationTracker, error as Error, '複数回翻訳プロセスが中断されました');
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const resetForm = () => {
    logger.logUserAction('multi_translation_reset', 'reset_button', {
      had_results: translationSteps.length > 0
    });
    
    setTranslationSteps([]);
    setCurrentStep(0);
    setIsProcessing(false);
  };

  const getStepStatusIcon = (status: TranslationStep['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'translating': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStepStatusText = (status: TranslationStep['status']) => {
    switch (status) {
      case 'pending': return '待機中';
      case 'translating': return '翻訳中...';
      case 'completed': return '完了';
      case 'error': return 'エラー';
      default: return '待機中';
    }
  };

  return (
    <div className="multi-translation-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="multi-translation-input">翻訳したいテキスト</label>
          <input
            id="multi-translation-input"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="ここにテキストを入力してください..."
            disabled={isProcessing}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="repeat-count">繰り返し回数</label>
          <input
            id="repeat-count"
            type="number"
            min="1"
            max="10"
            value={repeatCount}
            onChange={handleRepeatCountChange}
            disabled={isProcessing}
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={!inputText.trim() || isProcessing}
          >
            {isProcessing ? `翻訳中... (${currentStep}/${repeatCount})` : '複数回翻訳を開始'}
          </button>
          
          {translationSteps.length > 0 && (
            <button 
              type="button" 
              onClick={resetForm}
              disabled={false}
            >
              リセット
            </button>
          )}
        </div>
      </form>

      {translationSteps.length > 0 && (
        <div className="translation-steps">
          <h3>翻訳過程</h3>
          <div className="progress-bar" data-testid="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(translationSteps.filter(s => s.status === 'completed').length / translationSteps.length) * 100}%` 
              }}
            />
          </div>
          
          {translationSteps.map((step, index) => (
            <div key={step.id} className={`translation-step ${step.status}`}>
              <div className="step-header">
                <span className="step-number">ステップ {step.id}</span>
                <span className="step-status">
                  {getStepStatusIcon(step.status)} {getStepStatusText(step.status)}
                </span>
              </div>
              
              <div className="step-content">
                <div className="step-text">
                  <strong>入力:</strong> {step.originalText}
                </div>
                
                {step.intermediateText && (
                  <div className="step-intermediate">
                    <strong>中間言語 ({step.intermediateLanguage}):</strong> {step.intermediateText}
                  </div>
                )}
                
                {step.finalText && (
                  <div className="step-final">
                    <strong>日本語:</strong> {step.finalText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranslationForm } from './TranslationForm';
import '@testing-library/jest-dom';

// モック関数を作成
const mockTranslate = jest.fn();

// APIをモック化
jest.mock('../services/translationService', () => ({
  translationService: {
    translate: (...args: any[]) => mockTranslate(...args)
  }
}));

describe('TranslationForm', () => {
  beforeEach(() => {
    mockTranslate.mockClear();
  });

  test('初期状態で入力フィールドと送信ボタンが表示される', () => {
    render(<TranslationForm />);
    
    // 入力フィールドが表示されている
    expect(screen.getByLabelText('翻訳したいテキスト')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    
    // 送信ボタンが表示されている
    expect(screen.getByRole('button', { name: '翻訳する' })).toBeInTheDocument();
  });

  test('テキストを入力して送信すると翻訳が実行される', async () => {
    const mockResponse = {
      original_text: 'こんにちは',
      intermediate_text: 'Hello',
      intermediate_language: 'en',
      final_text: 'こんにちは'
    };
    
    mockTranslate.mockResolvedValue(mockResponse);
    
    render(<TranslationForm />);
    
    // テキストを入力
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'こんにちは' } });
    
    // 送信ボタンをクリック
    const button = screen.getByRole('button', { name: '翻訳する' });
    fireEvent.click(button);
    
    // 翻訳APIが呼ばれることを確認
    await waitFor(() => {
      expect(mockTranslate).toHaveBeenCalledWith('こんにちは');
    });
  });

  test('空のテキストでは送信できない', () => {
    render(<TranslationForm />);
    
    const button = screen.getByRole('button', { name: '翻訳する' });
    
    // 初期状態では送信ボタンが無効になっている
    expect(button).toBeDisabled();
  });

  test('翻訳結果が表示される', async () => {
    const mockResponse = {
      original_text: 'こんにちは',
      intermediate_text: 'Hello',
      intermediate_language: 'en',
      final_text: 'こんにちは'
    };
    
    mockTranslate.mockResolvedValue(mockResponse);
    
    render(<TranslationForm />);
    
    // テキストを入力
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'こんにちは' } });
    
    // 送信ボタンをクリック
    const button = screen.getByRole('button', { name: '翻訳する' });
    fireEvent.click(button);
    
    // 翻訳結果が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('元のテキスト')).toBeInTheDocument();
      expect(screen.getAllByText('こんにちは')).toHaveLength(2); // 入力値と翻訳結果の両方
      expect(screen.getByText('中間言語での翻訳')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('最終的な日本語翻訳')).toBeInTheDocument();
    });
  });

  test('翻訳中はローディング表示される', async () => {
    // 翻訳APIを遅延させる
    mockTranslate.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        original_text: 'こんにちは',
        intermediate_text: 'Hello',
        intermediate_language: 'en',
        final_text: 'こんにちは'
      }), 100))
    );
    
    render(<TranslationForm />);
    
    // テキストを入力
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'こんにちは' } });
    
    // 送信ボタンをクリック
    const button = screen.getByRole('button', { name: '翻訳する' });
    fireEvent.click(button);
    
    // ローディング表示を確認
    expect(screen.getByText('翻訳中...')).toBeInTheDocument();
    
    // 翻訳完了を待つ
    await waitFor(() => {
      expect(screen.queryByText('翻訳中...')).not.toBeInTheDocument();
    });
  });

  test('翻訳エラーが発生した場合エラーメッセージが表示される', async () => {
    mockTranslate.mockRejectedValue(new Error('翻訳エラー'));
    
    render(<TranslationForm />);
    
    // テキストを入力
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'こんにちは' } });
    
    // 送信ボタンをクリック
    const button = screen.getByRole('button', { name: '翻訳する' });
    fireEvent.click(button);
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('翻訳中にエラーが発生しました')).toBeInTheDocument();
    });
  });
});
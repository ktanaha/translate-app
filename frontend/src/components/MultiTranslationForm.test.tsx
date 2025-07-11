import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiTranslationForm } from './MultiTranslationForm';
import { translationService } from '../services/translationService';

// translationServiceをモック
jest.mock('../services/translationService', () => ({
  translationService: {
    translate: jest.fn(),
  },
}));

// loggerServiceをモック
jest.mock('../services/loggerService', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    logUserAction: jest.fn(),
    startOperation: jest.fn(() => ({ id: 'test-tracker' })),
    completeOperation: jest.fn(),
    errorOperation: jest.fn(),
    logApiCall: jest.fn(),
  },
}));

const mockTranslationService = translationService as jest.Mocked<typeof translationService>;

describe('MultiTranslationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTranslationService.translate.mockResolvedValue({
      original_text: 'Hello',
      intermediate_text: 'Bonjour',
      intermediate_language: 'fr',
      final_text: 'こんにちは',
    });
  });

  test('コンポーネントが正しくレンダリングされる', () => {
    render(<MultiTranslationForm />);
    
    expect(screen.getByLabelText('翻訳したいテキスト')).toBeInTheDocument();
    expect(screen.getByLabelText('繰り返し回数')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '複数回翻訳を開始' })).toBeInTheDocument();
  });

  test('テキスト入力が正しく動作する', () => {
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    fireEvent.change(textInput, { target: { value: 'Hello world' } });
    
    expect(textInput).toHaveValue('Hello world');
  });

  test('繰り返し回数の変更が正しく動作する', () => {
    render(<MultiTranslationForm />);
    
    const repeatInput = screen.getByLabelText('繰り返し回数');
    fireEvent.change(repeatInput, { target: { value: '3' } });
    
    expect(repeatInput).toHaveValue(3);
  });

  test('空のテキストではボタンが無効になる', () => {
    render(<MultiTranslationForm />);
    
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    expect(submitButton).toBeDisabled();
  });

  test('テキストが入力されるとボタンが有効になる', () => {
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    
    fireEvent.change(textInput, { target: { value: 'Hello' } });
    
    expect(submitButton).not.toBeDisabled();
  });

  test('複数回翻訳の実行が正しく動作する', async () => {
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    const repeatInput = screen.getByLabelText('繰り返し回数');
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    
    // 入力値を設定
    fireEvent.change(textInput, { target: { value: 'Hello' } });
    fireEvent.change(repeatInput, { target: { value: '2' } });
    
    // フォーム送信
    fireEvent.click(submitButton);
    
    // 翻訳過程の見出しが表示される
    await waitFor(() => {
      expect(screen.getByText('翻訳過程')).toBeInTheDocument();
    });
    
    // 翻訳ステップが表示される
    await waitFor(() => {
      expect(screen.getByText('ステップ 1')).toBeInTheDocument();
      expect(screen.getByText('ステップ 2')).toBeInTheDocument();
    });
    
    // プログレスバーが表示される
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  test('翻訳中はボタンが無効になり、テキストが変更される', async () => {
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    
    fireEvent.change(textInput, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);
    
    // 翻訳中はボタンが無効になる
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // ボタンのテキストが変更される
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/翻訳中/);
    });
  });

  test('リセットボタンが正しく動作する', async () => {
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    
    fireEvent.change(textInput, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);
    
    // 翻訳結果が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('翻訳過程')).toBeInTheDocument();
    });
    
    // リセットボタンをクリック
    const resetButton = screen.getByRole('button', { name: 'リセット' });
    fireEvent.click(resetButton);
    
    // 翻訳結果が消える
    await waitFor(() => {
      expect(screen.queryByText('翻訳過程')).not.toBeInTheDocument();
    });
  });

  test('エラーハンドリングが正しく動作する', async () => {
    // 翻訳サービスでエラーが発生する設定
    mockTranslationService.translate.mockRejectedValue(new Error('翻訳エラー'));
    
    render(<MultiTranslationForm />);
    
    const textInput = screen.getByLabelText('翻訳したいテキスト');
    const submitButton = screen.getByRole('button', { name: '複数回翻訳を開始' });
    
    fireEvent.change(textInput, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);
    
    // エラーステータスが表示される
    await waitFor(() => {
      expect(screen.getByText('❌ エラー')).toBeInTheDocument();
    });
  });

  test('繰り返し回数の制限が正しく動作する', () => {
    render(<MultiTranslationForm />);
    
    const repeatInput = screen.getByLabelText('繰り返し回数');
    
    // 最小値テスト
    fireEvent.change(repeatInput, { target: { value: '0' } });
    expect(repeatInput).toHaveValue(5); // 変更されない
    
    // 最大値テスト
    fireEvent.change(repeatInput, { target: { value: '15' } });
    expect(repeatInput).toHaveValue(5); // 変更されない
    
    // 有効範囲テスト
    fireEvent.change(repeatInput, { target: { value: '7' } });
    expect(repeatInput).toHaveValue(7); // 変更される
  });
});
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"cloud.google.com/go/translate"
	"golang.org/x/text/language"
)

// TranslationService は翻訳サービスのインターフェース
type TranslationService interface {
	Translate(text, targetLang string) (string, error)
}

// GoogleTranslateService はGoogle Translate APIを使用する翻訳サービス
type GoogleTranslateService struct {
	client *translate.Client
}

// NewGoogleTranslateService はGoogleTranslateServiceの新しいインスタンスを作成
func NewGoogleTranslateService() (*GoogleTranslateService, error) {
	ctx := context.Background()
	
	// Google Translate APIクライアントを作成
	client, err := translate.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("Google Translate クライアントの作成に失敗: %v", err)
	}
	
	return &GoogleTranslateService{client: client}, nil
}

// Translate はテキストを指定された言語に翻訳する
func (g *GoogleTranslateService) Translate(text, targetLang string) (string, error) {
	ctx := context.Background()
	
	// 言語タグを解析
	lang, err := language.Parse(targetLang)
	if err != nil {
		return "", fmt.Errorf("言語コードの解析に失敗: %v", err)
	}
	
	// 翻訳を実行
	resp, err := g.client.Translate(ctx, []string{text}, lang, nil)
	if err != nil {
		return "", fmt.Errorf("翻訳に失敗: %v", err)
	}
	
	if len(resp) == 0 {
		return "", fmt.Errorf("翻訳結果が空です")
	}
	
	return resp[0].Text, nil
}

// Close はクライアントを閉じる
func (g *GoogleTranslateService) Close() error {
	return g.client.Close()
}

// MockTranslationService はテスト用のモック翻訳サービス
type MockTranslationService struct{}

// Translate はモック翻訳を実行する
func (m *MockTranslationService) Translate(text, targetLang string) (string, error) {
	// テスト用のモック実装
	switch targetLang {
	case "en":
		return "Hello world", nil
	case "es":
		return "Hola mundo", nil
	case "fr":
		return "Bonjour le monde", nil
	case "de":
		return "Hallo Welt", nil
	case "ja":
		return "こんにちは世界", nil
	default:
		return fmt.Sprintf("Translated to %s: %s", targetLang, text), nil
	}
}

// NewTranslationService は環境に応じて適切な翻訳サービスを作成
func NewTranslationService() TranslationService {
	// 開発環境またはテスト環境ではモックを使用
	if os.Getenv("GO_ENV") == "development" || os.Getenv("GO_ENV") == "test" {
		log.Println("モック翻訳サービスを使用")
		return &MockTranslationService{}
	}
	
	// 本番環境では実際のGoogle Translate APIを使用
	service, err := NewGoogleTranslateService()
	if err != nil {
		log.Printf("Google Translate サービスの初期化に失敗、モックを使用: %v", err)
		return &MockTranslationService{}
	}
	
	log.Println("Google Translate サービスを使用")
	return service
}
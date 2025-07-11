package main

import (
	"testing"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// 構造体定義はmain.goから使用

// TestTranslationEndpoint はRed段階のテスト - 翻訳APIエンドポイントの基本動作をテスト
func TestTranslationEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// テスト用の翻訳サービスとロガーを初期化
	translationService = &MockTranslationService{}
	appLogger = NewLogger(ERROR) // テスト時はエラーレベルのみ
	
	t.Run("POST /api/translate - 正常なリクエストで翻訳が実行される", func(t *testing.T) {
		// テストデータ
		requestBody := TranslationRequest{
			Text: "こんにちは世界",
		}
		
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("POST", "/api/translate", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		// レスポンスレコーダー
		w := httptest.NewRecorder()
		
		// ルーターの設定
		router := setupRouter()
		router.ServeHTTP(w, req)
		
		// アサーション
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response TranslationResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// レスポンスの検証
		assert.Equal(t, "こんにちは世界", response.OriginalText)
		assert.NotEmpty(t, response.IntermediateText)
		assert.NotEmpty(t, response.IntermediateLanguage)
		assert.NotEmpty(t, response.FinalText)
	})
	
	t.Run("POST /api/translate - 空のテキストでバリデーションエラー", func(t *testing.T) {
		requestBody := TranslationRequest{
			Text: "",
		}
		
		jsonData, _ := json.Marshal(requestBody)
		req, _ := http.NewRequest("POST", "/api/translate", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		router := setupRouter()
		router.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
	
	t.Run("POST /api/translate - 不正なJSONでエラー", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/translate", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		router := setupRouter()
		router.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestLanguageSelection は言語選択ロジックのテスト
func TestLanguageSelection(t *testing.T) {
	// テスト用の言語データを初期化
	languageData = LanguageData{
		Languages: []Language{
			{Code: "en", Name: "English", NativeName: "English", IsOfficial: true},
			{Code: "es", Name: "Spanish", NativeName: "Español", IsOfficial: true},
			{Code: "fr", Name: "French", NativeName: "Français", IsOfficial: true},
			{Code: "de", Name: "German", NativeName: "Deutsch", IsOfficial: true},
			{Code: "it", Name: "Italian", NativeName: "Italiano", IsOfficial: true},
		},
	}
	
	t.Run("ランダムな言語が選択される", func(t *testing.T) {
		// 複数回実行して異なる言語が選択されることを確認
		selectedLanguages := make(map[string]bool)
		
		for i := 0; i < 1000; i++ {
			lang := selectRandomLanguage()
			selectedLanguages[lang] = true
			// 十分な種類の言語が選択されたら早期終了
			if len(selectedLanguages) >= 3 {
				break
			}
		}
		
		// 複数の言語が選択されることを確認
		assert.True(t, len(selectedLanguages) >= 2, "複数の言語が選択されるべき、実際: %d", len(selectedLanguages))
	})
	
	t.Run("選択された言語が有効な言語コードである", func(t *testing.T) {
		lang := selectRandomLanguage()
		
		// 有効な言語コードのリスト（languages.jsonから取得）
		validLanguages := []string{"en", "es", "fr", "de", "it", "pt", "ru", "zh", "ar", "hi", "ko", "nl", "pl", "tr", "sv", "no", "da", "fi", "th", "vi", "id", "ms", "tl", "he", "fa", "ur", "bn", "sw", "am"}
		
		isValid := false
		for _, validLang := range validLanguages {
			if lang == validLang {
				isValid = true
				break
			}
		}
		
		assert.True(t, isValid, "選択された言語コードが有効でない: %s", lang)
	})
}
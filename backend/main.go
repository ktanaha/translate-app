package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TranslationRequest はリクエストボディの構造体
type TranslationRequest struct {
	Text string `json:"text" binding:"required"`
}

// TranslationResponse はレスポンスボディの構造体
type TranslationResponse struct {
	OriginalText     string `json:"original_text"`
	IntermediateText string `json:"intermediate_text"`
	IntermediateLanguage string `json:"intermediate_language"`
	FinalText        string `json:"final_text"`
}

// Language は言語情報の構造体
type Language struct {
	Code         string   `json:"code"`
	Name         string   `json:"name"`
	NativeName   string   `json:"nativeName"`
	Countries    []string `json:"countries"`
	IsOfficial   bool     `json:"isOfficial"`
}

// LanguageData は言語データの構造体
type LanguageData struct {
	Languages []Language `json:"languages"`
}

var languageData LanguageData
var translationService TranslationService
var appLogger *SimpleLogger

// selectRandomLanguage はランダムな言語を選択する
func selectRandomLanguage() string {
	if len(languageData.Languages) == 0 {
		return "en" // デフォルトは英語
	}
	
	randomIndex := rand.Intn(len(languageData.Languages))
	return languageData.Languages[randomIndex].Code
}

// handleTranslation は翻訳エンドポイントのハンドラー
func handleTranslation(c *gin.Context) {
	// 操作開始をログに記録
	tracker := appLogger.StartOperation("translation_request", map[string]interface{}{
		"client_ip": c.ClientIP(),
		"user_agent": c.GetHeader("User-Agent"),
	})
	
	var request TranslationRequest
	
	// リクエストボディをバインド
	if err := c.ShouldBindJSON(&request); err != nil {
		appLogger.ErrorOperation(tracker, err, "リクエストボディの解析に失敗")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	appLogger.Info("翻訳リクエスト受信",
		"original_text", request.Text,
		"text_length", len(request.Text))
	
	// ランダムな言語を選択
	intermediateLang := selectRandomLanguage()
	appLogger.Info("中間言語選択",
		"intermediate_language", intermediateLang)
	
	// 元のテキストを中間言語に翻訳
	intermediateText, err := translationService.Translate(request.Text, intermediateLang)
	if err != nil {
		appLogger.ErrorOperation(tracker, err, "中間言語への翻訳に失敗")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "翻訳エラー: " + err.Error()})
		return
	}
	
	appLogger.Info("中間言語翻訳完了",
		"intermediate_text", intermediateText,
		"target_language", intermediateLang)
	
	// 中間言語から日本語に翻訳
	finalText, err := translationService.Translate(intermediateText, "ja")
	if err != nil {
		appLogger.ErrorOperation(tracker, err, "日本語への翻訳に失敗")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "翻訳エラー: " + err.Error()})
		return
	}
	
	appLogger.Info("最終翻訳完了",
		"final_text", finalText)
	
	// レスポンスを作成
	response := TranslationResponse{
		OriginalText:     request.Text,
		IntermediateText: intermediateText,
		IntermediateLanguage: intermediateLang,
		FinalText:        finalText,
	}
	
	// 操作完了をログに記録
	appLogger.CompleteOperation(tracker, map[string]interface{}{
		"original_text": response.OriginalText,
		"intermediate_language": response.IntermediateLanguage,
		"final_text": response.FinalText,
	})
	
	c.JSON(http.StatusOK, response)
}

// setupRouter はルーターを設定する
func setupRouter() *gin.Engine {
	r := gin.Default()
	
	// CORSミドルウェア
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
	
	// エンドポイントの設定
	r.POST("/api/translate", handleTranslation)
	
	return r
}

// loadLanguageData は言語データを読み込む
func loadLanguageData() {
	data, err := ioutil.ReadFile("languages.json")
	if err != nil {
		log.Printf("言語データの読み込みエラー: %v", err)
		// デフォルトの言語データを設定
		languageData = LanguageData{
			Languages: []Language{
				{Code: "en", Name: "English", NativeName: "English", IsOfficial: true},
				{Code: "es", Name: "Spanish", NativeName: "Español", IsOfficial: true},
				{Code: "fr", Name: "French", NativeName: "Français", IsOfficial: true},
				{Code: "de", Name: "German", NativeName: "Deutsch", IsOfficial: true},
			},
		}
		return
	}
	
	err = json.Unmarshal(data, &languageData)
	if err != nil {
		log.Printf("言語データの解析エラー: %v", err)
	}
}

func main() {
	// ロガーを初期化
	appLogger = NewLogger(INFO)
	appLogger.Info("アプリケーション開始")
	
	// ランダムシードを初期化
	rand.Seed(time.Now().UnixNano())
	appLogger.Debug("ランダムシード初期化完了")
	
	// 言語データを読み込み
	loadLanguageData()
	appLogger.Info("言語データ読み込み完了", "language_count", len(languageData.Languages))
	
	// 翻訳サービスを初期化
	translationService = NewTranslationService()
	appLogger.Info("翻訳サービス初期化完了")
	
	// ルーターを設定
	r := setupRouter()
	appLogger.Info("ルーター設定完了")
	
	// サーバーを開始
	appLogger.Info("サーバー開始", "port", "8080")
	log.Println("サーバーを開始: http://localhost:8080")
	r.Run(":8080")
}
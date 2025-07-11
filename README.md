# 🌍 Translate App

ランダムな中間言語を経由して翻訳を行うWebアプリケーション

## 📋 概要

このアプリケーションは、入力されたテキストを一度ランダムに選択された言語に翻訳し、その後日本語に翻訳するという二段階翻訳システムです。Google Translate APIを使用して、より興味深い翻訳結果を得ることができます。

## 🏗️ アーキテクチャ

### フロントエンド
- **React** (TypeScript)
- **TailwindCSS** (スタイリング)
- **Jest + React Testing Library** (テスト)

### バックエンド
- **Go** (Gin フレームワーク)
- **Google Translate API** (翻訳サービス)
- **SQLite** (将来的な拡張用)

### 開発環境
- **Docker + Docker Compose** (コンテナ化)
- **vibe-coding-logger** (ロギング)

## 🚀 セットアップ

### 前提条件

- Docker & Docker Compose
- Node.js 16+ (ローカル開発時)
- Go 1.24+ (ローカル開発時)
- Google Cloud Platform アカウント (本番環境)

### 1. リポジトリのクローン

```bash
git clone https://github.com/ktanaha/translate-app.git
cd translate-app
```

### 2. 環境変数の設定

`.env`ファイルを作成し、必要な設定を追加：

```bash
# Google Translate API設定
GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here

# 開発環境設定
GO_ENV=development
VIBE_LOGGER_ENABLED=true
VIBE_LOGGER_LEVEL=debug
REACT_APP_API_URL=http://localhost:8080
REACT_APP_VIBE_LOGGER_ENABLED=true
```

### 3. Docker Composeでの起動

```bash
# 全体を起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### 4. 個別起動（開発時）

**バックエンド:**
```bash
cd backend
GO_ENV=development go run main.go translator.go logger_adapter.go
```

**フロントエンド:**
```bash
cd frontend
npm install
npm start
```

## 🖥️ 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. 翻訳したいテキストを入力
3. 「翻訳」ボタンをクリック
4. 結果を確認：
   - 元のテキスト
   - 中間言語での翻訳
   - 最終的な日本語翻訳

## 🧪 テスト

### フロントエンド テスト
```bash
cd frontend
npm test
```

### バックエンド テスト
```bash
cd backend
go test -v
```

## 🌟 機能

### 実装済み機能
- ✅ ランダム中間言語選択
- ✅ 二段階翻訳処理
- ✅ RESTful API
- ✅ リアルタイム翻訳
- ✅ ログ機能
- ✅ モックモード（開発時）

### 予定機能
- 🔄 翻訳履歴の保存
- 🔄 言語選択の手動指定
- 🔄 バッチ翻訳
- 🔄 翻訳結果のエクスポート

## 📁 プロジェクト構成

```
translate-app/
├── frontend/                  # React アプリケーション
│   ├── src/
│   │   ├── components/        # React コンポーネント
│   │   ├── services/          # API通信ロジック
│   │   └── types/             # TypeScript型定義
│   ├── public/
│   └── package.json
├── backend/                   # Go API サーバー
│   ├── main.go               # メインアプリケーション
│   ├── translator.go         # 翻訳サービス
│   ├── logger_adapter.go     # ロギング機能
│   └── languages.json        # 言語データ
├── docker-compose.yml        # Docker設定
├── .gitignore               # Git除外設定
└── README.md                # このファイル
```

## 🔧 API仕様

### POST /api/translate

翻訳を実行します。

**リクエスト:**
```json
{
  "text": "Hello, world!"
}
```

**レスポンス:**
```json
{
  "original_text": "Hello, world!",
  "intermediate_text": "Bonjour le monde!",
  "intermediate_language": "fr",
  "final_text": "こんにちは、世界！"
}
```

## 🔨 開発ガイド

### コード規約
- フロントエンド: ESLint + Prettier
- バックエンド: Go標準 + gofmt
- コミット: Conventional Commits

### ブランチ戦略
- `main`: 本番環境用
- `develop`: 開発統合用
- `feature/*`: 機能開発用

## 🤝 貢献

1. フォークする
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🙏 謝辞

- [Google Cloud Translate](https://cloud.google.com/translate/) - 翻訳API
- [vibe-coding-logger](https://github.com/ktanaha/vibe-coding-logger) - ロギングシステム
- [React](https://reactjs.org/) - フロントエンドフレームワーク
- [Gin](https://gin-gonic.com/) - Go Webフレームワーク

---

🤖 **開発支援**: [Claude Code](https://claude.ai/code) を使用して開発されました
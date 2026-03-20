# スケジュール調整アプリ - セットアップガイド

Spir代替の自社スケジュール調整ツールです。
月額0円（無料枠内）で運用可能です。

---

## 技術構成

| 項目 | サービス | 月額 |
|------|---------|------|
| フロントエンド + API | Vercel（無料枠） | ¥0 |
| データベース + 認証 | Supabase（無料枠） | ¥0 |
| カレンダー連携 | Google Calendar API | ¥0 |
| ドメイン（任意） | お好みのレジストラ | ¥1,000〜/年 |

---

## セットアップ手順

### 1. Supabase プロジェクト作成

1. https://supabase.com にアクセスしてアカウント作成
2. 「New Project」でプロジェクト作成
3. SQL Editor で `supabase/schema.sql` の内容を実行
4. Project Settings > API から以下を取得:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google Cloud Console 設定

1. https://console.cloud.google.com でプロジェクト作成
2. 「APIとサービス」→「ライブラリ」で **Google Calendar API** を有効化
3. 「認証情報」→「OAuth 2.0 クライアントID」を作成:
   - アプリケーション種類: ウェブアプリケーション
   - 承認済みリダイレクトURI: `https://your-domain.vercel.app/api/auth/google/callback`
4. クライアントID / シークレットを取得:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### 3. Vercel にデプロイ

```bash
# リポジトリをGitHubにプッシュ
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/schedule-app.git
git push -u origin main

# Vercel にデプロイ
npx vercel --prod
```

または https://vercel.com からGitHubリポジトリをインポート。

### 4. 環境変数の設定

Vercel の Settings > Environment Variables に以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### オプション:

```
# メール通知（Gmail）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Googleアプリパスワード

# Slack通知
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Zoom（Server-to-Server OAuth App）
ZOOM_CLIENT_ID=xxxx
ZOOM_CLIENT_SECRET=xxxx
ZOOM_ACCOUNT_ID=xxxx
```

### 5. ローカル開発

```bash
cd spir-clone
cp .env.example .env.local
# .env.local に環境変数を設定

npm install
npm run dev
# http://localhost:3000 で起動
```

---

## 使い方

### 空き時間共有リンク（Spirの主要機能）

1. `/dashboard` にログイン
2. 「新規作成」から共有リンクを作成
3. 曜日・時間帯・打合せ時間（30分/45分等）を設定
4. 生成されたURLをクライアントに共有
5. クライアントがカレンダーから空き時間を選んで予約
6. Googleカレンダーに自動登録 + メール/Slack通知

### 候補日提案（確認型）

1. 「候補提案」→「候補提案を作成」
2. 「確認型」を選択し、候補日時を複数追加
3. 生成されたURLを相手に送付
4. 相手が1つ選んで確定 → 自動でカレンダー登録

### 候補日提案（投票型）

1. 「候補提案」→「候補提案を作成」
2. 「投票型」を選択し、候補日時を追加
3. URLを参加者全員に共有
4. 全員が○△×で投票
5. 主催者が結果を見て日程を確定

---

## 殿の既存Spirリンクとの対応

| 用途 | 旧Spirリンク | 新スラッグ例 |
|------|-------------|-------------|
| 法人30分打合せ | spirinc.com/...3pJ5wR3oTtO... | `/booking/meeting-30min` |
| 法人45分打合せ | spirinc.com/...sD8I8C9fOjR... | `/booking/meeting-45min` |
| 法人一般 | spirinc.com/...S7KijlPuRR7... | `/booking/corporate` |

---

## Gmailアプリパスワードの取得方法

1. Googleアカウント → セキュリティ → 2段階認証プロセスを有効化
2. 「アプリパスワード」を生成
3. 生成された16桁のパスワードを `SMTP_PASS` に設定

---

## Slack Webhook URLの取得方法

1. https://api.slack.com/apps → 「Create New App」
2. 「Incoming Webhooks」を有効化
3. 通知先チャンネルを選択してWebhook URLを取得

# 部署

- **後端** → GCP Cloud Run（`asia-east1` 台灣）
- **前端** → Cloudflare Pages
- **資料庫** → Supabase（已是雲端，不需部署）

---

## A. 後端：Cloud Run

### A0. 前置作業（第一次才需要）

1. **安裝 gcloud CLI**：<https://cloud.google.com/sdk/docs/install>，然後：
   ```bash
   gcloud auth login
   ```

2. **建立 / 選擇 GCP 專案**，並確認已綁定**帳單帳戶**（Cloud Run 有免費額度，但仍需綁定帳單帳戶）。

3. **設定本次要用的變數**（把 `PROJECT_ID` 換成你的）：
   ```bash
   export PROJECT_ID=your-gcp-project-id
   export REGION=asia-east1
   export SERVICE=ridehub-api
   gcloud config set project "$PROJECT_ID"
   ```

4. **啟用需要的 API**：
   ```bash
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com
   ```

### A1. 建立 Secrets（機密資料）

`JWT_SECRET` 與 `SUPABASE_SERVICE_KEY` 屬機密，放 Secret Manager。
值直接從你本機的 `backend/.env` 複製（**不要**寫進任何 git 檔案）：

```bash
# 從 backend/.env 讀出對應的值來建立（在 backend/ 目錄下執行）
cd backend

grep '^JWT_SECRET=' .env | cut -d= -f2- | tr -d '\r\n' \
  | gcloud secrets create JWT_SECRET --data-file=-

grep '^SUPABASE_SERVICE_KEY=' .env | cut -d= -f2- | tr -d '\r\n' \
  | gcloud secrets create SUPABASE_SERVICE_KEY --data-file=-
```

> 之後要更新某個 secret 的值：
> ```bash
> printf '%s' "新的值" | gcloud secrets versions add JWT_SECRET --data-file=-
> ```

**授權 Cloud Run 執行身分讀取 secrets**：

```bash
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
export RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for S in JWT_SECRET SUPABASE_SERVICE_KEY; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### A2. 部署

在 `backend/` 目錄下執行（Cloud Build 會依 `Dockerfile` 建置）：

```bash
cd backend

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,SUPABASE_URL=https://pvdtpcgdtfoudqhhqwsr.supabase.co,SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZHRwY2dkdGZvdWRxaGhxd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjI2NTQsImV4cCI6MjEwMzM5ODY1NH0.bCCHojc5KWYdcb5gqNTpqVc3AdsTss-uO90CdsSxlqQ,CORS_ORIGINS=http://localhost:5173" \
  --set-secrets "JWT_SECRET=JWT_SECRET:latest,SUPABASE_SERVICE_KEY=SUPABASE_SERVICE_KEY:latest"
```

- 第一次會問是否建立 Artifact Registry repo `cloud-run-source-deploy` → 選 **Y**。
- `CORS_ORIGINS` 先填 localhost，等前端上線後（步驟 B）再更新成 Pages 網域。
- `SUPABASE_ANON_KEY` / `SUPABASE_URL` 非機密，用一般環境變數即可。

### A3. 部署後檢查

```bash
export API_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
echo "$API_URL"

curl -s "$API_URL/api/v1/health"        # → {"ok":true,...}
curl -s "$API_URL/api/v1/health/db"     # → {"ok":true,"db":"connected"}
```

記下 `$API_URL`，前端會用到（形如 `https://ridehub-api-xxxxx.asia-east1.run.app`）。

### A4. 之後更新後端

改完程式碼後，重跑一次 A2 的 `gcloud run deploy --source .` 即可。
環境變數與 secrets 會沿用，除非在指令中再次指定。

只想改環境變數（不重新建置）：
```bash
gcloud run services update "$SERVICE" --region "$REGION" \
  --update-env-vars "CORS_ORIGINS=https://你的-pages-網域"
```

### A5.（選用）加 LINE / SMS 金鑰

拿到 LINE / Twilio 金鑰後：
```bash
printf '%s' "LINE Channel Access Token" | gcloud secrets create LINE_CHANNEL_ACCESS_TOKEN --data-file=-
printf '%s' "LINE Channel Secret"       | gcloud secrets create LINE_CHANNEL_SECRET --data-file=-
# 記得跑 A1 的 add-iam-policy-binding 授權這兩個新 secret

gcloud run services update "$SERVICE" --region "$REGION" \
  --update-secrets "LINE_CHANNEL_ACCESS_TOKEN=LINE_CHANNEL_ACCESS_TOKEN:latest,LINE_CHANNEL_SECRET=LINE_CHANNEL_SECRET:latest"
```

---

## B. 前端：Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → 選 `icguanyu/ridehub`
2. 建置設定：
   | 欄位 | 值 |
   |------|-----|
   | Framework preset | None（或 Vite）|
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `frontend` |
3. **Environment variables**（Production 與 Preview 各設一次）：
   ```
   VITE_API_BASE_URL = https://ridehub-api-xxxxx.asia-east1.run.app/api/v1
   ```
   （用步驟 A3 的 `$API_URL` 加上 `/api/v1`）
4. **Save and Deploy**，完成後會得到 `https://ridehub-xxx.pages.dev`
5. `public/_redirects` 已內含 SPA fallback，深層連結不會 404。

### B1. 回頭更新後端 CORS

```bash
gcloud run services update ridehub-api --region asia-east1 \
  --update-env-vars "CORS_ORIGINS=https://ridehub-xxx.pages.dev"
```

多個來源用逗號分隔，例如同時保留自訂網域：
`CORS_ORIGINS=https://ridehub-xxx.pages.dev,https://app.yourdomain.com`

---

## C. 端到端驗收

1. 開 `https://ridehub-xxx.pages.dev/signup` 註冊一個司機
2. 設定服務資訊、營運時間，複製專屬連結
3. 用無痕視窗開該連結 → 送出一筆預約
4. 回司機後台 → 接受 → 客人狀態頁重新整理應顯示「已接受」+ 司機電話

---

## 備註

- **冷啟動**：`--min-instances 0` 時，閒置後首次請求約 1–3 秒。要消除可設 `--min-instances 1`（會有小額固定費用）。
- **地區延遲**：Supabase 在東京 / 新加坡，Cloud Run `asia-east1`（台灣）到東京約 30–40ms，MVP 完全夠用。
- **本機用 Docker 測試**（選用，需先裝 Docker Desktop）：
  ```bash
  cd backend
  docker build -t ridehub-api .
  # 用 8080（映像預設值），避開 .env 內的 PORT 設定
  docker run --rm -e PORT=8080 -p 8080:8080 --env-file .env ridehub-api
  curl localhost:8080/api/v1/health
  ```
  Cloud Run 上會自行注入 `PORT=8080`，不受 `.env` 影響（`.env` 也不會被打包進映像）。

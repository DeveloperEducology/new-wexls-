#!/bin/bash
# ============================================================
#  KlassChamp — Deploy to Google Cloud Run
#  Domain: klasschamp.com
#  Run: bash deploy.sh
# ============================================================

set -e  # Stop on any error

PROJECT_ID="gen-lang-client-0970841409"
SERVICE_NAME="klasschamp"
REGION="asia-southeast1"   # Singapore — supports domain mappings
DOMAIN="klasschamp.com"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   KlassChamp → Google Cloud Run Deploy   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Check gcloud is installed ─────────────────────
if ! command -v gcloud &> /dev/null; then
  echo "❌ gcloud CLI not found."
  echo "   Install it: brew install --cask google-cloud-sdk"
  exit 1
fi
echo "✅ gcloud found: $(gcloud --version | head -1)"

# ── Step 2: Set project ────────────────────────────────────
echo ""
echo "🔧 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# ── Step 3: Enable required APIs ──────────────────────────
echo ""
echo "🔧 Enabling Cloud Run + Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com --quiet

# ── Step 4: Build & Push Docker image ─────────────────────
echo ""
echo "🐳 Building Docker image and pushing to Google Container Registry..."
gcloud builds submit \
  --tag $IMAGE \
  --timeout=20m \
  .

# ── Step 5: Deploy to Cloud Run ───────────────────────────
echo ""
echo "🚀 Deploying to Cloud Run (region: $REGION)..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 3000 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "MONGODB_URI=mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority" \
  --set-env-vars "MONGODB_DB=new-wexls" \
  --set-env-vars "MONGODB_QUESTIONS_COLLECTION=questions" \
  --set-env-vars "VITE_R2_ACCOUNT_ID=b6d7aa4846a017f6f1e161b31ec109cb" \
  --set-env-vars "VITE_R2_ACCESS_KEY_ID=7eb38d5fad32797e819b57cb0f7f2cb9" \
  --set-env-vars "VITE_R2_SECRET_ACCESS_KEY=2c18e943c1fc396721353b4cd71bc517fb292885b230bc1697ecd9d0741a89d0" \
  --set-env-vars "VITE_R2_BUCKET_NAME=images" \
  --set-env-vars "VITE_R2_PUBLIC_URL=https://pub-6d655d3564544704a2d99beb0760355e.r2.dev" \
  --set-env-vars "TTS_PROVIDER=gemini" \
  --set-env-vars "GOOGLE_GENAI_USE_ENTERPRISE=true" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0970841409" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=us-central1" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://klasschamp.com"

# ── Step 6: Get service URL ────────────────────────────────
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format='value(status.url)')

echo ""
echo "✅ Deployed successfully!"
echo "   Cloud Run URL: $SERVICE_URL"

# ── Step 7: Map custom domain ─────────────────────────────
echo ""
echo "🌐 Mapping domain: $DOMAIN"
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain $DOMAIN \
  --region $REGION 2>/dev/null || echo "   (Domain mapping may already exist)"

echo ""
echo "📋 DNS records for GoDaddy (add these):"
gcloud run domain-mappings describe \
  --domain $DOMAIN \
  --region $REGION \
  --format='value(status.resourceRecords)' 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🎉 DONE! Your app is live.                              ║"
echo "║                                                          ║"
echo "║  Cloud URL : $SERVICE_URL"
echo "║  Domain    : https://klasschamp.com (after DNS update)   ║"
echo "║                                                          ║"
echo "║  Next: Add the DNS records above to GoDaddy              ║"
echo "╚══════════════════════════════════════════════════════════╝"

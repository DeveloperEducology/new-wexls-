#!/bin/bash
# ============================================================
#  KlassChamp — Quick Redeploy (for updates)
#  Run: bash redeploy.sh
# ============================================================

set -e

PROJECT_ID="gen-lang-client-0970841409"
SERVICE_NAME="klasschamp"
REGION="asia-southeast1"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🔄 Rebuilding and redeploying KlassChamp..."
echo ""

gcloud config set project $PROJECT_ID

echo "🐳 Building new image..."
gcloud builds submit --tag $IMAGE --timeout=20m .

echo ""
echo "🚀 Updating Cloud Run service..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed

echo ""
echo "✅ Redeployed! Live at: https://klasschamp.com"

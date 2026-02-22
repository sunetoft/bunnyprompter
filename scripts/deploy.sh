#!/bin/bash

# Configuration for BunnyPrompter
PROJECT_ID="klart-353511"
REGION="us-central1"
SERVICE_NAME="bunnyprompter"
SQL_INSTANCE="klart-353511:us-central1:bunnyprompter-db"
STORAGE_BUCKET="bunnyprompter-analysis"
ACCESS_CODE="123456"

ROLLOUT=false
for arg in "$@"; do
  if [ "$arg" == "--rollout" ]; then
    ROLLOUT=true
  fi
done

echo "🚀 Deploying $SERVICE_NAME to project $PROJECT_ID ($REGION)..."

# Cloud Build + Deploy Script
echo "🚀 Building container with Cache (Cloud Build)..."
gcloud builds submit --config cloudbuild.yaml . --project "$PROJECT_ID" || exit 1

echo "🚀 Deploying $SERVICE_NAME to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/bunnyprompter:latest" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$SQL_INSTANCE" \
  --add-volume "name=analysis-storage,type=cloud-storage,bucket=$STORAGE_BUCKET" \
  --add-volume-mount "volume=analysis-storage,mount-path=/app/st-analysis" \
  --execution-environment gen2 \
  --set-env-vars "INSTANCE_CONNECTION_NAME=$SQL_INSTANCE,DB_NAME=bunnyprompter,DB_USER=prompter_user,DB_PASS=prompter_pass,ACCESS_CODE=$ACCESS_CODE" \
  --quiet

echo "✅ Deployment complete!"

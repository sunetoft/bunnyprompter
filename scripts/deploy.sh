#!/bin/bash

# Configuration for BunnyPrompter
PROJECT_ID="klart-353511"
REGION="us-central1"
SERVICE_NAME="coderick-ai"
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

if [ "$ROLLOUT" = true ]; then
  echo "📦 Mode: Gradual Rollout (10% initial traffic)"
  # Deploy without traffic
  gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --no-traffic \
    --allow-unauthenticated \
    --add-cloudsql-instances "$SQL_INSTANCE" \
    --add-volume "name=analysis-storage,type=cloud-storage,bucket=$STORAGE_BUCKET" \
    --add-volume-mount "volume=analysis-storage,mount-path=/app/st-analysis" \
    --execution-environment gen2 \
    --set-env-vars "INSTANCE_CONNECTION_NAME=$SQL_INSTANCE,DB_NAME=bunnyprompter,DB_USER=prompter_user,DB_PASS=prompter_pass,ACCESS_CODE=$ACCESS_CODE"

  echo "🚦 Shifting 10% traffic to the new revision..."
  gcloud run services update-traffic "$SERVICE_NAME" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --to-revisions=LATEST=10

  echo "✅ Rollout initiated. 10% on LATEST, 90% on previous revisions."
  echo "💡 To increase traffic, run: gcloud run services update-traffic $SERVICE_NAME --to-latest --project $PROJECT_ID --region $REGION"
else
  # Normal deploy (100% traffic)
  gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --allow-unauthenticated \
    --add-cloudsql-instances "$SQL_INSTANCE" \
    --add-volume "name=analysis-storage,type=cloud-storage,bucket=$STORAGE_BUCKET" \
    --add-volume-mount "volume=analysis-storage,mount-path=/app/st-analysis" \
    --execution-environment gen2 \
    --set-env-vars "INSTANCE_CONNECTION_NAME=$SQL_INSTANCE,DB_NAME=bunnyprompter,DB_USER=prompter_user,DB_PASS=prompter_pass,ACCESS_CODE=$ACCESS_CODE" \
    --quiet
  
  echo "✅ Deployment complete for $SERVICE_NAME (100% traffic)"
fi

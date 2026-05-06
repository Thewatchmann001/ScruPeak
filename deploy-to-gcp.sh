#!/bin/bash

# ScruPeak GCP Deployment Script
# Deploys fixed API Gateway and Web Frontend to Cloud Run

set -e

PROJECT_ID=${1:-"scrupeak01"}
REGION="us-central1"
# Cloud Run will generate URLs like: service-projectid.region.run.app
API_DOMAIN="api-gateway-$PROJECT_ID.run.app"
WEB_DOMAIN="web-frontend-$PROJECT_ID.run.app"

echo "🚀 Deploying ScruPeak to GCP..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Configure gcloud
gcloud config set project $PROJECT_ID
gcloud auth configure-docker

# Build and push API Gateway
echo "📦 Building API Gateway..."
cd apps/api-gateway
docker build -t gcr.io/$PROJECT_ID/api-gateway:latest .
docker push gcr.io/$PROJECT_ID/api-gateway:latest

echo "🚀 Deploying API Gateway to Cloud Run..."
gcloud run deploy api-gateway \
  --image gcr.io/$PROJECT_ID/api-gateway:latest \
  --region $REGION \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --set-env-vars="ALLOWED_ORIGINS=https://$WEB_DOMAIN,http://localhost:3000,http://localhost:5173" \
  --allow-unauthenticated \
  --update-env-vars="CORE_SERVICE_URL=https://backend-$PROJECT_ID.run.app,SPATIAL_SERVICE_URL=https://spatial-service-$PROJECT_ID.run.app,AI_SERVICE_URL=https://ai-service-$PROJECT_ID.run.app"

cd ../..

# Build and push Web Frontend
echo ""
echo "📦 Building Web Frontend..."
cd apps/web
docker build -t gcr.io/$PROJECT_ID/web-frontend:latest .
docker push gcr.io/$PROJECT_ID/web-frontend:latest

echo "🚀 Deploying Web Frontend to Cloud Run..."
gcloud run deploy web-frontend \
  --image gcr.io/$PROJECT_ID/web-frontend:latest \
  --region $REGION \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60 \
  --set-env-vars="VITE_API_URL=https://$API_DOMAIN,VITE_PRIVY_APP_ID=cmmxpr19800000cl51l48f0yv" \
  --allow-unauthenticated

cd ../..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your app:"
echo "   Frontend: https://$WEB_DOMAIN"
echo "   API: https://$API_DOMAIN/health"
echo ""
echo "📋 Next steps:"
echo "   1. Add the following domains to Privy dashboard:"
echo "      - https://$WEB_DOMAIN"
echo "   2. Test the API: curl https://$API_DOMAIN/health"
echo "   3. Monitor logs: gcloud run logs read api-gateway --limit 50"
echo ""


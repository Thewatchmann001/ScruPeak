# ScruPeak GCP Deployment Script (PowerShell)
# Deploys fixed API Gateway and Web Frontend to Cloud Run

param(
    [string]$ProjectId = "scrupeak01",
    [string]$Region = "us-central1"
)

# Cloud Run will generate URLs like: service-projectid.region.run.app
$ApiDomain = "api-gateway-$ProjectId.run.app"
$WebDomain = "web-frontend-$ProjectId.run.app"

Write-Host "🚀 Deploying ScruPeak to GCP..." -ForegroundColor Green
Write-Host "Project: $ProjectId"
Write-Host "Region: $Region"
Write-Host ""

# Configure gcloud
Write-Host "⚙️  Configuring gcloud..." -ForegroundColor Cyan
gcloud config set project $ProjectId
gcloud auth configure-docker

# Build and push API Gateway
Write-Host ""
Write-Host "📦 Building API Gateway..." -ForegroundColor Cyan
Set-Location "apps/api-gateway"
docker build -t "gcr.io/$ProjectId/api-gateway:latest" .
docker push "gcr.io/$ProjectId/api-gateway:latest"

Write-Host "🚀 Deploying API Gateway to Cloud Run..." -ForegroundColor Green
gcloud run deploy api-gateway `
  --image "gcr.io/$ProjectId/api-gateway:latest" `
  --region $Region `
  --memory 512Mi `
  --cpu 1 `
  --timeout 60 `
  --set-env-vars="ALLOWED_ORIGINS=https://$WebDomain,http://localhost:3000,http://localhost:5173" `
  --allow-unauthenticated `
  --update-env-vars="CORE_SERVICE_URL=https://backend-$ProjectId.run.app,SPATIAL_SERVICE_URL=https://spatial-service-$ProjectId.run.app,AI_SERVICE_URL=https://ai-service-$ProjectId.run.app"

Set-Location "../.."

# Build and push Web Frontend
Write-Host ""
Write-Host "📦 Building Web Frontend..." -ForegroundColor Cyan
Set-Location "apps/web"
docker build -t "gcr.io/$ProjectId/web-frontend:latest" .
docker push "gcr.io/$ProjectId/web-frontend:latest"

Write-Host "🚀 Deploying Web Frontend to Cloud Run..." -ForegroundColor Green
gcloud run deploy web-frontend `
  --image "gcr.io/$ProjectId/web-frontend:latest" `
  --region $Region `
  --memory 256Mi `
  --cpu 1 `
  --timeout 60 `
  --set-env-vars="VITE_API_URL=https://$ApiDomain,VITE_PRIVY_APP_ID=cmmxpr19800000cl51l48f0yv" `
  --allow-unauthenticated

Set-Location "../.."

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your app:" -ForegroundColor Cyan
Write-Host "   Frontend: https://$WebDomain"
Write-Host "   API: https://$ApiDomain/health"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Add the following domains to Privy dashboard:"
Write-Host "      - https://$WebDomain"
Write-Host "   2. Test the API: curl https://$ApiDomain/health"
Write-Host "   3. Monitor logs: gcloud run logs read api-gateway --limit 50"
Write-Host ""


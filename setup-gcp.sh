#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ScruPeak — GCP Infrastructure Setup
# Run this ONCE in Cloud Shell before your first deployment.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ID="scrupeak01"
PROJECT_NUMBER="1090857402667"
REGION="us-central1"
REGISTRY_REPO="scrupeak-services"
SERVICE_ACCOUNT="scrupeak001"
SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_ID="github-pool"
PROVIDER_ID="github-provider"
GITHUB_ORG="Thewatchmann001"
GITHUB_REPO="ScruPeak"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()    { echo -e "${GREEN}▸ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

info "Setting active project to ${PROJECT_ID}"
gcloud config set project "$PROJECT_ID"

info "Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID"
echo "✅ APIs enabled"

info "Creating Artifact Registry repository: ${REGISTRY_REPO}"
gcloud artifacts repositories create "$REGISTRY_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="ScruPeak microservice images" \
  --project="$PROJECT_ID" \
  2>/dev/null && echo "✅ Artifact Registry repo created" \
  || echo "ℹ️  Repo already exists — skipping"

info "Creating service account: ${SA_EMAIL}"
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
  --display-name="ScruPeak GitHub Actions deployer" \
  --project="$PROJECT_ID" \
  2>/dev/null && echo "✅ Service account created" \
  || echo "ℹ️  Service account already exists — skipping"

info "Granting IAM roles to ${SA_EMAIL}..."
ROLES=(
  "roles/run.admin"
  "roles/artifactregistry.writer"
  "roles/secretmanager.secretAccessor"
  "roles/iam.serviceAccountTokenCreator"
  "roles/iam.serviceAccountUser"
)
for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet
  echo "  ✅ ${ROLE}"
done

info "Creating Workload Identity Pool: ${POOL_ID}"
gcloud iam workload-identity-pools create "$POOL_ID" \
  --location="global" \
  --display-name="GitHub Actions pool" \
  --description="Allows GitHub Actions to authenticate to GCP without keys" \
  --project="$PROJECT_ID" \
  2>/dev/null && echo "✅ Pool created" \
  || echo "ℹ️  Pool already exists — skipping"

info "Creating Workload Identity Provider: ${PROVIDER_ID}"
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_ID" \
  --display-name="GitHub provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="attribute.repository == '${GITHUB_ORG}/${GITHUB_REPO}'" \
  --project="$PROJECT_ID" \
  2>/dev/null && echo "✅ Provider created" \
  || echo "ℹ️  Provider already exists — skipping"

info "Binding service account to Workload Identity Pool..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}" \
  --project="$PROJECT_ID" \
  --quiet
echo "✅ Binding created"

info "Creating Secret Manager secrets..."
SECRETS=(
  "DATABASE_URL_DEV"
  "DATABASE_URL_STAGING"
  "DATABASE_URL_PROD"
  "JWT_SECRET"
  "MISTRAL_API_KEY"
  "PRIVY_APP_ID"
  "PRIVY_APP_SECRET"
  "CORE_SERVICE_URL"
  "SPATIAL_SERVICE_URL"
  "AI_SERVICE_URL"
)
for SECRET in "${SECRETS[@]}"; do
  gcloud secrets create "$SECRET" \
    --replication-policy="automatic" \
    --project="$PROJECT_ID" \
    2>/dev/null && echo "  ✅ Created: ${SECRET}" \
    || echo "  ℹ️  Already exists: ${SECRET}"
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅  GCP infrastructure setup complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
warning "NEXT — fill in your secret values:"
echo ""
echo "  echo -n 'YOUR_DB_URL'        | gcloud secrets versions add DATABASE_URL_DEV     --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_DB_URL'        | gcloud secrets versions add DATABASE_URL_STAGING  --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_DB_URL'        | gcloud secrets versions add DATABASE_URL_PROD     --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_JWT_SECRET'    | gcloud secrets versions add JWT_SECRET            --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_MISTRAL_KEY'   | gcloud secrets versions add MISTRAL_API_KEY       --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_PRIVY_APP_ID'  | gcloud secrets versions add PRIVY_APP_ID          --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'YOUR_PRIVY_SECRET'  | gcloud secrets versions add PRIVY_APP_SECRET      --data-file=- --project=${PROJECT_ID}"
echo ""
warning "AFTER first deploy — fill in inter-service URLs:"
echo ""
echo "  echo -n 'https://backend-HASH-uc.a.run.app'         | gcloud secrets versions add CORE_SERVICE_URL    --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'https://spatial-service-HASH-uc.a.run.app' | gcloud secrets versions add SPATIAL_SERVICE_URL --data-file=- --project=${PROJECT_ID}"
echo "  echo -n 'https://ai-service-HASH-uc.a.run.app'      | gcloud secrets versions add AI_SERVICE_URL      --data-file=- --project=${PROJECT_ID}"
echo ""

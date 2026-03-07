# ☁️ ScruPeak Cloud Deployment Guide (AWS & GCP)

This guide provides step-by-step instructions for deploying the **ScruPeak Digital Property** platform to AWS (EKS) and Google Cloud (GKE).

---

## 🛠️ Prerequisites

1.  **Docker & Kubernetes**: Ensure `docker` and `kubectl` are installed.
2.  **Cloud CLI**:
    *   AWS: `aws-cli` configured with appropriate IAM permissions.
    *   GCP: `gcloud` CLI configured with project and region.
3.  **Secrets**: Have your OpenAI API key and production DB credentials ready.

---

## 🐳 Step 1: Containerize & Push

For each service (`apps/backend`, `apps/web`, `apps/spatial-service`, `apps/ai-service`):

```bash
# Build
docker build -t <registry-url>/scrupeak-<service>:v1 .

# Push (AWS ECR or GCP GCR/AR)
docker push <registry-url>/scrupeak-<service>:v1
```

---

## 📦 Step 2: Infrastructure Setup

### AWS (EKS)
1.  **Create Cluster**: `eksctl create cluster --name scrupeak-prod --region us-east-1`
2.  **RDS (PostGIS)**: Create an Amazon RDS PostgreSQL instance (version 15+) and enable the `postgis` extension.
3.  **ElastiCache**: Create a Redis cluster for caching and Celery tasks.

### Google Cloud (GKE)
1.  **Create Cluster**: `gcloud container clusters create scrupeak-prod --region us-central1`
2.  **Cloud SQL**: Create a PostgreSQL instance and enable PostGIS.
3.  **Memorystore**: Create a Redis instance for caching.

---

## 🔑 Step 3: Kubernetes Secrets

Create the production secrets in your cluster:

```bash
kubectl create secret generic scrupeak-secrets \
  --from-literal=database-url="postgresql+asyncpg://user:pass@db-host:5432/dbname" \
  --from-literal=redis-url="redis://redis-host:6379/0" \
  --from-literal=openai-api-key="proj_..." \
  --from-literal=secret-key="$(openssl rand -hex 32)"
```

---

## 🚀 Step 4: Deploy Manifests

Apply the base configurations from the `/deployment/k8s/base` directory:

```bash
kubectl apply -f deployment/k8s/base/backend.yaml
kubectl apply -f deployment/k8s/base/spatial.yaml
kubectl apply -f deployment/k8s/base/web.yaml
```

---

## 🌐 Step 5: Networking & SSL

### AWS
*   Use the **AWS Load Balancer Controller** to provision an ALB.
*   Attach an **ACM Certificate** for HTTPS.

### GCP
*   Use a **GKE Ingress** with **Google-managed Certificates**.

---

## 📊 Step 6: Monitoring

*   **AWS**: CloudWatch Container Insights.
*   **GCP**: Cloud Operations (Stackdriver).

---

**Version**: 1.1 (ScruPeak Branding)
**Status**: Ready for Production Deployment

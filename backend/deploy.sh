#!/bin/bash

# Frontline Citizen Service Assistant - Deployment Script

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${GOOGLE_CLOUD_LOCATION:-"us-central1"}
SERVICE_NAME="frontline-adk"
BUCKET_NAME="frontline-artifacts"

echo "🚀 Deploying Frontline Citizen Service Assistant"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    firestore.googleapis.com \
    storage.googleapis.com \
    aiplatform.googleapis.com

# Create Firestore database if it doesn't exist
echo "🗄️ Setting up Firestore..."
gcloud firestore databases create --region=$REGION --quiet || echo "Firestore database already exists"

# Create GCS bucket if it doesn't exist
echo "🪣 Setting up Cloud Storage..."
gsutil mb gs://$BUCKET_NAME || echo "Bucket already exists"

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying..."
gcloud builds submit --config infra/cloudbuild.yaml

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 Health check: $SERVICE_URL/health"
echo "📚 API docs: $SERVICE_URL/docs"

# Test the deployment
echo "🧪 Testing deployment..."
curl -s "$SERVICE_URL/health" | jq . || echo "Health check failed - service may still be starting"

echo "🎉 Frontline Citizen Service Assistant is ready!"


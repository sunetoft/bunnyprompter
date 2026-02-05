# Deployment Guide for BunnyPrompter

This application is designed to be deployed on **Google Cloud Run**. Below are the steps to deploy it.

## Prerequisites
1.  **Google Cloud Platform (GCP) Project**: Ensure you have a project created.
2.  **gcloud CLI**: Installed and authenticated (`gcloud auth login`).
3.  **Docker**: (Optional) If you want to build locally, but Cloud Build is recommended.

## Option 1: Use the Deployment Script (Recommended)

A helper script is provided to deploy with the correct project, region, and environment settings.

1.  **Run the deploy script**:
    ```bash
    ./scripts/deploy.sh
    ```

## Option 2: Deploy from Source (Manual)

This method uses Google Cloud Build to build the container and deploy it to Cloud Run in one command.

1.  **Run the deploy command**:
    ```bash
    gcloud run deploy coderick-ai \
      --source . \
      --project klart-353511 \
      --region us-central1 \
      --allow-unauthenticated
    ```

2.  **Done!**:
    -   The service is mapped to **https://bunnyprompter.stdigital.dk**.

## Option 2: Manual Build & Push

1.  **Build the image**:
    ```bash
    docker build -t gcr.io/PROJECT_ID/coderick-ai .
    ```

2.  **Push to Container Registry**:
    ```bash
    docker push gcr.io/PROJECT_ID/coderick-ai
    ```

3.  **Deploy**:
    ```bash
    gcloud run deploy coderick-ai \
      --image gcr.io/PROJECT_ID/coderick-ai \
      --platform managed \
      --allow-unauthenticated
    ```

## Notes on Persistence
The application uses a hybrid approach for data storage:

### Database (Persistent & Shared)
The following data is stored in the connected SQL Database (Cloud SQL or SQLite locally) and is persistent/shared across sessions:
-   **Prompts**: All created prompts.
-   **Themes**: Created stock themes.
-   **Compare Prompts**: Prompts used in the comparison tool.
-   **Stock Cache**: Analyzed stock data (cached for performance).
-   **Categories**: Custom categories for prompts.
-   **Settings**: General settings including API Key (stored encrypted/protected by access controls if implemented, currently just in DB).

### Local Storage (Device Only)
The application is migrating away from local storage. Previously, keys and categories were stored here, but they are now automatically migrated to the database on first load.
-   **Legacy Fallbacks**: Local storage is checked for migration purposes but is no longer the primary source of truth.

*Note: Data is now fully persistent in the database.*

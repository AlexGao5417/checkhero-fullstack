# CheckHero Backend

## Setup

1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

2. Run the FastAPI app (dev):
   ```sh
   uvicorn app.main:app --reload
   ```

- The API will be available at http://localhost:8000
- Interactive docs: http://localhost:8000/docs

## Auth Endpoints
- POST /auth/register
- POST /auth/login

## PDF Report Endpoint
- POST /report
  - Accepts: JSON body with form data (see frontend output)
  - Returns: PDF file as response (Content-Type: application/pdf)
  - Example (curl):
    ```sh
    curl -X POST http://localhost:8000/report \
      -H "Content-Type: application/json" \
      -d '{"propertyAddress": "123 Main St", ...}' \
      --output report.pdf
    ```

## Database
- Uses SQLite (checkhero.db) for MVP 
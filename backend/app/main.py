from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.user_management import router as user_management_router
from app.reports import router as reports_router
import os
import tempfile
import uuid
import json
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.checkhero import generate_report

app = FastAPI(title="CheckHero Backend API")

# Allow CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(user_management_router, prefix="/users", tags=["users"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "CheckHero backend is running!"}

@app.post("/report")
async def generate_pdf_report(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})
    # Generate a unique filename for the PDF
    pdf_filename = f"report_{uuid.uuid4().hex}.pdf"
    temp_dir = tempfile.gettempdir()
    pdf_path = os.path.join(temp_dir, pdf_filename)
    try:
        generate_report(data, filename=pdf_path)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"PDF generation failed: {str(e)}"})
    # Return the PDF as a file response
    return FileResponse(pdf_path, media_type="application/pdf", filename="CheckHero_Report.pdf") 
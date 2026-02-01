"""
PaddleOCR Service for Meoluna
FastAPI-based OCR service for extracting text from PDFs
"""

import os
import base64
import io
import numpy as np
from typing import Optional
from PIL import Image

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from paddleocr import PaddleOCR
from pdf2image import convert_from_bytes

# Configuration
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "german")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB max

# Initialize FastAPI
app = FastAPI(
    title="PaddleOCR Service",
    description="OCR service for Meoluna learning platform",
    version="1.0.0"
)

# CORS middleware - allow Meoluna frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to Meoluna domains
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Initialize PaddleOCR with language support
# Models are downloaded on first use or during Docker build
ocr = PaddleOCR(
    use_angle_cls=True,
    lang=OCR_LANGUAGE,
    show_log=False,
    use_gpu=False  # Set to True if GPU available
)


class Base64Request(BaseModel):
    """Request model for base64-encoded PDF"""
    pdf: str
    language: Optional[str] = None


class OCRResponse(BaseModel):
    """Response model for OCR results"""
    success: bool
    pages: int
    markdown: str
    structured: list


def extract_text_from_image(image: Image.Image) -> list[str]:
    """Extract text from a single image using PaddleOCR"""
    # Convert PIL Image to numpy array
    img_array = np.array(image)

    # Run OCR
    result = ocr.ocr(img_array, cls=True)

    # Extract text lines
    lines = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) > 1:
                text = line[1][0]  # Get the text content
                confidence = line[1][1]  # Get confidence score
                if confidence > 0.5:  # Filter low-confidence results
                    lines.append(text)

    return lines


def process_pdf_content(content: bytes) -> OCRResponse:
    """Process PDF content and extract text from all pages"""
    try:
        # Convert PDF to images (200 DPI for good quality)
        images = convert_from_bytes(content, dpi=200)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process PDF: {str(e)}"
        )

    all_pages = []
    markdown_parts = []

    for page_num, image in enumerate(images, 1):
        # Extract text from this page
        lines = extract_text_from_image(image)
        page_text = "\n".join(lines)

        # Store structured data
        all_pages.append({
            "page": page_num,
            "text": page_text,
            "line_count": len(lines)
        })

        # Build markdown (AI-optimized format)
        markdown_parts.append(f"## Seite {page_num}\n\n{page_text}")

    # Combine all pages
    full_markdown = "\n\n---\n\n".join(markdown_parts)

    return OCRResponse(
        success=True,
        pages=len(images),
        markdown=full_markdown,
        structured=all_pages
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "paddleocr",
        "language": OCR_LANGUAGE
    }


@app.post("/extract-pdf", response_model=OCRResponse)
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract text from uploaded PDF file

    - **file**: PDF file to process (max 50MB)

    Returns extracted text in markdown format optimized for AI processing
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    return process_pdf_content(content)


@app.post("/extract-base64", response_model=OCRResponse)
async def extract_base64(request: Base64Request):
    """
    Extract text from base64-encoded PDF

    - **pdf**: Base64-encoded PDF content
    - **language**: Optional language override (default: german)

    Returns extracted text in markdown format optimized for AI processing
    """
    if not request.pdf:
        raise HTTPException(
            status_code=400,
            detail="Missing 'pdf' field with base64 content"
        )

    try:
        # Decode base64
        content = base64.b64decode(request.pdf)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 encoding: {str(e)}"
        )

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    return process_pdf_content(content)


@app.post("/extract-image", response_model=OCRResponse)
async def extract_image(file: UploadFile = File(...)):
    """
    Extract text from uploaded image file

    - **file**: Image file (PNG, JPG, etc.)

    Returns extracted text
    """
    # Read and validate
    content = await file.read()

    try:
        image = Image.open(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image file: {str(e)}"
        )

    lines = extract_text_from_image(image)
    text = "\n".join(lines)

    return OCRResponse(
        success=True,
        pages=1,
        markdown=text,
        structured=[{"page": 1, "text": text, "line_count": len(lines)}]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

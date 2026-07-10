"""
Document Extraction Service for Meoluna
FastAPI-based service: markitdown for digital documents (PDF text layer,
DOCX/PPTX/XLSX), PaddleOCR as fallback for scans and images.
"""

import os
import base64
import io
import numpy as np
from typing import Optional
from PIL import Image

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from paddleocr import PaddleOCR
from pdf2image import convert_from_bytes
from markitdown import MarkItDown, StreamInfo

# Configuration
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "german")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB max

# Unter dieser Zeichenzahl gilt ein PDF-Textlayer als leer (Scan) → OCR.
# Digitale Arbeitsblätter liegen deutlich darüber; Scans liefern ~0.
MIN_TEXT_LAYER_CHARS = 200

# Office-Formate, die /extract-document annimmt (markitdown-Extras müssen
# in requirements.txt dazu passen).
DOC_EXTENSIONS = {".docx", ".pptx", ".xlsx"}

# Server-zu-Server-API-Key. Wird vom Convex-Backend als X-API-Key-Header
# gesendet. Ohne gesetzten Key laeuft der Dienst offen (nur fuer lokale Tests).
API_KEY = os.getenv("PADDLEOCR_API_KEY")


def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    """Schuetzt teure OCR-Endpunkte vor unautorisierter Nutzung."""
    if API_KEY:
        if not x_api_key or x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return True


# Erlaubte Ursprünge (kein Wildcard). OCR-Aufrufe kommen server-zu-server
# vom Convex-Backend; Browser-Origins werden nur fuer lokale Tests benoetigt.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "https://meoluna.com,https://www.meoluna.com,http://localhost:5173",
    ).split(",")
    if o.strip()
]

# Initialize FastAPI
app = FastAPI(
    title="Document Extraction Service",
    description="Document/OCR service for Meoluna learning platform",
    version="1.1.0"
)

# CORS middleware - restrict to Meoluna domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Initialize PaddleOCR with language support
# Models are downloaded on first use or during Docker build
ocr = PaddleOCR(
    use_angle_cls=True,
    lang=OCR_LANGUAGE,
    show_log=False,
    use_gpu=False
)

# markitdown-Konverter für digitale Dokumente (kein LLM, keine Plugins)
md_converter = MarkItDown(enable_plugins=False)


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
    # "text-layer" (digitales PDF), "ocr" (Scan) oder "markitdown" (Office).
    # Optional, damit bestehende Clients unverändert weiterlaufen.
    method: Optional[str] = None


def extract_text_from_image(image: Image.Image) -> list[str]:
    """Extract text from a single image using PaddleOCR"""
    try:
        # Convert PIL Image to numpy array (ensure RGB)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        img_array = np.array(image)

        # Run OCR with angle classification
        result = ocr.ocr(img_array, cls=True)

        # Extract text lines
        lines = []
        if result is None or not result[0]:
            return lines

        for line in result[0]:
            if line and len(line) > 1:
                text = line[1][0]  # Get the text content
                confidence = line[1][1]  # Get confidence score
                if confidence > 0.5:  # Filter low-confidence results
                    lines.append(text)

        return lines
    except Exception as e:
        print(f"OCR error: {str(e)}")
        return []


def extract_pdf_text_layer(content: bytes) -> Optional[str]:
    """Try extracting the embedded text layer of a digital PDF via markitdown.

    Returns None when the PDF has no usable text layer (scan) so the caller
    falls back to OCR."""
    try:
        result = md_converter.convert_stream(
            io.BytesIO(content), stream_info=StreamInfo(extension=".pdf")
        )
        text = (result.text_content or "").strip()
    except Exception as e:
        print(f"markitdown PDF error: {str(e)}")
        return None

    if len(text) < MIN_TEXT_LAYER_CHARS:
        return None
    return text


def count_pdf_pages(content: bytes) -> int:
    """Cheap page count without rendering (pdfplumber ships with markitdown[pdf])."""
    try:
        import pdfplumber

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return len(pdf.pages)
    except Exception:
        return 1


def process_pdf_content(content: bytes) -> OCRResponse:
    """Process PDF content: digital text layer first, OCR fallback for scans"""
    text_layer = extract_pdf_text_layer(content)
    if text_layer is not None:
        pages = count_pdf_pages(content)
        return OCRResponse(
            success=True,
            pages=pages,
            markdown=text_layer,
            structured=[{
                "page": 1,
                "text": text_layer,
                "line_count": text_layer.count("\n") + 1,
            }],
            method="text-layer",
        )

    try:
        # Convert PDF to images (200 DPI for good quality)
        images = convert_from_bytes(content, dpi=200)
    except Exception as e:
        print(f"PDF conversion error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process PDF: {str(e)}"
        )

    if not images:
        raise HTTPException(
            status_code=400,
            detail="No pages found in PDF"
        )

    all_pages = []
    markdown_parts = []

    for page_num, image in enumerate(images, 1):
        try:
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
        except Exception as e:
            print(f"Error processing page {page_num}: {str(e)}")
            all_pages.append({
                "page": page_num,
                "text": "",
                "line_count": 0,
                "error": str(e)
            })
            markdown_parts.append(f"## Seite {page_num}\n\n[Fehler bei der Verarbeitung]")

    # Combine all pages
    full_markdown = "\n\n---\n\n".join(markdown_parts)

    return OCRResponse(
        success=True,
        pages=len(images),
        markdown=full_markdown,
        structured=all_pages,
        method="ocr",
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
async def extract_pdf(file: UploadFile = File(...), _auth: bool = Depends(require_api_key)):
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
async def extract_base64(request: Base64Request, _auth: bool = Depends(require_api_key)):
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


@app.post("/extract-document", response_model=OCRResponse)
async def extract_document(file: UploadFile = File(...), _auth: bool = Depends(require_api_key)):
    """
    Extract text from Office documents (DOCX, PPTX, XLSX) via markitdown

    - **file**: Office document (max 50MB)

    Returns extracted text in markdown format optimized for AI processing
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in DOC_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(sorted(DOC_EXTENSIONS))}"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    try:
        result = md_converter.convert_stream(
            io.BytesIO(content), stream_info=StreamInfo(extension=ext)
        )
        text = (result.text_content or "").strip()
    except Exception as e:
        print(f"markitdown document error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process document: {str(e)}"
        )

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No text found in document"
        )

    return OCRResponse(
        success=True,
        pages=1,
        markdown=text,
        structured=[{"page": 1, "text": text, "line_count": text.count("\n") + 1}],
        method="markitdown",
    )


@app.post("/extract-image", response_model=OCRResponse)
async def extract_image(file: UploadFile = File(...), _auth: bool = Depends(require_api_key)):
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

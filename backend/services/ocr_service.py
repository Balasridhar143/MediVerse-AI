import os
import re
from typing import Dict, Any, List

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts text from PDF using PyMuPDF (fitz) or pypdf."""
    text = ""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        if text.strip():
            return text.strip()
    except Exception:
        pass

    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception:
        pass

    return text.strip()

def extract_text_from_image(image_path: str) -> str:
    """Extracts text from image using pytesseract if OCR engine is available."""
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        return ""

# Common Laboratory Test Extraction Patterns
LAB_PATTERNS = [
    {"name": "Hemoglobin", "regex": r"(?:Hemoglobin|Hb|HGB)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(g/dL|g/L|gm/dl)?", "unit": "g/dL"},
    {"name": "Fasting Blood Sugar", "regex": r"(?:Fasting\s+(?:Blood\s+)?(?:Sugar|Glucose)|FBS)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mmol/L)?", "unit": "mg/dL"},
    {"name": "Post Prandial Blood Sugar", "regex": r"(?:Post\s+Prandial\s+(?:Blood\s+)?(?:Sugar|Glucose)|PPBS)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mmol/L)?", "unit": "mg/dL"},
    {"name": "HbA1c", "regex": r"(?:HbA1c|Glycated\s+Hemoglobin)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?", "unit": "%"},
    {"name": "Total White Blood Cells (WBC)", "regex": r"(?:Total\s+WBC|WBC\s+Count|Total\s+Leukocytes|TLC)\s*[:=\-]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(cells/cumm|/mcL|10\^3/uL)?", "unit": "cells/cumm"},
    {"name": "Platelet Count", "regex": r"(?:Platelet\s+Count|Platelets)\s*[:=\-]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(lakhs/cumm|/mcL|10\^3/uL|/uL)?", "unit": "lakhs/cumm"},
    {"name": "Serum Creatinine", "regex": r"(?:Serum\s+Creatinine|Creatinine)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|umol/L)?", "unit": "mg/dL"},
    {"name": "Total Cholesterol", "regex": r"(?:Total\s+Cholesterol|Cholesterol\s+Total)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mmol/L)?", "unit": "mg/dL"},
    {"name": "Blood Urea Nitrogen (BUN)", "regex": r"(?:BUN|Blood\s+Urea\s+Nitrogen|Urea)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?", "unit": "mg/dL"},
    {"name": "Serum Bilirubin Total", "regex": r"(?:Total\s+Bilirubin|Bilirubin\s+Total)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?", "unit": "mg/dL"},
]

def parse_lab_parameters(text: str) -> List[Dict[str, Any]]:
    """Parses known laboratory values from raw extracted text."""
    parameters = []
    if not text:
        return parameters

    for pat in LAB_PATTERNS:
        match = re.search(pat["regex"], text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(",", "")
            try:
                numeric_val = float(raw_val)
                unit = match.group(2) if len(match.groups()) >= 2 and match.group(2) else pat["unit"]
                parameters.append({
                    "name": pat["name"],
                    "value": numeric_val,
                    "unit": unit
                })
            except ValueError:
                continue

    return parameters

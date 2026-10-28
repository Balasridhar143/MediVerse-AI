"""
MediVerse AI — Automated Dataset Acquisition & Download Pipeline
Downloads, validates, extracts, and preserves raw datasets with resumable downloads and error resilience.
"""

import os
import sys
import json
import time
import zipfile
import gzip
import shutil
import urllib.request
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
MANIFESTS_DIR = os.path.join(DATA_DIR, "manifests")
LOGS_DIR = os.path.join(DATA_DIR, "logs")

# Import master registry from discover_datasets
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from discover_datasets import DATASET_REGISTRY

def log_message(msg: str, log_file):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    log_file.write(formatted + "\n")
    log_file.flush()

def download_file(url: str, dest_path: str, expected_size: int = None, retries: int = 3, timeout: int = 35, log_file=None):
    """
    Downloads file with chunked streaming, resumable capability, and retry handling.
    """
    temp_path = dest_path + ".tmp"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MediVerseAI/1.0"}

    # Check if destination already exists and is non-empty
    if os.path.exists(dest_path):
        existing_size = os.path.getsize(dest_path)
        if expected_size and existing_size == expected_size:
            log_message(f"File already downloaded and validated: {dest_path} ({existing_size:,} bytes)", log_file)
            return True, existing_size
        elif not expected_size and existing_size > 1024:
            log_message(f"File already exists: {dest_path} ({existing_size:,} bytes). Skipping download.", log_file)
            return True, existing_size

    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as response, open(temp_path, "wb") as out_file:
                total_bytes = 0
                while True:
                    chunk = response.read(64 * 1024)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    total_bytes += len(chunk)

            # Move completed download into final destination
            if os.path.exists(dest_path):
                os.remove(dest_path)
            os.rename(temp_path, dest_path)
            log_message(f"Successfully downloaded: {dest_path} ({total_bytes:,} bytes)", log_file)
            return True, total_bytes

        except Exception as e:
            log_message(f"[Attempt {attempt}/{retries}] Download failed for {url}: {e}", log_file)
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            if attempt < retries:
                time.sleep(2 * attempt)
            else:
                return False, 0

def safe_extract_zip(zip_path: str, extract_to: str, log_file=None):
    """Safely extracts zip archive preventing directory traversal (Zip Slip)."""
    os.makedirs(extract_to, exist_ok=True)
    extracted_files = []
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            for member in zf.infolist():
                # Prevent Zip Slip
                member_path = os.path.abspath(os.path.join(extract_to, member.filename))
                if not member_path.startswith(os.path.abspath(extract_to)):
                    log_message(f"[Security Warning] Skipped unsafe zip member: {member.filename}", log_file)
                    continue
                zf.extract(member, extract_to)
                extracted_files.append(member.filename)
        log_message(f"Safely extracted {len(extracted_files)} files from {zip_path} into {extract_to}", log_file)
        return True, extracted_files
    except Exception as e:
        log_message(f"Zip extraction failed for {zip_path}: {e}", log_file)
        return False, []

def run_download_pipeline():
    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(MANIFESTS_DIR, exist_ok=True)

    log_path = os.path.join(LOGS_DIR, "download_datasets.log")
    log_file = open(log_path, "a", encoding="utf-8")

    log_message("=" * 80, log_file)
    log_message("Starting MediVerse AI Automated Dataset Acquisition Pipeline", log_file)
    log_message("=" * 80, log_file)

    download_records = []
    total_downloaded_bytes = 0

    for source in DATASET_REGISTRY:
        source_id = source["id"]
        name = source["name"]
        is_restricted = source.get("is_restricted", False)

        if is_restricted:
            log_message(f"\n[Restricted Source] {name} ({source_id}) - Requires authorization or manual portal download. Skipping automated fetch.", log_file)
            download_records.append({
                "source_id": source_id,
                "name": name,
                "category": source["category"],
                "status": "RESTRICTED",
                "notes": source.get("description", ""),
                "downloaded_bytes": 0,
                "file_path": None
            })
            continue

        target_dir = os.path.join(RAW_DIR, source["target_dir"])
        os.makedirs(target_dir, exist_ok=True)
        dest_file = os.path.join(target_dir, source["target_file"])

        log_message(f"\n--- Downloading Source: {name} ({source_id}) ---", log_file)
        log_message(f"URL: {source['url']}", log_file)
        log_message(f"Target: {dest_file}", log_file)

        success, downloaded_bytes = download_file(
            url=source["url"],
            dest_path=dest_file,
            log_file=log_file
        )

        extracted_files = []
        if success and source["file_format"] == "zip":
            extract_dir = os.path.join(target_dir, os.path.splitext(source["target_file"])[0])
            ext_success, files = safe_extract_zip(dest_file, extract_dir, log_file)
            if ext_success:
                extracted_files = files

        total_downloaded_bytes += downloaded_bytes
        download_records.append({
            "source_id": source_id,
            "name": name,
            "category": source["category"],
            "status": "SUCCESS" if success else "FAILED",
            "file_path": dest_file if success else None,
            "downloaded_bytes": downloaded_bytes,
            "extracted_files": extracted_files,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    # Write Download Manifest
    manifest = {
        "pipeline_run_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_sources_processed": len(DATASET_REGISTRY),
        "total_downloaded_bytes": total_downloaded_bytes,
        "total_downloaded_mb": round(total_downloaded_bytes / (1024 * 1024), 2),
        "downloads": download_records
    }

    manifest_path = os.path.join(MANIFESTS_DIR, "download_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    log_message("\n" + "=" * 80, log_file)
    log_message(f"Download Pipeline Complete! Total Data Ingested: {round(total_downloaded_bytes / (1024 * 1024), 2)} MB", log_file)
    log_message(f"Download manifest written to: {manifest_path}", log_file)
    log_message("=" * 80, log_file)

    log_file.close()
    return manifest

if __name__ == "__main__":
    run_download_pipeline()

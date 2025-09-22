from yolo_wraper import run_ocr
from pdfconv import convert_pdf
from status import *

import shutil
import os

def save_files(provider_name, job_id, stop_event):
    # Use absolute paths to avoid issues with different working directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define and create the directories for uploads and JSONs
    upload_dir = os.path.join(base_dir, 'upload', provider_name, '')
    json_dir = os.path.join(base_dir, 'providers', provider_name, '')

    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(json_dir, exist_ok=True)

    try:
        convert_pdf(upload_dir, json_dir, stop_event, job_id)
    except Exception as e:
        cache_clean(upload_dir, job_id)
        update_job_status(job_id, 
            {"status": "error",
             "progress" : 0, 
             "message": "Error when converting PDF, encrypted?"})
        print(f"Error during processing: {e}")
        return False

    try:
        run_ocr(provider_name, upload_dir, json_dir, stop_event, job_id)
    except Exception as e:
        cache_clean(upload_dir, job_id)
        update_job_status(job_id, 
            {"status": "error",
             "progress" : 0, 
             "message": "Error when running ocr"})
        return False

    cache_clean(upload_dir, job_id)
    update_job_status(job_id, {"status": "complete","progress": 100, "message": "Finalizado"})
    return True
    
def full_clean(providers_dir, upload_dir):
    if os.path.exists(providers_dir):
        shutil.rmtree(providers_dir)
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)

def cache_clean(upload_dir, job_id=None):
    if os.path.exists(upload_dir):
        if job_id != None:
            update_job_status(job_id, 
                {"status": "processing",
                "progress" : 90, 
                "message": "Eliminando archivos temporales"})
        shutil.rmtree(upload_dir)


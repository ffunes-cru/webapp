from pdf2image import convert_from_path
import os
import json
import pypdf
from status import *

def process_pdf_with_deepdoctection(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            if reader.is_encrypted:
                # The PDF is encrypted, so we can't process it.
                print(f"File {pdf_path} is encrypted and cannot be processed.")
                raise Exception
            
            # If we get here, the PDF is not encrypted. Now you can call DeepDoctection.
            # Replace this with your actual DeepDoctection call.
            # run_ocr(pdf_path, ...) 
            print(f"File {pdf_path} is valid and will be processed.")
            return True
            
    except Exception as e:
        # Catches other potential file errors like not a valid PDF.
        print(f"Error reading file {pdf_path}: {e}")
        raise e

def convert_pdf(pdf_folder, target_folder, stop_event, job_id):
    #base_host_path = "out/raw_img"
    #pdf_folder = "./telecom"
    data_json = []
    #get all pdfs in the subdir "pdfs" in this directory
    pdfs = os.listdir(pdf_folder)
    print(pdf_folder)
    t = 1
    for file in pdfs:
        if stop_event.is_set():
            # The thread has been signaled to stop, perform cleanup
            print(f"Job {job_id} was cancelled.")
            update_job_status(job_id, 
                {"status": "cancelled",
                    "progress" : 0, 
                    "message": "PDF conversion cancelled",
                    }, stop_event)
            return # Exit the function
        name, extension = os.path.splitext(file)
        if extension == ".pdf":
            # if the file is a pdf, convert pdf to images using pdf2image
            try:
                process_pdf_with_deepdoctection(os.path.join(pdf_folder, file))
                images = convert_from_path(os.path.join(pdf_folder, file))
            except Exception as e:
                raise e
            img_list = []
            # save every image and add the urls to a list
            for i, image in enumerate(images):
                file_name = f'{name}_{i}.jpg'
                update_job_status(job_id, 
                {"status": "processing",
                    "progress" : int((t / (len(pdfs)*len(images))) * 40),
                    "message": f"PDF: Processing {file_name}",
                    }, stop_event)
                t = t + 1
                image.save(f"{target_folder}/{file_name}", 'JPEG')
                print(file_name)

#with open("data_json.json", 'w') as f:
    #json.dump(data_json, f)
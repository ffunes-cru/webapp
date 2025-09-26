from google import genai
import os
from status import *

def run_gemini(provider_folder, query, job_id, stop_event):

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    facturas = [os.path.join(provider_folder, d) for d in os.listdir(provider_folder) if d.endswith(".jpg")]

    i = 1
    try:
        for fact in facturas:

            if stop_event.is_set():
                print(f"Job {job_id} was cancelled.")
                update_job_status(job_id, 
                    {"status": "cancelled",
                        "progress" : 0, 
                        "message": "GEMINI processing cancelled",
                        }, stop_event)
                return # Exit the function

            uploaded_file = client.files.upload(file=fact)

            response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[query, uploaded_file]
            )

            update_job_status(job_id, 
                {"status": "processing",
                "progress" : int((i / len(facturas))*100), 
                "message": response.text}, stop_event)
            
            i = i + 1

        update_job_status(job_id, 
        {"status": "completed",
        "progress" : 100, 
        "message": ""}, stop_event)
    except Exception as err:
        print(err.response.json())
        update_job_status(job_id, 
        {"status": "error",
        "progress" : 0, 
        "message": err.response.json().get("error").get("message") }, stop_event)
        return

        

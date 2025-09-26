import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import threading
import json
import uuid
from run_aut import run_automatization
from load_inv import save_files
from gemini import run_gemini
import shutil

from status import *

app = Flask(__name__)
CORS(app)

# Paths to your data
PROVIDERS_DIR = './providers'
CONFIGS_DIR = './configs'
LOG_DIR = './logs'
IMG_EXT = ".jpg"

@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    # Use the imported function to get the status
    status = get_job_status(job_id)
    print(status)
    #if status is None:
    #    return jsonify({"status": "not_found", "message": "Job ID not found."}), 404
    return jsonify(status)

@app.route('/api/tree-data', methods=['GET'])
def get_tree_data():
    """Retorna toda la estructura de proveedores y archivos en un formato de árbol."""
    tree_data = []
    providers = [d for d in os.listdir(PROVIDERS_DIR) if os.path.isdir(os.path.join(PROVIDERS_DIR, d))]
    
    for provider in providers:
        provider_path = os.path.join(PROVIDERS_DIR, provider)
        json_files = [f for f in os.listdir(provider_path) if f.endswith('.json')]
        
        children = []
        for json_file in json_files:
            children.append({
                "name": json_file,
                "json_file": json_file,
                "img_file": json_file.replace('.json', '.jpg'),  #SACAR Y USAR EL DATO DEL JSON
                "id": f"{provider}-{json_file}"
            })

        tree_data.append({
            "name": provider,
            "toggled": False,
            "children": children,
            "id": provider
        })
        
    return jsonify(tree_data)

@app.route('/api/providers', methods=['GET'])
def get_providers():
    """Returns a list of all provider names (folder names)."""
    providers = [d for d in os.listdir(PROVIDERS_DIR) if os.path.isdir(os.path.join(PROVIDERS_DIR, d))]
    return jsonify(providers)

@app.route('/api/invoice_data/<provider_name>/<json_name>', methods=['GET'])
def get_invoice_data(provider_name, json_name):
    """Returns the OCR data for a sample invoice for the given provider."""
    provider_path = os.path.join(PROVIDERS_DIR, provider_name)
    if not os.path.isdir(provider_path):
        return jsonify({"error": "Provider not found"}), 404
    
    json_files = [f for f in os.listdir(provider_path) if f == json_name]
    if not json_files:
        return jsonify({"error": "No OCR data found for this provider"}), 404
        
    with open(os.path.join(provider_path, json_files[0]), 'r') as f:
        data = f.read()
    
    return data

@app.route('/providers/<provider>/<filename>')
def serve_image(provider, filename):
    """Serves the image files statically."""
    return send_from_directory(os.path.join(PROVIDERS_DIR, provider), filename)

@app.route('/config/log.txt', methods=['GET'])
def get_log():
    """returns the last export log"""
    #TODO


@app.route('/api/config/<provider>', methods=['GET','POST'])
def handle_config(provider):
    open_process = False
    if request.method == 'POST':
        job_id = str(uuid.uuid4())
        try:
            config_data = request.json
            print(config_data)
            #provider_name = config_data['provider_name']
            config_file_path = os.path.join(CONFIGS_DIR, "config.json")
            
            with open(config_file_path, 'w') as f:
                json.dump(config_data, f)


            thread = threading.Thread(target=run_automatization, args=(CONFIGS_DIR, PROVIDERS_DIR, IMG_EXT, job_id))
            thread.start()

            open_process = False
            update_job_status(job_id, {"status": "started", "message": "Task initiated."})
            return jsonify({"job_id": job_id})
        except Exception as e:
            print(f"Error procesando POST para {provider}: {e}")
            update_job_status(job_id, {"status": "error", "message": "Task initialization error"})
            return jsonify({"job_id": job_id}), 500
    else:
        """Returns the OCR data for a sample invoice for the given provider."""
        log_path = os.path.join(LOG_DIR, f'{provider}.json')
        print(log_path)
        if not os.path.isfile(log_path):
            status.update_job_status(job_id, {"status": "error", "message": "log for provider not found"})
            return jsonify({"job_id": job_id}), 404
            
        return send_from_directory(LOG_DIR, f'{provider}.json', as_attachment=True, mimetype='application/json')

@app.route('/api/upload-files/<provider_name>', methods=['POST'])
def upload_files(provider_name):
    # Verifica si la clave 'files' existe en la solicitud
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400
    
    # Obtiene la lista de archivos de la clave 'files'
    uploaded_files = request.files.getlist('files')
    
    if not uploaded_files:
        return jsonify({"error": "No selected files"}), 400

    job_id = str(uuid.uuid4())
    stop_event = threading.Event() 

    base_upload_dir = f'./upload/{provider_name}'
    os.makedirs(base_upload_dir, exist_ok=True)

    for file in uploaded_files:
        file_path = os.path.join(base_upload_dir, file.filename)
        file.save(file_path)

    print(provider_name)

    thread = threading.Thread(target=save_files, args=(provider_name, job_id, stop_event))
    thread.start()

    update_job_status(job_id, 
        {"status": "processing",
            "progress" : 0, 
            "message": "Running PDF conversion"
            }, stop_event)

    return jsonify({"job_id": job_id}), 200

@app.route('/test', methods=['GET'])
def test():
    return "Hello World", 200

@app.route('/api/delete/<provider_name>', methods=['POST'])
def delete_prov(provider_name):
    prov_dir = os.path.join(PROVIDERS_DIR, provider_name) 
    if os.path.exists(prov_dir):
        shutil.rmtree(prov_dir)
        return jsonify({"success": "Proveedor borrado correctamente"}), 200
    return jsonify({"error": "No se encontro el proveedor"}), 404

@app.route('/api/cancel-process/<job_id>', methods=['POST'])
def cancel_process(job_id):
    job_info = get_job_status(job_id)
    print(job_id)
    print(job_info)
    if not job_info:
        return jsonify({"error": "Job ID not found."}), 404

    current_status = job_info["status"]
    if current_status == "complete" or current_status == "error":
        return jsonify({"message": f"Job is already {current_status}."})

    # Get the event and signal the thread to stop
    stop_event = get_job_event(job_id)
    stop_event.set()
    
    return jsonify({"message": "Cancellation signal sent."})

@app.route('/api/gemini', methods=['POST'])
def call_gemini():

    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400

    # Get the JSON data from the request
    data = request.get_json()

    provider = data.get('provider')
    provider_folder = os.path.join(PROVIDERS_DIR, provider)
    
    query = data.get('query')
    stop_event = threading.Event() 
    job_id = str(uuid.uuid4())

    thread = threading.Thread(target=run_gemini, args=(provider_folder, query, job_id, stop_event))
    thread.start()

    update_job_status(job_id, 
        {"status": "processing",
            "progress" : 0, 
            "message": "Running GEMINI Processing"
            }, stop_event)

    return jsonify({"job_id": job_id}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5005)
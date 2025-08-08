import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Paths to your data
PROVIDERS_DIR = './providers'
CONFIGS_DIR = './configs'

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
                "img_file": json_file.replace('.json', '.jpg'),
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

@app.route('/api/config/<provider>', methods=['GET','POST'])
def handle_config(provider):
    if request.method == 'POST':
        try:
            config_data = request.json
            print(config_data)
            #provider_name = config_data['provider_name']
            config_file_path = os.path.join(CONFIGS_DIR, "config.json")
            
            with open(config_file_path, 'w') as f:
                json.dump(config_data, f)
        
            return jsonify({"message": f"Configuration for {provider} saved."})
        except Exception as e:
            print(f"Error procesando POST para {provider}: {e}")
            return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500
    else:
        """Returns the OCR data for a sample invoice for the given provider."""
        conf_path = os.path.join(CONFIGS_DIR, 'config.json')
        print(provider_conf_path)
        if not os.path.isfile(conf_path):
            return jsonify({"error": "config for provider not found"}), 404
            
        with open(conf_path, 'r') as f:
            data = f.read()
        
        provider_configs = [config for config in data if config.get('provider_name') == provider]

        return provider_configs

if __name__ == '__main__':
    app.run(debug=True, port=5005)
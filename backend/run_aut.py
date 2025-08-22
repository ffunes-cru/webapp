import os
import base64
import json
import re
from PIL import Image
from pyzbar.pyzbar import decode

def get_log():
    """returns the last export log"""
    #TODO

def read_qr(image_path):
    """
    Reads a QR code, decodes the embedded Base64 string, and returns the data.

    Args:
        image_path (str): The path to the image file containing the QR code.

    Returns:
        dict or None: The decoded JSON data from the QR code, or None if no QR code is found.
    """
    try:
        img = Image.open(image_path)
        decoded_objects = decode(img)

        if not decoded_objects:
            return None

        for obj in decoded_objects:
            if obj.type == 'QRCODE':
                # The QR code data is a URL
                url = obj.data.decode('utf-8')
                
                # Check if the URL has the expected format
                if "qr/?p=" in url:
                    # Isolate the Base64 part after "?p="
                    base64_string = url.split('qr/?p=')[1]
                    
                    try:
                        # Decode the Base64 string
                        # The string might need padding if its length is not a multiple of 4
                        # We are using Base64 URL safe decoding (b64decode handles both)
                        decoded_bytes = base64.b64decode(base64_string + '==' if len(base64_string) % 4 == 2 else base64_string + '=' if len(base64_string) % 4 == 3 else base64_string, '-_')
                        
                        # Load the decoded bytes as a JSON string
                        decoded_json = json.loads(decoded_bytes.decode('utf-8'))
                        
                        return decoded_json
                    except (base64.binascii.Error, json.JSONDecodeError) as e:
                        print(f"Error decoding or parsing JSON from QR code: {e}")
                        return None
        return None
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

def add_to_json_out_structure(data_dict, json_name, item_data, qr_data):
    """
    Añade datos a una estructura de diccionario, organizados por el nombre del archivo JSON.
    Crea la clave si no existe.

    Args:
        data_dict (dict): El diccionario principal que contendrá los datos.
        json_name (str): El nombre del archivo JSON (la clave).
        item_data (dict): El diccionario de datos del item (e.g., {"tipo": ..., "text": ...}).
        qr_data (dict): El diccionario con los datos del código QR.
    """
    # Si la clave 'json_name' no existe en el diccionario principal, la inicializa
    if json_name not in data_dict:
        data_dict[json_name] = {
            "qr_data": qr_data,
            "item_data": []
        }
    
    # Si 'qr_data' ya tiene un valor, no lo actualiza para evitar sobrescribir
    # si se llama la función varias veces para el mismo archivo.
    # Si 'qr_data' es None, se puede asignar un valor predeterminado si es necesario.
    if not data_dict[json_name]["qr_data"]:
        data_dict[json_name]["qr_data"] = qr_data
    
    # Añade el nuevo item a la lista 'item_data'
    data_dict[json_name]["item_data"].append(item_data)

def apply_right_to_left_formatting(result, format_pattern):
    """
    Aplica un patrón de formato a una cadena, procesando de derecha a izquierda.
    Los caracteres del patrón son:
    - '#': cualquier carácter
    - '_': solo un dígito
    - Otros: caracteres literales

    Args:
        result (str): La cadena de texto a formatear.
        format_pattern (str): El patrón de formato (ej. "___,___.__").

    Returns:
        str: La cadena formateada.
    """
    formatted = ''
    pattern_index = len(format_pattern) - 1
    result_index = len(result) - 1

    while pattern_index >= 0 and result_index >= 0:
        pattern_char = format_pattern[pattern_index]
        result_char = result[result_index]
        
        if pattern_char == '#':
            # Coincide con cualquier carácter y lo añade al inicio
            formatted = result_char + formatted
            result_index -= 1
        elif pattern_char == '_':
            # Coincide solo con dígitos y los añade al inicio
            if result_char.isdigit():
                formatted = result_char + formatted
            else:
                # Si el carácter no es un dígito, se salta el carácter de la entrada
                result_index -= 1
                continue
            result_index -= 1
        else:
            # Es un carácter literal del patrón (como una coma o un punto)
            # Se añade el carácter al inicio de la salida y solo se mueve el índice del patrón
            formatted = pattern_char + formatted
        
        pattern_index -= 1

    # Manejar los caracteres restantes de la cadena de resultado (si los hay)
    while result_index >= 0:
        formatted = result[result_index] + formatted
        result_index -= 1
    
    return formatted

def process_text_with_config(text, config):
    """
    Processes a string based on a given configuration with chained operations:
    1. Regex
    2. Cleaning (Replace)
    3. Formatting
    
    Args:
        text (str): The original text to process.
        config (dict): The configuration object containing regex, cleaning, and format rules.
    
    Returns:
        str: The final processed string.
    """
    # Initialize result with the original text
    result = text
    
    # 1. Apply Regex
    regex_input = config.get('regex', '').strip()
    if regex_input:
        try:
            # Use re.search() to find the first match
            match = re.search(regex_input, text)
            if match:
                # Prioritize capturing groups if they exist
                if match.groups():
                    result = match.group(1)
                else:
                    result = match.group(0)
            else:
                return 'No match found.'
        except re.error:
            return 'Invalid regex syntax.'

    # 2. Apply Cleaning (Trim and Replace)
    cleaning_config = config.get('cleaning', {})
    
    # Trim spaces (always applied after the regex match)
    trim_enabled = cleaning_config.get('trim', True)
    if trim_enabled and isinstance(result, str):
        result = result.strip()
    
    # Replace text
    replace_config = cleaning_config.get('replace', {})
    replace_from = replace_config.get('from', '')
    replace_to = replace_config.get('to', '')
    replacement_type = replace_config.get('type', 'substring')
    
    if replace_from and isinstance(result, str):
        if replacement_type == 'substring':
            # Use re.sub for global substring replacement
            result = re.sub(re.escape(replace_from), replace_to, result)
        elif replacement_type == 'character':
            # Replace characters one by one
            chars_to_replace = set(replace_from)
            result_list = list(result)
            for i in range(len(result_list)):
                if result_list[i] in chars_to_replace:
                    result_list[i] = replace_to
            result = ''.join(result_list)

    # 3. Apply Formatting
    format_pattern = config.get('format', '').strip()
    if format_pattern and isinstance(result, str):
        return apply_right_to_left_formatting(result, format_pattern)
        
    return result

def calculate_intersection_area(box1, box2):
    """
    Calcula el área de intersección de dos bounding boxes.
    
    Args:
        box1 (dict): Diccionario con las coordenadas 'ulx', 'uly', 'lrx', 'lry'.
        box2 (dict): Diccionario con las coordenadas 'ulx', 'uly', 'lrx', 'lry'.
        
    Returns:
        float: El área del área de intersección. Devuelve 0 si no hay intersección.
    """
    # Coordenadas de la intersección
    inter_ulx = max(box1.get('ulx'), box2.get('ulx'))
    inter_uly = max(box1.get('uly'), box2.get('uly'))
    inter_lrx = min(box1.get('lrx'), box2.get('lrx'))
    inter_lry = min(box1.get('lry'), box2.get('lry'))

    # Si no hay intersección, el ancho o alto es negativo o cero.
    width = inter_lrx - inter_ulx
    height = inter_lry - inter_uly

    if width > 0 and height > 0:
        return width * height
    else:
        return 0.0

def find_bboxes(model_bbox, prov_inv_json_paths):
    """
    Encuentra en cada archivo JSON el item cuya bbox interseca más con la bbox del modelo.

    Args:
        model_bbox (dict): La bbox del item del modelo.
        prov_inv_json_paths (list): Una lista de rutas a los archivos JSON para buscar.

    Returns:
        list: Una lista de tuplas. Cada tupla contiene el path del JSON y el mejor
              item (dict) encontrado en ese archivo. Devuelve una lista vacía si no
              se encuentra ninguna intersección.
    """
    results = []
    
    for json_path in prov_inv_json_paths:
        best_match_in_file = None
        max_intersection_area_in_file = 0.0

        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                layout_data = data.get('layout_data', [])
                
                for item in layout_data:
                    item_bbox = item.get('bounding_box', {})
                    if item_bbox:
                        intersection_area = calculate_intersection_area(model_bbox, item_bbox)
                        
                        if intersection_area > max_intersection_area_in_file:
                            max_intersection_area_in_file = intersection_area
                            best_match_in_file = item
                            
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error procesando {json_path}: {e}")

        # Si encontramos una intersección en este archivo, la agregamos a los resultados
        if best_match_in_file:
            results.append({'json_path': json_path, 'best_match_item': best_match_in_file})

    return results



def run_automatization(CONFIGS_DIR, PROVIDERS_DIR, IMG_EXT):
    """runs the automatization algorithm with the given config"""
    print("abro json")
    result = {}
    with open(CONFIGS_DIR + '/' + "config.json", 'r') as f:
        json_data = json.load(f)
        try:
            # Iterate over all top-level keys in the JSON, which are the providers
            print("leo json")
            for provider_name, items_list in json_data.items():
                qr_data = {}
                if isinstance(items_list, list):
                    print("Buscando jsons")
                    provider_dir = PROVIDERS_DIR + '/' + provider_name
                    prov_inv_json = [os.path.join(provider_dir, f) for f in os.listdir(provider_dir) if f.endswith('.json')]
                    for j in prov_inv_json:
                        root, _ = os.path.splitext(j)
                        qr_data = read_qr(root + IMG_EXT),
                        print(root + IMG_EXT)
                    for item in items_list:
                        # Safely get the 'bounding_box' dictionary
                        bbox = item.get('item', {}).get('bounding_box', {})
                        if bbox:
                            # Call the function with the bbox and provider name
                            print(f"Searching for intersecting bboxes for provider '{provider_name}'.")

                            for i in find_bboxes(bbox, prov_inv_json):
                                item_data = {
                                    "tipo": item.get('field_name', {}),
                                    "text": process_text_with_config(i.get('best_match_item', {}).get('text', {}), item)
                                }
                                add_to_json_out_structure(result, i.get('json_path', {}), item_data, qr_data) 
        except Exception as e:
            print(f"An error occurred: {e}")
    with open("logs/log.txt", 'w') as f:
        json.dump(result, f, indent=4)

    
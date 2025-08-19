import os
import json

def get_log():
    """returns the last export log"""
    #TODO

def add_to_json_out_structure(data_dict, json_name, item_data):
    """
    Añade un item a la lista bajo una clave de nombre de JSON.
    Crea la clave si no existe.
    
    Args:
        data_dict (dict): El diccionario principal.
        json_name (str): El nombre del archivo JSON (la clave).
        item_data (dict): El diccionario de datos del item (e.g., {"tipo": ..., "text": ...}).
    """
    # Si la clave no existe, la inicializa con una lista vacía
    if json_name not in data_dict:
        data_dict[json_name] = []
    
    # Añade el nuevo item a la lista
    data_dict[json_name].append(item_data)

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
        formatted_output = ''
        result_index = 0
        for pattern_char in format_pattern:
            if pattern_char == '#':
                while result_index < len(result):
                    formatted_output += result[result_index]
                    result_index += 1
                    break
            elif pattern_char == '_':
                while result_index < len(result):
                    current_char = result[result_index]
                    if current_char.isdigit():
                        formatted_output += current_char
                        result_index += 1
                        break
                    result_index += 1
            else:
                formatted_output += pattern_char
        return formatted_output
        
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



def run_automatization(CONFIGS_DIR, PROVIDERS_DIR):
    """runs the automatization algorithm with the given config"""
    print("abro json")
    result = {}
    with open(CONFIGS_DIR + '/' + "config.json", 'r') as f:
        json_data = json.load(f)
        try:
            # Iterate over all top-level keys in the JSON, which are the providers
            print("leo json")
            for provider_name, items_list in json_data.items():
                if isinstance(items_list, list):
                    print("Buscando jsons")
                    provider_dir = PROVIDERS_DIR + '/' + provider_name
                    prov_inv_json = [os.path.join(provider_dir, f) for f in os.listdir(provider_dir) if f.endswith('.json')]
                    for item in items_list:
                        # Safely get the 'bounding_box' dictionary
                        bbox = item.get('item', {}).get('bounding_box', {})
                        if bbox:
                            # Call the function with the bbox and provider name
                            print(f"Searching for intersecting bboxes for provider '{provider_name}'.")

                            for i in find_bboxes(bbox, prov_inv_json):
                                item_data = {
                                    "tipo": "test",
                                    "text": process_text_with_config(i.get('best_match_item', {}).get('text', {}), item)
                                }
                                add_to_json_out_structure(result, i.get('json_path', {}), item_data) 
        except Exception as e:
            print(f"An error occurred: {e}")
    with open("logs/log.txt", 'w') as f:
        json.dump(result, f)

    
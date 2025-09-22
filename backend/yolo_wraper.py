from __future__ import annotations 

from typing import Mapping
from deepdoctection.utils.types import PixelValues, PathLikeOrStr
from deepdoctection.utils.settings import TypeOrStr
from deepdoctection.utils.file_utils import Requirement
import json
from matplotlib import pyplot as plt
import os
from status import *

import numpy as np
from PIL import Image

import deepdoctection as dd
from ultralytics import YOLO

def _yolo_to_detectresult(results, categories) -> list[dd.DetectionResult]:
    """
    Converts YOLO detection results into DetectionResult objects using inference speed as confidence.

    :param results: YOLO detection results
    :param categories: List of category names or LayoutType enums for YOLO classes.
    :return: A list of DetectionResult objects
    """

    all_results: list[dd.DetectionResult] = []

    categories_name = categories.get_categories(as_dict=True)


    # Use inference speed as the confidence score (e.g., using 'inference' time as a proxy)
    confidence = results.speed.get('inference', 0) / 100  # Normalize by 100 if you want a scale between 0-1

    # Loop through each detected box
    for i, box in enumerate(results.boxes):
        # Extract and normalize bounding box coordinates
        x1, y1, x2, y2 = box.xyxy.tolist()[0]

        # Assign class_id based on detection order or results.boxes.cls if available
        class_id = int(box.cls)+1  # Get class ID based on available keys
        class_name = categories_name.get(class_id, "Unknown") # Directly retrieve the class name from categories

        # Create a DetectionResult object with inferred confidence
        detection = dd.DetectionResult(
            box=[x1, y1, x2, y2],
            score=confidence,  # Set the normalized speed as confidence
            class_id=class_id,
            class_name=class_name
        )

        # Append the DetectionResult to the list
        all_results.append(detection)

    return all_results

def predict_yolo(np_img: PixelValues, 
                 model, 
                 conf_threshold: float, 
                 iou_threshold: float, 
                 categories: dd.ModelCategories) -> list[dd.DetectionResult]:
    """
    Run inference using the YOLO model.

    :param np_img: Input image as numpy array (BGR format)
    :param model: YOLO model instance
    :param conf_threshold: Confidence threshold for detections
    :param iou_threshold: Intersection-over-Union threshold for non-max suppression
    :param categories: List of category names or LayoutType enums for YOLO classes.
    :return: A list of detection results
    """
    # Run the model
    results = model(source=np_img, conf=conf_threshold, iou=iou_threshold)[0]

    # Convert results to DetectionResult format
    all_results = _yolo_to_detectresult(results, categories)

    return all_results

class YoloDetector(dd.ObjectDetector):
    """
    Document detector using YOLO engine for layout analysis.

    Model weights must be placed at `.cache/deepdoctection/weights/yolo/`.

    The detector predicts different categories of document elements such as text, tables, figures, headers, etc.
    """
    def __init__(self, 
                 conf_threshold: float, 
                 iou_threshold: float, 
                 model_weights: PathLikeOrStr, 
                 categories: Mapping[int, TypeOrStr]) -> None:
        """
        :param conf_threshold: Confidence threshold for YOLO detections.
        :param iou_threshold: IoU threshold for YOLO detections.
        :param model_weights: Path to the YOLO model weights file.
        :param categories: List of category names or LayoutType enums for YOLO classes.
        """
        self.name = "yolo_detector"
        self.model_id = self.get_model_id()
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        # Load YOLO model with specified weights
        self.model = YOLO(model_weights)

        if categories is None:
            raise ValueError("A dictionary of category mappings must be provided.")
        self.categories =dd.ModelCategories(init_categories=categories)

    def predict(self, np_img: PixelValues) -> list[dd.DetectionResult]:
        """
        Perform inference on a document image using YOLOv10 and return detection results.

        :param np_img: Input image as numpy array (BGR format)
        :return: A list of DetectionResult objects.
        """
        return predict_yolo(np_img, self.model, self.conf_threshold, self.iou_threshold, self.categories)

    @classmethod
    def get_requirements(cls) -> list[Requirement]:
        # You could write a function get_ultralytics_requirement() that reminds you to install ultralytics which is necessary to run this
        # predictor. 
        return []

    def clone(self) -> YoloDetector:
        """
        Clone the current detector instance.
        """
        return self.__class__(conf_threshold=self.conf_threshold, 
                              iou_threshold=self.iou_threshold, 
                              model_weights=self.model.model_path,
                              categories = self.categories)

    def get_category_names(self) -> tuple[ObjectTypes, ...]:
        """
        Get the category names used by YOLO for document detection.
        """
        return self.categories.get_categories(as_dict=False)

dd.ModelCatalog.register("yolo/yolo11x.pt", dd.ModelProfile(
    name="yolo/yolo11x.pt",
    description="YOLOv10 model for layout analysis",
    tp_model=False,
    size=[0],
    categories={
        1: dd.LayoutType.CAPTION,
        2: dd.LayoutType.FOOTNOTE,
        3: dd.LayoutType.FORMULA,
        4: dd.LayoutType.LIST_ITEM,
        5: dd.LayoutType.PAGE_FOOTER,
        6: dd.LayoutType.PAGE_HEADER,
        7: dd.LayoutType.FIGURE,
        8: dd.LayoutType.SECTION_HEADER,
        9: dd.LayoutType.TABLE,
        10: dd.LayoutType.TEXT,
        11: dd.LayoutType.TITLE,
    },
    model_wrapper="YoloDetector",
    hf_model_name="yolo11x.pt",
    dl_library="PT",
    hf_repo_id="omoured/YOLOv10-Document-Layout-Analysis",
    hf_config_file=[]
))

def build_layout_detector(config: AttrDict, mode: str = ""):
    # We want to return the YoloDetector if the profile in config.PT.LAYOUT.WEIGHTS points to a ModelProfile with a registered Yolo model.
    weights = getattr(config.PT, mode).WEIGHTS
    profile = dd.ModelCatalog.get_profile(weights)
    if profile.model_wrapper == "YoloDetector":
        model_weights = dd.ModelDownloadManager.maybe_download_weights_and_configs(weights)
        return YoloDetector(conf_threshold=0.2,
                            iou_threshold=0.8,
                            model_weights=model_weights,
                            categories=profile.categories)

    else:
        # the code for building the many other layout/table/table segmentation predictors is hidden behind _build_layout_detector.
        return dd.ServiceFactory._build_layout_detector(config, mode)

def bbox_dict(bbox, heigth, width):
    return {
        "absolute_coords": bbox.absolute_coords,
        "ulx": bbox.ulx*width,
        "uly": bbox.uly*heigth,
        "lrx": bbox.lrx*width,
        "lry": bbox.lry*heigth
    }

def run_ocr(provider_name, path, json_path, stop_event, job_id):
    try: 
        dd.ServiceFactory.build_layout_detector=build_layout_detector

        model_weights = dd.ModelDownloadManager.maybe_download_weights_and_configs("yolo/yolo11x.pt")

        config_overwrite = [
            "PT.LAYOUT.WEIGHTS=yolo/yolo11x.pt",
            "USE_TABLE_SEGMENTATION=True",
            "USE_OCR=True",
        #    "PT.LAYOUT.PADDING=True",
            "TEXT_ORDERING.FLOATING_TEXT_BLOCK_CATEGORIES=["
            "'caption',"
            "'footnote',"
            "'formula',"
            "'list_item',"
            "'page_header',"
            "'figure',"
            "'section_header',"
            "'table',"
            "'text',"
            "'title'"
            "]"
        ]


        analyzer = dd.get_dd_analyzer(config_overwrite=config_overwrite)
        #analyzer = dd.get_dd_analyzer()

        #path=f"../upload/{provider_name}/"
        #json_path=f'../providers/{provider_name}/'
        #img_path=f'../providers/{provider_name}/'
        #txt_path="out/txt"
        ubicacion = os.listdir(path=path)
        print(ubicacion)
        print(path)
        t = 1
        for filename in ubicacion:

            print(f"Analizando {filename}")
            filepath = path + filename
            filename, _ = os.path.splitext(filename)
            df = analyzer.analyze(path=filepath)
            df.reset_state()
            doc=iter(df)
            for index, page in enumerate(doc):

                if stop_event.is_set():
                    print(f"Job {job_id} was cancelled.")
                    update_job_status(job_id, 
                        {"status": "cancelled",
                            "progress" : 0, 
                            "message": "OCR conversion cancelled",
                            }, stop_event)
                    return # Exit the function

                update_job_status(job_id, 
                    {"status": "processing",
                    "progress" : int(((t / (len(ubicacion)*len(df))) * 50) + 40),
                    "message": f"OCR: Processing {filename} - {index}",
                        }, stop_event)
                t = t + 1
                print("--------------")
                height = page.height
                width = page.width
                with open(f"{json_path}/{filename}_{index}.json", 'w') as file:
                    #print(f"Escribiendo el archivo {filename}_{index}_text.json")
                    data = []
                    for layout in page.layouts:
                        #print("--------------")
                        #print(f"Layout segment: {layout.category_name}, score: {layout.score}, reading_order: {layout.reading_order}, bounding_box: {layout.bounding_box},\n annotation_id: {layout.annotation_id} \n \ntext: {layout.text} \n \n")
                        layout_data = {
                            "category_name": layout.category_name,
                            "reading_order": layout.reading_order,
                            "bounding_box": bbox_dict(layout.bounding_box, height, width),  # Assuming this is already a list or a suitable format
                            "annotation_id": layout.annotation_id,
                            "text": layout.text
                        }
                        data.append(layout_data)
                    out_data = {
                        "img" : f"{filename}_{index}.jpg",
                        "height" : height,
                        "width" : width,
                        "layout_data" : data
                    }
                    json_output = json.dumps(out_data, indent=4) # indent for pretty printing
                    file.write(json_output)
                # with open(f"{txt_path}/{filename}_{index}.txt", 'w') as file:
                #     print(page.text)
                #     file.write(page.text)
                #     plt.figure(figsize = (25,17))

                #np_image = page.viz()

                # plt.axis('off')
                # plt.imshow(np_image)

                # output_image_filename = f"{img_path}/{filename}_{index}.png"
                # plt.savefig(output_image_filename, bbox_inches='tight', pad_inches=0, dpi=300)
                # print(f"Layout analysis image saved to: {output_image_filename}")
    except Exception as e:
        print("entra aca")
        raise e         

#image = page.viz()
#plt.figure(figsize = (25,17))
#plt.axis('off')
#plt.imshow(image)

#output_image_filename = "test_layout_analysis.png"
#plt.savefig(output_image_filename, bbox_inches='tight', pad_inches=0)
#print(f"Layout analysis image saved to: {output_image_filename}")
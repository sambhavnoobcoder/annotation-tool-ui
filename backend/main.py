from flask import Flask, request, jsonify, send_file, send_from_directory
import cv2
import os
import uuid
from ultralytics import YOLO
import numpy as np
import requests
import json
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

# Get the absolute path to the 'dist' folder in the root directory
dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))
index_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))
yc = None

# @app.route('/<path:path>')
# def send_dist(path):
#     return send_from_directory(dist_folder, path)

# @app.route('/')
# def send_index():
#     return send_file(index_file)

# Set the output directory for annotated images and YOLO annotations
script_dir = os.path.dirname(os.path.realpath(__file__))
output_directory = os.path.join(script_dir, 'output_folder')
downloads_directory = os.path.expanduser("~/Downloads")

annotations_directory = os.path.join(downloads_directory, 'manual-annotations')
os.makedirs(output_directory, exist_ok=True)
os.makedirs(annotations_directory, exist_ok=True)


def yolo_predict(image, model):
    conf_thresh = 0.25
    hide_conf = True

    results = model.predict(image, stream=True, save=True, save_txt=True, project="123", name="yolo_test", exist_ok=True)

    predicted_rectangles = []
    labels = []

    for result in results:
        boxes = result.boxes.cpu().numpy()

        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0]
            label = box.cls

            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            label = int(label)

            predicted_rectangles.append((x1, y1, x2, y2, label))
            labels.append(label)

    return predicted_rectangles, labels


def upload_file(base64_encoded_data):
    try:
        url = "https://devyellowflowcore.bytelearn.ai/file-uploader"
        payload = {
            "image": f"data:image/png;base64,{base64_encoded_data.decode()}"
        }
        response = requests.post(url, json=payload)
        return response.json()['image'] 
    except Exception as e:
        print('Uploader API exception:', str(e))
        return None


@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        image_data_bytes = request.data
        # Generate a unique key and id for this request
        unique_key = str(uuid.uuid4())
        unique_id = str(uuid.uuid4())

        # Construct the full path to 'best.pt'
        yolo_model_path = os.path.join(script_dir, 'best.pt')

        # Load the YOLO model using the constructed path
        model = YOLO(yolo_model_path)

        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data_bytes, np.uint8)
        decoded_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Process image
        rectangles, labels = yolo_predict(decoded_image, model)

        # Save the annotated image with a unique filename
        annotated_image_filename = f"annotated_image_{uuid.uuid4().hex}.jpg"
        annotated_image_path = os.path.join(output_directory, annotated_image_filename)

        # Prepare annotations data
        annotations = []
        for rect in rectangles:
            x1, y1, x2, y2, label = map(int, rect)
            annotations.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2
            })
            cv2.rectangle(decoded_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(decoded_image, f"Class {label}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        cv2.imwrite(annotated_image_path, decoded_image)

        # Convert the processed image to base64
        _, processed_image_encoded = cv2.imencode('.jpg', decoded_image)
        processed_image_base64 = base64.b64encode(processed_image_encoded).decode()

        # Upload annotated image to database and get the URL
        annotated_image_url = upload_file(base64.b64encode(processed_image_encoded))
        print(annotated_image_url)

        # if not annotated_image_url:
        #     raise Exception('Failed to upload annotated image')

        # Prepare annotations data in the required format
        annotations_data = {
            "id": unique_id,
            "annotation_file_url": annotated_image_url,
            "tags": labels,
            "annotations": annotations,
        }

        # Prepare payload for the request
        payload = json.dumps({
            "key": unique_key,
            "data": annotations_data,
            "source": "object_detection_annotations"
        })

        # Prepare headers for the request
        headers = {
            'Ignore-Auth': 'true',
            'Content-Type': 'application/json'
        }

        # Send the request to the specified URL
        response = requests.post("https://devb2cdatamanagement.bytelearn.ai/cache/set", headers=headers, data=payload)

        # Check the response status
        if response.status_code != 200:
            raise Exception('Failed to save URL')

        return jsonify({
            'status': 'success',
            'annotated_image_src': annotated_image_filename,
            'processed_image_base64': processed_image_base64,
            'unique_key': unique_key,
            'unique_id': unique_id,
            # 'urlres' : annotated_image_url,
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True , port = 3600)
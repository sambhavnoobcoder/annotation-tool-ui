from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import cv2
import os
import uuid
from ultralytics import YOLO
import numpy as np
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the absolute path to the 'dist' folder in the root directory
dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))
index_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))

@app.route('/<path:path>')
def send_dist(path):
    return send_from_directory(dist_folder, path)

@app.route('/')
def send_index():
    return send_file(index_file)

# Set the output directory for annotated images and YOLO annotations
script_dir = os.path.dirname(os.path.realpath(__file__))
output_directory = os.path.join(script_dir, 'output_folder')
annotations_directory = os.path.join(script_dir, 'annotations_folder')
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

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        image_data_bytes = request.data

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

        # Save YOLO format annotations to a text file in the new folder
        yolo_annotations_filename = f"annotations_{uuid.uuid4().hex}.txt"
        yolo_annotations_path = os.path.join(annotations_directory, yolo_annotations_filename)

        with open(yolo_annotations_path, 'w') as f:
            for rect in rectangles:
                x1, y1, x2, y2, label = map(int, rect)
                normalized_x = (x1 + x2) / (2 * decoded_image.shape[1])
                normalized_y = (y1 + y2) / (2 * decoded_image.shape[0])
                normalized_width = (x2 - x1) / decoded_image.shape[1]
                normalized_height = (y2 - y1) / decoded_image.shape[0]

                line = f"{label} {normalized_x} {normalized_y} {normalized_width} {normalized_height}\n"
                f.write(line)

        for rect in rectangles:
            x1, y1, x2, y2, label = map(int, rect)
            cv2.rectangle(decoded_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(decoded_image, f"Class {label}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        cv2.imwrite(annotated_image_path, decoded_image)

        # Return the paths to the annotated image and YOLO annotations
        return jsonify({
            'status': 'success',
            'annotated_image_src': annotated_image_filename,
            'yolo_annotations_src': os.path.join('annotations_folder', yolo_annotations_filename)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/save_annotations', methods=['POST'])
def save_annotations():
    try:
        data = request.json
        image_file_name = data['imageFileName']
        annotations_content = data['annotationsContent']

        # Get path to user's downloads folder
        downloads_folder = os.path.expanduser("~/Downloads")

        # Save the annotations to a text file in the 'manual-annotations' folder in the downloads folder
        annotations_folder = os.path.join(downloads_folder, 'manual-annotations')
        os.makedirs(annotations_folder, exist_ok=True)

        annotations_file_name = f"{image_file_name.split('.')[0]}_annotations.txt"
        annotations_file_path = os.path.join(annotations_folder, annotations_file_name)

        with open(annotations_file_path, 'w') as f:
            f.write(annotations_content)

        return jsonify({'status': 'success', 'message': 'Annotations saved successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# Route to serve the annotated image
@app.route('/get_annotated_image/<filename>')
def get_annotated_image(filename):
    return send_file(os.path.join(output_directory, filename), mimetype='image/jpeg')

# Route to serve the YOLO annotations
@app.route('/get_yolo_annotations/<filename>')
def get_yolo_annotations(filename):
    return send_file(os.path.join(annotations_directory, filename), mimetype='text/plain')

if __name__ == '__main__':
    # Accessing port number from environment variable
    port_number = int(os.getenv("PORT", default=5000))
    app.run(debug=True, port=port_number)

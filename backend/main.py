from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import os
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def yolo_predict(image, model):
    conf_thresh = 0.25
    hide_conf = True

    results = model.predict(image, stream=True, save=True, save_txt=True, project="123", name="yolo_test", exist_ok=True)

    predicted_rectangles = []
    labels = []

    for result in results:
        boxes = result.boxes.cpu().numpy()

        for box in boxes:
            # Extract predictions as floats
            x1, y1, x2, y2 = box.xyxy[0]
            label = box.cls

            # Convert to ints
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            label = int(label)

            predicted_rectangles.append((x1, y1, x2, y2, label))
            labels.append(label)

    return predicted_rectangles, labels

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        # Get the image data as bytes
        image_data_bytes = request.json['image_data']

        output_directory = 'path_to_output_directory'
        os.makedirs(output_directory, exist_ok=True)
       
       # Get the directory of the current script
        script_dir = os.path.dirname(os.path.realpath(__file__))

        # Construct the full path to 'best.pt'
        yolo_model_path = os.path.join(script_dir, 'best.pt')

        # Load the YOLO model using the constructed path
        model = YOLO(yolo_model_path)

        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data_bytes, np.uint8)
        decoded_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Process image
        rectangles, labels = yolo_predict(decoded_image, model)

        # Display or save the annotated image
        annotated_image_path = os.path.join(output_directory, "annotated_image.jpg")
        for rect in rectangles:
            x1, y1, x2, y2, label = map(int, rect)
            cv2.rectangle(decoded_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(decoded_image, f"Class {label}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        cv2.imwrite(annotated_image_path, decoded_image)

        return jsonify({'status': 'success', 'annotated_image_src': annotated_image_path})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)

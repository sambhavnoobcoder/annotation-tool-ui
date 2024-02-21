# YOLO Object Detection Flask App

This is a Flask web application that utilizes the YOLO (You Only Look Once) object detection algorithm to detect objects in images. The application allows users to upload an image, which is then processed by the YOLO model, and the detected objects are displayed as bounding boxes on the image. Additionally, the application generates YOLO format annotations for the detected objects and saves them to a file.

## Installation

1. Clone the repository: `git clone https://github.com/your-username/yolo-object-detection-flask-app.git`
2. Navigate to the project directory: `cd yolo-object-detection-flask-app`
3. Install the required dependencies: `pip install -r requirements.txt`
4. Download the pre-trained YOLO model weights (e.g., `best.pt`) and place it in the project directory.

## Usage

1. Start the Flask development server: `python3 app.py`
2. Open your web browser and navigate to `http://localhost:5000`.
3. Upload an image to the web application.
4. The YOLO model will process the image and display the detected objects with bounding boxes.
5. The annotated image and YOLO format annotations will be saved in the `output_folder` and `manual-annotations` directories, respectively.

## Endpoints

- `GET /`: Serves the HTML file for the web application.
- `POST /process_image`: Processes the uploaded image using the YOLO model and returns the paths to the annotated image and YOLO annotations.
- `POST /save_annotations`: Saves the manual annotations provided by the user to a text file.
- `GET /get_annotated_image/<filename>`: Serves the annotated image with the specified filename.
- `GET /get_yolo_annotations/<filename>`: Serves the YOLO annotations with the specified filename.

## Configuration

- `output_directory`: The path to the directory where annotated images will be saved.
- `downloads_directory`: The path to the user's Downloads folder, where the `manual-annotations` folder will be created.
- `annotations_directory`: The path to the `manual-annotations` folder, where YOLO annotations will be saved.

## Deployment

To deploy the Flask application to a production environment, you'll need to configure a production-ready web server, such as Apache or Nginx, to serve the Flask application. Additionally, you'll need to handle other aspects of deployment, such as setting up a domain, configuring SSL/TLS, and managing logs and monitoring.

## License

This project is licensed under the [MIT License](LICENSE).
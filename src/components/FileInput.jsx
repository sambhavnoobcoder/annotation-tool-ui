import React, { useState } from 'react';
import axios from 'axios';

function FileInput() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [annotatedImageSrc, setAnnotatedImageSrc] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    // Display the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    try {
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const imageBase64 = fileReader.result.split(',')[1];

        // Convert base64 to bytes
        const imageBytes = new Uint8Array(atob(imageBase64).split('').map(char => char.charCodeAt(0)));

        // Send the image data to the backend as bytes
        const response = await axios.post('http://127.0.0.1:5000/process_image', {
          image_data: imageBytes,
        });

        console.log('Image processed successfully.');
        console.log(response.data);

        // Display the annotated image
        setAnnotatedImageSrc(response.data.annotated_image_src);
      };

      if (selectedFile) {
        fileReader.readAsDataURL(selectedFile);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={processImage}>Process Image</button>

      {selectedImageSrc && (
        <div>
          <h2>Selected Image</h2>
          <img src={selectedImageSrc} alt="Selected" style={{ maxWidth: '100%' }} />
        </div>
      )}

      {annotatedImageSrc && (
        <div>
          <h2>Annotated Image</h2>
          <img src={annotatedImageSrc} alt="Annotated" style={{ maxWidth: '100%' }} />
        </div>
      )}
    </div>
  );
}

export default FileInput;

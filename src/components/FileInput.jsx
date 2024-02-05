import React, { useState } from 'react';
import axios from 'axios';
import ReactImageAnnotate from 'react-image-annotate';

function FileInput() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [annotatedImageSrcs, setAnnotatedImageSrcs] = useState([]);

  const handleFileChange = (event) => {
    const files = event.target.files;
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const processImages = async () => {
    try {
      const annotations = [];

      for (const file of selectedFiles) {
        const fileReader = new FileReader();
        fileReader.onloadend = async () => {
          const imageBase64 = fileReader.result.split(',')[1];
          const imageBytes = new Uint8Array(atob(imageBase64).split('').map((char) => char.charCodeAt(0)));

          const response = await axios.post('http://127.0.0.1:5000/process_image', imageBytes, {
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });

          console.log(`Image ${file.name} processed successfully.`);
          console.log(response.data);

          annotations.push({
            name: file.name,
            annotatedImageSrc: response.data.annotated_image_src,
            annotations: response.data.annotations,
          });

          if (annotations.length === selectedFiles.length) {
            setAnnotatedImageSrcs(annotations);
          }
        };

        fileReader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  };

  const handleImageAnnotateExit = async (data) => {
    const selectedImageIndex = data.selectedImage;
    const annotations = data.images[selectedImageIndex].regions;
  
    const imageFileName = selectedFiles[selectedImageIndex].name;
  
    try {
      const annotationsContent = annotations
        .map((region) => {
          const x = region.x;
          const y = region.y;
          const width = region.w;
          const height = region.h;
  
          // const normalizedX = x / data.images[selectedImageIndex].pixelSize.w;
          // const normalizedY = y / data.images[selectedImageIndex].pixelSize.h;
          // const normalizedWidth = width / data.images[selectedImageIndex].pixelSize.w;
          // const normalizedHeight = height / data.images[selectedImageIndex].pixelSize.h;
  
          return `${region.cls} ${x} ${y} ${width} ${height}`;
        })
        .join('\n');
  
      const response = await axios.post('http://127.0.0.1:5000/save_annotations', {
        imageFileName,
        annotationsContent,
      });
  
      console.log('Annotations saved successfully:', response.data);
    } catch (error) {
      console.log(error);
    }
  };
  

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={processImages}>Process Images</button>

      {annotatedImageSrcs.map(({ name, annotatedImageSrc }, index) => (
        <div key={index}>
          <h2>{`Annotated Image - ${name}`}</h2>
          <img src={`http://127.0.0.1:5000/get_annotated_image/${annotatedImageSrc}`} alt={`Annotated ${name}`} style={{ maxWidth: '100%' }} />
        </div>
      ))}

      {selectedFiles.map((file, index) => (
        <div key={index}>
          <h2>{`Selected Image - ${file.name}`}</h2>
          <img src={URL.createObjectURL(file)} alt={`Selected ${file.name}`} style={{ maxWidth: '100%' }} />
          <ReactImageAnnotate
            labelImages
            regionClsList={['Alpha', 'Beta', 'Charlie', 'Delta']}
            regionTagList={['tag1', 'tag2', 'tag3']}
            onExit={(data) => handleImageAnnotateExit(data)}
            images={[
              {
                src: URL.createObjectURL(file),
                name: file.name,
                regions: [],
              },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

export default FileInput;

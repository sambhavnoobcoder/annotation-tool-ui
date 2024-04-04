import { useState } from 'react';
import axios from 'axios';
import ReactImageAnnotate from 'react-image-annotate';
import Carousel from './Carousel';
import { sendRequest } from '../utils/api';

function FileInput() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [annotatedImageSrcs, setAnnotatedImageSrcs] = useState([]);
  const [manuallyAnnotated, setManuallyAnnotated] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

          // const response = await sendRequest('POST', '/process_image', imageBytes, {
          //   'Content-Type': 'application/octet-stream',
          // })

          const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/process_image`, imageBytes, {
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          });

          console.log(`Image ${file.name} processed successfully.`);
          console.log(response.data.unique_key)

          if (response.data.annotated_image_src) {
            const processedImageBase64 = response.data.processed_image_base64;
                    const img = new Image();
                    img.src = `data:image/jpeg;base64,${processedImageBase64}`;
                    
            annotations.push({
              name: file.name,
              annotatedImageSrc: response.data.annotated_image_src,
              processedImage : img.src,
              annotations: response.data.annotations,
            });
        }

          

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
  
          return `${region.cls} ${x} ${y} ${width} ${height}`;
        })
        .join('\n');
  
      await sendRequest('POST' , '/cache/set' , imageFileName, annotationsContent);
      setManuallyAnnotated(true);
      
      // console.log('Annotations saved successfully:', response.data);
    } catch (error) {
      console.log(error);
      setManuallyAnnotated(false);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < selectedFiles.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }

  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // console.log(manuallyAnnotated);

  return (
     <>
      <h1 className='text-3xl text-center font-semibold mt-8'>ByteLearn Image Annotator</h1>
    
      <div className='mt-8'>
        
        {annotatedImageSrcs.length === 0 && (
          <div className="container">
            <div className="card">
              <h3>Upload Files</h3>
              <div className="drop_box">
                <header>
                  <h4>{selectedFiles.length !== 0 ? `${selectedFiles.length} selected files` : 'Select File here'}</h4>
                </header>
                <p>Files Supported: JPG, JPEG, PNG</p>
                <input type="file" accept=".jpg, .jpeg, .png" id="fileID" onChange={handleFileChange} multiple></input>
                <button className="btn rounded-md z-10" onClick={selectedFiles.length !== 0 ? processImages : () => document.getElementById('fileID').click()}>
                  {selectedFiles.length !== 0 ? 'Process Images' : 'Upload Images'}
                </button>
              </div>
            </div>
          </div>
        )}

        {annotatedImageSrcs.length !== 0 && (
          <div className='text-center '>
            <div className='font-semibold text-xl mb-4'> <h2>{`--Annotated Image--`}</h2></div>
            <div className='flex justify-center items-center'>
              <div className='max-w-lg'>
                <Carousel>
                  {annotatedImageSrcs.map(({ name, processedImage }) => (
                    <img key={name} src={processedImage} alt={`Annotated ${name}`} />
                  ))}
                </Carousel>
              </div>
            </div>
          </div>
        )}

        {annotatedImageSrcs.length !== 0 && <div className='w-full h-1 bg-black my-12 rounded-md' />}

        {annotatedImageSrcs.length !== 0 && (
          <div>
            <div className='text-center text-xl font-semibold'>
              <p className='text-2xl'>Didn&apos;t like the annotation ?</p>
              <p className='my-4'>Annotate Here Manually👇</p>
              {manuallyAnnotated && <p className='my-4 text-xl font-semibold'>--Find the file in the Downloads/manual-annotaions--</p>}
            </div>
              <ReactImageAnnotate
                labelImages
                enabledTools={['create-box']}
                regionClsList={['Question', 'Figure']}
                regionTagList={['tag1', 'tag2', 'tag3']}
                onExit={(data) => handleImageAnnotateExit(data)}
                onNextImage={handleNextImage}
                onPrevImage={handlePrevImage}
                selectedImage={currentImageIndex}
                images={selectedFiles.map((file) => ({
                  src: URL.createObjectURL(file),
                  name: file.name.length > 10 ? file.name.slice(0, 30) + '...' : file.name,
                  regions: [],
                }))}
                
              />
          </div>
        )}
        </div>
      </>
  );
}

export default FileInput;
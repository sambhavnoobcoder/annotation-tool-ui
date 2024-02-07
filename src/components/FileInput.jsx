import { useState } from 'react';
import axios from 'axios';
import ReactImageAnnotate from 'react-image-annotate';

function FileInput() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [annotatedImageSrcs, setAnnotatedImageSrcs] = useState([]);
  const [manuallyAnnotated, setmanuallyAnnotated] = useState(false);

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
  
          return `${region.cls} ${x} ${y} ${width} ${height}`;
        })
        .join('\n');
  
      const response = await axios.post('http://127.0.0.1:5000/save_annotations', {
        imageFileName,
        annotationsContent,
      });
      setmanuallyAnnotated(true)
      
      console.log('Annotations saved successfully:', response.data);
    } catch (error) {
      console.log(error);
      setmanuallyAnnotated(false)
    }
  };

  console.log(manuallyAnnotated)

  return (
    <>
      <h1 className='text-3xl text-center font-semibold mt-8'>ByteLearn Image Annotator</h1>
    
      <div className='mt-8'>
        {annotatedImageSrcs.length==0 && <div className="container">
          <div className="card">
            <h3>Upload Files</h3>
            <div className="drop_box">
              <header>
                <h4>Select File here</h4>
              </header>
              <p>Files Supported: JPG, JPEG</p>
              <input type="file" accept=".jpg, .jpeg" id="fileID" onChange={handleFileChange} multiple></input>
              <button className="btn rounded-md z-10" onClick={selectedFiles.length !== 0 ? processImages : () => document.getElementById('fileID').click()}>
                {selectedFiles.length !== 0 ? 'Process Images' : 'Upload Images'}
              </button>
            </div>
          </div>
        </div>}

        {annotatedImageSrcs.map(({ name, annotatedImageSrc }, index) => (
          <div key={index} className='text-center'>
            <div className='font-semibold text-xl'> <h2>{`--Annotated Image--`}</h2></div>
            <img className='mx-auto mt-4' src={`http://127.0.0.1:5000/get_annotated_image/${annotatedImageSrc}`} alt={`Annotated ${name}`} />
          </div>
        ))}
        {/* <div className='line'></div> */}
       {annotatedImageSrcs.length!=0 && <div className='w-full h-1 bg-black my-12 rounded-md '/>}

        {annotatedImageSrcs.length!=0 && selectedFiles.map((file, index) => (
          <div key={index}>
            {/* <div className='label-selected-image'> <h2>{`Selected Image - ${file.name}`}</h2></div>
            <h4>{"the below window is is the annotation window facilitating the manual annotations in the image. Here's a brief overview of the features facilitated by the same :" }</h4> */}
            <div className='text-center text-xl font-semibold'>
            <p className='text-2xl'>Didn't like the annotation ?</p>
            <p className='my-4'>Annotate Here Manually👇</p>
            </div>
            <div className='w-3/4 mx-auto'>
            <ReactImageAnnotate
              labelImages
              regionClsList={['Question', 'Figure']}
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
            {manuallyAnnotated && <p className='my-4 text-xl fonti-semibold'>Find the file in the Downloads/manual-annotaions</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default FileInput;

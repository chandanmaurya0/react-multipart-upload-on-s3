'use client'

import React,{useState} from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Call your API to get the presigned URL
      const response = await axios.post('/api/getPresignedUrl', {
        fileName: file.name,
        fileType: file.type,
      });
      const { url } = response.data;

      // Use the presigned URL to upload the file
      const uploadResponse = await axios.put(url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.status === 200) {
        alert('File uploaded successfully.');
      } else {
        alert('Upload failed.');
      }
    } catch (error) {
      alert('Upload failed.');
    }
  };
  return (
    <div>
    <input type="file" onChange={handleFileChange} />
    <button onClick={handleUpload}>Upload File</button>
  </div>
  );
}

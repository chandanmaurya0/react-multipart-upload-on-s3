"use client";

import React, { useState } from "react";
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
      // check file size if it is less than 10MB
      if (file.size < 10000000) {
        // Call your API to get the presigned URL
        const response = await axios.post(
          "https://2vjzmhv7bp.ap-south-1.awsapprunner.com/generate-single-presigned-url",
          {
            fileName: file.name,
          }
        );
        const { url } = response.data;

        // Use the presigned URL to upload the file
        const uploadResponse = await axios.put(url, file, {
          headers: {
            "Content-Type": file.type,
          },
        });

        console.log("Uplaodresponse- ", uploadResponse);

        if (uploadResponse.status === 200) {
          alert("File uploaded successfully.");
        } else {
          alert("Upload failed.");
        }
      } else {
        // call multipart upload endpoint and get uploadId
        const response = await axios.post(
          "https://2vjzmhv7bp.ap-south-1.awsapprunner.com/start-multipart-upload",
          {
            fileName: file.name,
            contentType: file.type,
          }
        );

        // get uploadId
        let { uploadId } = response.data;
        console.log("UploadId- ", uploadId);

        // get total size of the file
        let totalSize = file.size;
        // set chunk size to 10MB
        let chunkSize = 10000000;
        // calculate number of chunks
        let numChunks = Math.ceil(totalSize / chunkSize);

        // generate presigned urls
        let presignedUrls_response = await axios.post(
          "https://2vjzmhv7bp.ap-south-1.awsapprunner.com/generate-presigned-url",
          {
            fileName: file.name,
            uploadId: uploadId,
            partNumbers: numChunks,
          }
        );

        let presigned_urls = presignedUrls_response?.data?.presignedUrls;

        console.log("Presigned urls- ", presigned_urls);

        // upload the file into chunks to different presigned url
        let parts: any = [];
        const uploadPromises = [];

        for (let i = 0; i < numChunks; i++) {
          let start = i * chunkSize;
          let end = Math.min(start + chunkSize, totalSize);
          let chunk = file.slice(start, end);
          let presignedUrl = presigned_urls[i];

          uploadPromises.push(
            axios.put(presignedUrl, chunk, {
              headers: {
                "Content-Type": file.type,
              },
            })
          );
        }

        const uploadResponses = await Promise.all(uploadPromises);

        uploadResponses.forEach((response, i) => {
          // existing response handling

          parts.push({
            etag: response.headers.etag,
            PartNumber: i + 1,
          });
        });

        console.log("Parts- ", parts);

        // make a call to multipart complete api
        let complete_upload = await axios.post(
          "https://2vjzmhv7bp.ap-south-1.awsapprunner.com/complete-multipart-upload",
          {
            fileName: file.name,
            uploadId: uploadId,
            parts: parts,
          }
        );

        console.log("Complete upload- ", complete_upload.data);

        // if upload is successful, alert user
        if (complete_upload.status === 200) {
          alert("File uploaded successfully.");
        } else {
          alert("Upload failed.");
        }
      }
    } catch (error) {
      alert("Upload failed.");
    }
  };
  return (
    <div>
      <h2>Multipart Upload</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
}

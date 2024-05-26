import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FaDownload } from "react-icons/fa";
import { storage } from "../../firebase"; // Ensure this path is correct
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  uploadBytes,
} from "firebase/storage";

const Files = () => {
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const storageRef = ref(storage, "files");
        const result = await listAll(storageRef);
        const filePromises = result.items.map(async (item) => {
          const downloadURL = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          return {
            name: metadata.name,
            type: metadata.contentType,
            size: metadata.size,
            url: downloadURL,
          };
        });
        const fetchedFiles = await Promise.all(filePromises);
        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
      setLoading(false);
    };

    fetchFiles();
  }, []);

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file: file,
      name: file.name,
      type: file.type,
    }));

    setLoading(true);

    for (const file of newFiles) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/svg+xml",
        "text/plain",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.type}`);
        continue;
      }

      // Cleanse file name
      const cleansedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      console.log(file);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `files/${cleansedName}`);
      try {
        await uploadBytes(storageRef, file.file, {
          contentType: file.type,
          contentDisposition: "attachment",
        });
        const downloadURL = await getDownloadURL(storageRef);
        const newFile = {
          name: cleansedName,
          type: file.type,
          size: file.file.size,
          url: downloadURL,
        };
        setFiles((prevFiles) => [...prevFiles, newFile]);
      } catch (error) {
        console.error("File upload failed:", error);
      }
    }

    setLoading(false);
  };

  const filteredFiles = files.filter((file) => {
    const fileType = file.type.split("/")[1];
    const matchesFilter =
      filter === "all" ||
      (filter === "other" &&
        ![
          "pdf",
          "png",
          "jpeg",
          "gif",
          "svg+xml",
          "plain",
          "vnd.ms-powerpoint",
          "vnd.openxmlformats-officedocument.presentationml.presentation",
          "vnd.ms-excel",
          "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "msword",
          "vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(fileType)) ||
      fileType === filter;
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Container>
      <Header>
        <Title>File Explorer</Title>
        <Controls>
          <SearchInput
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter>
            <label>
              Filter:
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="gif">GIF</option>
                <option value="svg">SVG</option>
                <option value="txt">Text</option>
                <option value="ppt">PPT</option>
                <option value="pptx">PPTX</option>
                <option value="xls">XLS</option>
                <option value="xlsx">XLSX</option>
                <option value="doc">DOC</option>
                <option value="docx">DOCX</option>
                <option value="other">Other</option>
              </select>
            </label>
          </Filter>
          <UploadButton>
            <input type="file" multiple onChange={handleFileUpload} />
            Upload Files
          </UploadButton>
        </Controls>
      </Header>
      {loading && (
        <Modal>
          <ModalContent>
            <LoadingSpinner />
            <p>Loading...</p>
          </ModalContent>
        </Modal>
      )}
      <FileList>
        {filteredFiles.map((file, index) => (
          <FileItem key={index}>
            <FileInfo>
              <span>{file.name}</span>
              <FileDetails>
                <span>{file.type}</span>
                <span>{(file.size / 1024).toFixed(2)} KB</span>
              </FileDetails>
            </FileInfo>
            <DownloadLink href={file.url} download>
              <DownloadIcon />
            </DownloadLink>
          </FileItem>
        ))}
      </FileList>
    </Container>
  );
};

export default Files;
const Container = styled.div`
  padding: 20px;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background: #f9f9f9;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 1.5em;
  color: #333;
  flex: 1 100%;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const SearchInput = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  flex: 1;
`;

const Filter = styled.div`
  label {
    font-size: 0.9em;
    color: #333;
    select {
      margin-left: 5px;
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
  }
`;

const UploadButton = styled.label`
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  input {
    display: none;
  }
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FileItem = styled.li`
  background: white;
  padding: 15px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileDetails = styled.div`
  display: flex;
  gap: 10px;
  font-size: 0.8em;
  color: #666;
`;

const DownloadLink = styled.a`
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
`;

const DownloadIcon = styled(FaDownload)`
  margin-left: 10px;
  color: #007bff;
  cursor: pointer;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 1.2em;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 200px;
  min-height: 100px;

  & > p {
    margin-left: 10px;
    font-size: 1em;
    color: #333;
  }
`;
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: ${spin} 1s linear infinite;
`;

// Keyframes for the loading spinner animation

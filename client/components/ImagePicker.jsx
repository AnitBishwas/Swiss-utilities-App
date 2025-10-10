import { useEffect, useState } from "react";
import { IconCross } from "./Icons";

const ImagePicker = ({ multiple, callback }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    let filesArray = [];
    for (const file of e.target.files) {
      filesArray.push(file);
    }
    setFiles(filesArray);
  };
  const handleFileRemove = (file) => {
    const correspondingFile = files.find((el) => el.name == file.name);
    const correspondingFileIndex = files.indexOf(correspondingFile);
    let newfilesArray = files.filter(
      (el, ind) => ind != correspondingFileIndex
    );
    setFiles(newfilesArray);
  };
  let renderImageComp = (file) => {
    return (
      <div key={file.name} style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            padding: "8px",
            border: "solid 1px #929292ff",
          }}
        >
          <img
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "auto",
            }}
            src={URL.createObjectURL(file)}
            width={50}
            height="auto"
          ></img>
        </div>
        <button
          onClick={() => {
            handleFileRemove(file);
          }}
          style={{
            position: "absolute",
            right: "0px",
            top: "0px",
            background: "transparent",
            padding: "0px",
            border: "0",
            transform: "translate(50%,-50%)",
            display: "flex",
            cursor: "pointer",
          }}
        >
          <IconCross />
        </button>
      </div>
    );
  };
  useEffect(() => {
    callback ? callback(files) : "";
  }, [files]);
  return (
    <>
      <label style={{ display: "flex" }}>
        <input
          type="file"
          style={{ display: "none" }}
          accept="image/png, image/jpeg, image/webp"
          multiple={multiple}
          onChange={handleFileChange}
        />
        {files.length == 0 && (
          <span style={{ cursor: "pointer" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={26}
              height={26}
              fill="none"
              viewBox="0 0 96 96"
              id="image-add"
            >
              <circle cx={35} cy={31} r={6} stroke="#000" strokeWidth={5} />
              <path
                stroke="#000"
                strokeLinecap="round"
                strokeWidth={5}
                d="M68 16L86 16M77 7L77 25M52.5 9H24C15.7157 9 9 15.7157 9 24V71C9 79.2843 15.7157 86 24 86H71C79.2843 86 86 79.2843 86 71V52.5 49.3137C86 47.192 85.1571 45.1571 83.6569 43.6569L79.182 39.182C77.4246 37.4246 74.5754 37.4246 72.818 39.182L51.682 60.318C49.9246 62.0754 47.0754 62.0754 45.318 60.318L39.682 54.682C37.9246 52.9246 35.0754 52.9246 33.318 54.682L11 77"
              />
            </svg>
          </span>
        )}
      </label>
      {files.length > 0 && (
        <div style={{ display: "flex", gap: "10px" }}>
          {files.map((file) => renderImageComp(file))}
        </div>
      )}
    </>
  );
};

export default ImagePicker;

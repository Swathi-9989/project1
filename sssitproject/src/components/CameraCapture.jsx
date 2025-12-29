import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { convertToWebP } from "../utils/convertToWebp";

export default function CameraCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Give camera time to initialize
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const capturePhoto = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const pngFile = new File([blob], "captured.png", { type: "image/png" });

    const webpFile = await convertToWebP(pngFile);

    onCapture(webpFile, URL.createObjectURL(webpFile));

    // ✅ IMPORTANT: Remove focus before closing modal
    document.activeElement?.blur();

    onClose();
  };

  const handleClose = () => {
    // ✅ Remove focus before closing modal
    document.activeElement?.blur();
    onClose();
  };

  return (
    <div className="modal-content p-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold mb-0">Capture Photo</h5>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleClose}
        />
      </div>

      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/png"
        screenshotQuality={1}
        videoConstraints={{
          facingMode: "environment",
          width: 640,
          height: 480,
        }}
        className="w-100 rounded-3"
      />

      {/* Capture Button */}
      <div className="text-center mt-3">
        <button
          type="button"
          className="btn btn-primary px-4"
          onClick={capturePhoto}
          disabled={!isReady}
        >
          {isReady ? "Capture" : "Starting camera..."}
        </button>
      </div>
    </div>
  );
}

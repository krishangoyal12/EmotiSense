import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import MoodIcon from "@mui/icons-material/Mood";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import "./styles.css";

const emotionIcons = {
  happy: <SentimentVerySatisfiedIcon color="warning" fontSize="large" />,
  sad: <SentimentDissatisfiedIcon color="primary" fontSize="large" />,
  angry: <SentimentVeryDissatisfiedIcon color="error" fontSize="large" />,
  neutral: <SentimentNeutralIcon color="action" fontSize="large" />,
  surprised: <MoodIcon color="secondary" fontSize="large" />,
  fearful: <SentimentSatisfiedAltIcon color="info" fontSize="large" />,
  disgusted: <SentimentDissatisfiedIcon color="success" fontSize="large" />,
};

export default function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const imageRef = useRef();
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [showEmotion, setShowEmotion] = useState("");
  const [showIcon, setShowIcon] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImg, setUploadedImg] = useState(null);

  // Sync canvas size to match video or image
  const syncCanvasToMedia = (media) => {
    if (media && canvasRef.current) {
      canvasRef.current.width = media.videoWidth || media.width;
      canvasRef.current.height = media.videoHeight || media.height;
    }
  };

  const loadModels = async () => {
    setLoading(true);
    const MODEL_URL = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    setIsModelsLoaded(true);
    setLoading(false);
  };

  const startApp = async () => {
    if (!isModelsLoaded) await loadModels();
    setIsRunning(true);
    setShowEmotion("");
    setShowIcon(null);
    setUploadedImg(null);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    videoRef.current.onloadedmetadata = () => {
      syncCanvasToMedia(videoRef.current);
    };

    const id = setInterval(async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        isModelsLoaded
      ) {
        syncCanvasToMedia(videoRef.current);
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (detections.length > 0) {
          faceapi.draw.drawDetections(canvasRef.current, detections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, detections);

          const expressions = detections[0].expressions;
          const sorted = Object.entries(expressions).sort(
            (a, b) => b[1] - a[1]
          );
          const [emotion, confidence] = sorted[0];

          setShowEmotion(
            `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${(
              confidence * 100
            ).toFixed(1)}%)`
          );
          setShowIcon(emotionIcons[emotion] || null);
        } else {
          setShowEmotion("");
          setShowIcon(null);
        }
      }
    }, 200);

    setIntervalId(id);
  };

  const stopApp = () => {
    setIsRunning(false);
    setShowEmotion("");
    setShowIcon(null);
    if (intervalId) clearInterval(intervalId);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSnapshot = () => {
    if (!isRunning) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    // Draw overlay
    ctx.drawImage(canvasRef.current, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "emotion-snapshot.png";
    link.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImg(URL.createObjectURL(file));
    setShowEmotion("");
    setShowIcon(null);

    if (!isModelsLoaded) {
      setLoading(true);
      await loadModels();
      setLoading(false);
    }
    // Wait for image to load before detection
    setTimeout(async () => {
      if (imageRef.current) {
        syncCanvasToMedia(imageRef.current);
        const detections = await faceapi
          .detectAllFaces(
            imageRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (detections.length > 0) {
          faceapi.draw.drawDetections(canvasRef.current, detections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, detections);

          const expressions = detections[0].expressions;
          const sorted = Object.entries(expressions).sort(
            (a, b) => b[1] - a[1]
          );
          const [emotion, confidence] = sorted[0];
          setShowEmotion(
            `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${(
              confidence * 100
            ).toFixed(1)}%)`
          );
          setShowIcon(emotionIcons[emotion] || null);
        } else {
          setShowEmotion("No face detected");
          setShowIcon(null);
        }
      }
    }, 300);
  };

  return (
    <div className="app">
      <h1>Emotion Detector</h1>
      <div className="video-container" style={{ position: "relative" }}>
        {!isRunning && !uploadedImg ? (
          <div className="video-placeholder">
            <span className="placeholder-icon" role="img" aria-label="camera">
              📷
            </span>
            Camera not started
          </div>
        ) : isRunning ? (
          <>
            <video
              ref={videoRef}
              width={480}
              height={360}
              autoPlay
              muted
              style={{ borderRadius: "10px" }}
              onLoadedMetadata={() => syncCanvasToMedia(videoRef.current)}
            />
            <canvas
              ref={canvasRef}
              className="overlay"
              style={{
                pointerEvents: "none",
                position: "absolute",
                left: 0,
                top: 0,
              }}
            />
          </>
        ) : (
          uploadedImg && (
            <>
              <img
                ref={imageRef}
                src={uploadedImg}
                alt="Uploaded"
                width={480}
                height={360}
                style={{ borderRadius: "10px", objectFit: "cover" }}
                onLoad={() => syncCanvasToMedia(imageRef.current)}
              />
              <canvas
                ref={canvasRef}
                className="overlay"
                style={{
                  pointerEvents: "none",
                  position: "absolute",
                  left: 0,
                  top: 0,
                }}
              />
            </>
          )
        )}
      </div>
      <div className="emotion-label">
        {showIcon}
        {showEmotion && <span style={{ marginLeft: 10 }}>{showEmotion}</span>}
      </div>
      <div className="controls">
        {!isRunning ? (
          <>
            <button className="start-btn" onClick={startApp} disabled={loading}>
              {loading ? "Loading..." : "Start Camera"}
            </button>
            <input
              type="file"
              accept="image/*"
              style={{ marginLeft: 10 }}
              onChange={handleImageUpload}
              disabled={loading}
            />
            {uploadedImg && (
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  setUploadedImg(null);
                  setShowEmotion("");
                  setShowIcon(null);
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    ctx.clearRect(
                      0,
                      0,
                      canvasRef.current.width,
                      canvasRef.current.height
                    );
                  }
                }}
              >
                Clear Image
              </button>
            )}
          </>
        ) : (
          <>
            <button className="stop-btn" onClick={stopApp}>
              Stop
            </button>
             <button onClick={handleSnapshot}>Snapshot</button>
          </>
        )}
      </div>
    </div>
  );
}
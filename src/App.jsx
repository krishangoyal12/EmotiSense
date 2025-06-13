import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button, Box, Typography, CircularProgress, Paper, Fade } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import MoodIcon from "@mui/icons-material/Mood";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";

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
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [showEmotion, setShowEmotion] = useState("");
  const [showIcon, setShowIcon] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ensure canvas always matches video size
  const syncCanvasToVideo = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  };

  const loadModels = async () => {
    const MODEL_URL = "/models";
    setLoading(true);
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setIsModelsLoaded(true);
    } catch (error) {
      console.error("Model loading error:", error);
    }
    setLoading(false);
  };

  const startApp = async () => {
    if (!isModelsLoaded) {
      await loadModels();
    }

    setIsRunning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      videoRef.current.srcObject = stream;

      // Wait for video to play and sync canvas size
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        syncCanvasToVideo();
      };

      const id = setInterval(async () => {
        if (
          !videoRef.current ||
          videoRef.current.paused ||
          videoRef.current.ended
        )
          return;

        syncCanvasToVideo();

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const canvas = canvasRef.current;
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };

        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (resizedDetections[0]?.expressions) {
          const sorted = Object.entries(resizedDetections[0].expressions).sort(
            (a, b) => b[1] - a[1]
          );
          const emotion = sorted[0][0];
          setShowEmotion(
            `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${(sorted[0][1] * 100).toFixed(1)}%)`
          );
          setShowIcon(emotionIcons[emotion] || <MoodIcon fontSize="large" />);
        }
      }, 100);

      setIntervalId(id);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopApp = () => {
    setIsRunning(false);
    clearInterval(intervalId);
    setIntervalId(null);
    setShowEmotion("");
    setShowIcon(null);

    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSnapshot = () => {
    syncCanvasToVideo();
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "snapshot.png";
    link.click();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f4f6fb 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 500,
          width: "100%",
          mx: "auto",
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <Typography variant="h4" align="center" color="primary" gutterBottom fontWeight={700}>
          Real-Time Emotion Detector
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {!isRunning ? (
            <Button
              onClick={startApp}
              variant="contained"
              color="success"
              size="large"
              startIcon={<PlayArrowIcon />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Start"}
            </Button>
          ) : (
            <Button
              onClick={stopApp}
              variant="contained"
              color="error"
              size="large"
              startIcon={<StopIcon />}
              sx={{ minWidth: 120 }}
            >
              Stop
            </Button>
          )}
          <Button
            onClick={handleSnapshot}
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<CameraAltIcon />}
            disabled={!isRunning}
            sx={{
              opacity: isRunning ? 1 : 0.5,
              cursor: isRunning ? "pointer" : "not-allowed",
              minWidth: 150,
            }}
          >
            Take Snapshot
          </Button>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            background: "#222",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 2,
            mx: "auto",
            mb: 2,
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
              background: "#222",
            }}
            onLoadedMetadata={syncCanvasToVideo}
            onPlay={syncCanvasToVideo}
          />
          <canvas
            ref={canvasRef}
            className="overlay"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
          <Fade in={isRunning && Boolean(showEmotion)}>
            <Box
              sx={{
                position: "absolute",
                left: 16,
                bottom: 16,
                background: "rgba(255,255,255,0.92)",
                color: "#222",
                px: 3,
                py: 2,
                borderRadius: 2,
                fontWeight: "bold",
                fontSize: "1.2rem",
                boxShadow: 2,
                minWidth: "160px",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              {showIcon}
              <span>{showEmotion}</span>
            </Box>
          </Fade>
        </Box>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Powered by face-api.js & Material UI
        </Typography>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.7)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}
          >
            <CircularProgress size={48} color="primary" />
          </Box>
        )}
      </Paper>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 4,
          mb: 4,
          display: "block",
        }}
      >
        &copy; {new Date().getFullYear()} Emotion Detector App
      </Typography>
    </Box>
  );
}
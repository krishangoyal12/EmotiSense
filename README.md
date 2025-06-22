# Real-Time Emotion Detector

A web application that detects human emotions in real-time using your webcam or from uploaded images, powered by [face-api.js](https://github.com/justadudewhohacks/face-api.js) and [Material UI](https://mui.com/).

## Features

- Real-time face detection and emotion recognition via webcam
- Emotion detection from uploaded images
- Visual overlay of detected faces, landmarks, and emotion probabilities
- Snapshot functionality to capture and download current video frame
- Responsive, modern UI with Material UI components

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/emotion-detector.git
   cd emotion-detector
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Download face-api.js models:**

   - Download the following models from [face-api.js models repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):
     - `ssd_mobilenetv1_model-weights_manifest.json` and related files
     - `face_landmark_68_model-weights_manifest.json` and related files
     - `face_expression_model-weights_manifest.json` and related files
   - Place all model files in a `/models` directory at the project root (`emotion-detector/models`).

4. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser:**
   - Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

## Usage

- **Webcam Detection:**
  - Click **Start Camera** to enable your webcam and begin emotion detection.
  - The app will display detected faces, landmarks, and the most probable emotion.
  - Click **Take Snapshot** to download the current frame as an image.
  - Click **Stop** to turn off the webcam and emotion detection.

- **Image Upload Detection:**
  - Use the file input to upload an image from your device.
  - The app will automatically analyze the image and display the detected emotion.
  - Click **Clear Image** to remove the uploaded image.

## Project Structure

```
emotion-detector/
├── models/           # face-api.js model files (not included, see above)
├── src/
│   └── App.jsx       # Main React component
├── public/
├── package.json
└── README.md
```

## Technologies Used

- [React](https://react.dev/)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [Material UI](https://mui.com/)
- [Vite](https://vitejs.dev/)

## Credits

- Face detection and emotion recognition by [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- UI components by [Material UI](https://mui.com/)

## Deployed on netlify :- 
https://real-time-emotion-detector.netlify.app/
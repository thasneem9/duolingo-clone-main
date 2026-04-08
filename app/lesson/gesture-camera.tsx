  "use client";

  import { useEffect, useState, useRef } from "react";
  import Webcam from "react-webcam";
  import {
    FilesetResolver,
    HandLandmarker,
    HandLandmarkerResult,
  } from "@mediapipe/tasks-vision";
  import { useGestureSentence } from "@/hooks/useGestureSentence";


import * as tf from "@tensorflow/tfjs";
import { trainModel } from "@/lib/gestures/ml/train";
import data from "@/lib/gestures/ml/dataset.json";

  type Props = {
    expectedGesture: string;
    onResult: (correct: boolean) => void;
  };

  export const GestureCamera = ({ expectedGesture, onResult }: Props) => {

    const webcamRef = useRef<Webcam>(null);
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const latestGesture = useRef<boolean | null>(null);
    const { process, result } = useGestureSentence();
  const [clicked, setClicked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modelLoadedRef = useRef(false);
  const handleCapture = () => {
    if (expectedGesture === "SENTENCE") return; 
    if (clicked) return; // prevent multiple clicks
    setClicked(true);
    checkGesture();
  };
useEffect(() => {
  if (modelLoadedRef.current) return;

  const initModel = async () => {
    try {
      console.log("🧠 Training ML model...");
      console.log("DATA SIZE:", data.length); // 👈 ADD THIS

      const model = await trainModel(data);

      console.log("MODEL CREATED:", model); // 👈 ADD THIS

      (window as any).model = model;
      (window as any).tf = tf;

      modelLoadedRef.current = true;

      console.log("✅ ML model ready");
    } catch (err) {
      console.error("❌ MODEL ERROR:", err);
    }
  };

  initModel();
}, []);
  useEffect(() => {
    let running = true;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task",
        },
        numHands: 1,
        runningMode: "VIDEO",
      });

      landmarkerRef.current = landmarker;

      const detect = () => {
        if (!running) return;

        const video = webcamRef.current?.video;

        if (!video || !landmarkerRef.current || video.readyState < 2) {
          requestAnimationFrame(detect);
          return;
        }

        const results = landmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (canvas && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);


  // ✅ START HERE
  if (results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];

    const gesture = expectedGesture?.trim();

    // 🧠 SENTENCE MODE
  if (gesture === "SENTENCE") {
  console.log("📊 Running sentence detection...");
  process(landmarks);
}

    // ✋ SINGLE GESTURE MODE
    else {
      const indexUp = landmarks[8].y < landmarks[6].y;
      const middleUp = landmarks[12].y < landmarks[10].y;
      const ringUp = landmarks[16].y < landmarks[14].y;
      const pinkyUp = landmarks[20].y < landmarks[18].y;
      const thumbUp = landmarks[4].y < landmarks[3].y;

      const palmFacing =
        Math.abs(landmarks[5].x - landmarks[17].x) > 0.04;

      let correct = false;

      if (gesture === "8") {
        correct =
          palmFacing &&
          thumbUp &&
          indexUp &&
          middleUp &&
          !ringUp &&
          !pinkyUp;
      }

      if (gesture === "0") {
        correct =
          !thumbUp &&
          !indexUp &&
          !middleUp &&
          !ringUp &&
          !pinkyUp;
      }

      if (!clicked) {
        latestGesture.current = correct;
      }
    }

    // 🎨 DRAWING (IMPORTANT: stays inside)
   ctx.strokeStyle =
  expectedGesture === "SENTENCE"
    ? "#00BFFF" // blue for sentence mode
    : latestGesture.current
    ? "#00FF00"
    : "#FF4444";
    ctx.lineWidth = 3;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];

    connections.forEach(([a,b]) => {
      ctx.beginPath();
      ctx.moveTo(
        landmarks[a].x * canvas.width,
        landmarks[a].y * canvas.height
      );
      ctx.lineTo(
        landmarks[b].x * canvas.width,
        landmarks[b].y * canvas.height
      );
      ctx.stroke();
    });

    landmarks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(
        p.x * canvas.width,
        p.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "red";
      ctx.fill();
    });
  }
  // ✅ END HERE


        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    init();

    return () => {
      running = false;
    };
  }, [expectedGesture]);
    useEffect(() => {
    setClicked(false);
    latestGesture.current = null;
  }, [expectedGesture]);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (expectedGesture !== "SENTENCE") return;
    if (triggeredRef.current) return;

    if (result === "correct") {
      triggeredRef.current = true;
      onResult(true);
    } else if (result === "incorrect") {
      triggeredRef.current = true;
      onResult(false);
    }
  }, [result]);

  useEffect(() => {
    triggeredRef.current = false;
  }, [expectedGesture]);
  const checkGesture = () => {
    console.log("📸 CHECK pressed");

    if (latestGesture.current === null) {
      console.log("❌ No gesture detected");
      onResult(false);
      return;
    }

    console.log("🤚 Gesture detected:", latestGesture.current);
    onResult(latestGesture.current);
  };

    return (
      <div className="flex flex-col items-center gap-3">
      <div className="relative">
    <Webcam ref={webcamRef} mirrored className="rounded-xl w-72" />
  <canvas
    ref={canvasRef}
    className="absolute top-0 left-0 w-72 h-full scale-x-[-1]"
  />
  </div>

      <button
    onClick={handleCapture}
    disabled={clicked}
    className={`px-4 py-2 rounded-lg text-white transition
      ${clicked ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
    `}
  >
    {clicked ? "Captured" : "Capture"}
  </button>
      </div>
    );
  };
"use client";

import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useGestureSentence } from "@/hooks/useGestureSentence";

import * as tf from "@tensorflow/tfjs";
import { trainModel } from "@/lib/gestures/ml/train";
import data from "@/lib/gestures/ml/dataset.json";
import facts from "@/lib/gestures/ml/facts.json";

type Props = {
  expectedGesture: string;
  onResult: (correct: boolean) => void;
};

export const GestureCamera = ({ expectedGesture, onResult }: Props) => {
  const [modelReady, setModelReady] = useState(false);
  const [fact, setFact] = useState("");

  const webcamRef = useRef<Webcam>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const { process, result, sequence } = useGestureSentence();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelLoadedRef = useRef(false);

  // ✅ RANDOM FACT
  useEffect(() => {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    setFact(randomFact);
  }, []);

  // ✅ MODEL INIT
  useEffect(() => {
    if (modelLoadedRef.current) return;

    const initModel = async () => {
      try {
        const model = await trainModel(data);

        (window as any).model = model;
        (window as any).tf = tf;

        modelLoadedRef.current = true;
        setModelReady(true);
      } catch (err) {
        console.error("❌ MODEL ERROR:", err);
      }
    };

    initModel();
  }, []);

  // ✅ DETECTION
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

          if (results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];

            if (expectedGesture === "SENTENCE") {
              process(landmarks);
            }

            // ✅ DRAW FULL SKELETON
            ctx.strokeStyle = "#8B5CF6"; // purple
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

            // points
            landmarks.forEach((p) => {
              ctx.beginPath();
              ctx.arc(
                p.x * canvas.width,
                p.y * canvas.height,
                4,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = "#EF4444";
              ctx.fill();
            });
          }
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

  // ================= UI =================

  if (!modelReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
        <div className="text-3xl font-extrabold text-purple-600 animate-pulse">
          Setting things up...
        </div>

        <div className="mt-4 text-lg text-gray-600 max-w-md">
          {fact}
        </div>

        <div className="mt-6 w-40 h-2 bg-purple-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 animate-pulse w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 items-center">

      {/* LEFT: CAMERA */}
      <div className="flex justify-center">
        <div className="relative">
          <Webcam ref={webcamRef} mirrored className="rounded-xl w-80" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-80 h-full scale-x-[-1]"
          />
        </div>
      </div>

      {/* RIGHT: CHARACTER */}
      <div className="relative flex flex-col items-center">

        {/* CHAT BUBBLE */}
        <div className="absolute top-0 right-10 w-60 z-10">
          <img src="/chatbubble.png" className="w-full" />

          <div className="absolute inset-0 flex items-center justify-center px-4 text-center font-bold text-black">
            {sequence.length === 0
              ? "Try signing..."
              : sequence.join(", ")}
          </div>
        </div>

       <img src="/boy.png" className="w-64 h-[420px] object-contain mt-20" />
      </div>
    </div>
  );
};
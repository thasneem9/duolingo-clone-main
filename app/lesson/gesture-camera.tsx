"use client";

import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

type Props = {
  target: string;
  onGesture: (correct: boolean) => void;
};

export const GestureCamera = ({ target, onGesture }: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const latestGesture = useRef<boolean | null>(null);
const [clicked, setClicked] = useState(false);

const handleCapture = () => {
  if (clicked) return; // prevent multiple clicks
  setClicked(true);
  checkGesture();
};
  useEffect(() => {
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
        const video = webcamRef.current?.video;

        if (!video || !landmarkerRef.current || video.readyState < 2) {
          requestAnimationFrame(detect);
          return;
        }

        const results: HandLandmarkerResult =
          landmarkerRef.current.detectForVideo(video, performance.now());

        if (results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          const indexUp = landmarks[8].y < landmarks[6].y;
          const middleUp = landmarks[12].y < landmarks[10].y;
          const ringUp = landmarks[16].y < landmarks[14].y;
          const pinkyUp = landmarks[20].y < landmarks[18].y;
          const thumbUp = landmarks[4].y < landmarks[3].y;

          const palmFacing = Math.abs(landmarks[5].x - landmarks[17].x) > 0.04;

          const correct =
            target === "8" &&
            palmFacing &&
            thumbUp &&
            indexUp &&
            middleUp &&
            !ringUp &&
            !pinkyUp;

          latestGesture.current = correct;
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    init();
  }, [target]);

  const checkGesture = () => {
    if (latestGesture.current === null) {
      onGesture(false);
      return;
    }

    onGesture(latestGesture.current);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Webcam ref={webcamRef} mirrored className="rounded-xl w-72" />

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
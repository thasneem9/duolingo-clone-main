"use client";

import { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

type Props = {
  target: string;
  onCorrect: () => void;
};

export const GestureCamera = ({ target, onCorrect }: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

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

    const detect = async () => {
  const video = webcamRef.current?.video;

  if (
    !video ||
    !landmarkerRef.current ||
    video.readyState < 2   // video not ready yet
  ) {
    requestAnimationFrame(detect);
    return;
  }

  const results: HandLandmarkerResult =
    landmarkerRef.current.detectForVideo(video, performance.now());

        if (results.landmarks.length > 0) {
          console.log("hand detected", results.landmarks);

          // For now just detect ANY hand to prove ML works
          // Later we check finger positions for "8"
          onCorrect();
          return;
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    init();
  }, [onCorrect]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Webcam ref={webcamRef} mirrored className="rounded-xl w-72" />

      <p className="text-sm text-gray-500">
        Show the sign for {target}
      </p>
    </div>
  );
};
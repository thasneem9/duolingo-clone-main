import { getMovement } from "./utils";

export function detectNameGesture(landmarks: any[], history: any[][]) {
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;

  const isPeace = indexUp && middleUp;

  const xMove = getMovement(history, "x");

  const sliding = Math.abs(xMove) > 0.05;

  return {
    detected: isPeace && sliding,
    confidence: isPeace ? Math.min(Math.abs(xMove) * 10, 1) : 0,
  };
}
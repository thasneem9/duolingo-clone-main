import { getMovement } from "./utils";

export function detectWhatGesture(landmarks: any[], history: any[][]) {
  if (history.length < 5) return { detected: false, confidence: 0 };

  const zMove = getMovement(history, "z");

  const detected = Math.abs(zMove) > 0.05;

  return {
    detected,
    confidence: Math.min(Math.abs(zMove) * 10, 1),
  };
}
import { isOscillating } from "./utils";

export function detectNameGesture(landmarks: any[], history: any[][]) {
  const fingersUp =
    landmarks[8].y < landmarks[6].y &&
    landmarks[12].y < landmarks[10].y &&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y;

  const oscillating = isOscillating(history, "x");

  return {
    detected: fingersUp && oscillating,
    confidence: oscillating ? 0.9 : 0,
  };
}
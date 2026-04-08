import { isOscillating } from "./utils";

export function detectWhatGesture(landmarks: any[], history: any[][]) {
  // fingers extended
  const fingersUp =
    landmarks[8].y < landmarks[6].y &&
    landmarks[12].y < landmarks[10].y &&
    landmarks[16].y < landmarks[14].y &&
    landmarks[20].y < landmarks[18].y;

  // 👉 back of hand facing camera (opposite of palmFacing)
  const palmFacing =
    Math.abs(landmarks[5].x - landmarks[17].x) > 0.04;

  const backFacing = !palmFacing;

  const oscillating = isOscillating(history, "x");

  return {
    detected: fingersUp && backFacing && oscillating,
    confidence: oscillating ? 0.9 : 0,
  };
}
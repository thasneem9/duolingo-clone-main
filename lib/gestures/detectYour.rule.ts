import { isOscillating } from "./utils";

// Helper: check if all fingers are folded (fist-like)
const areFingersClosed = (landmarks: any[]) => {
  return (
    landmarks[8].y > landmarks[6].y &&   // index
    landmarks[12].y > landmarks[10].y && // middle
    landmarks[16].y > landmarks[14].y && // ring
    landmarks[20].y > landmarks[18].y    // pinky
  );
};

// Helper: palm roughly facing camera
const isPalmFacing = (landmarks: any[]) => {
  return Math.abs(landmarks[5].x - landmarks[17].x) > 0.04;
};

// 🔥 MAIN DETECTOR
export function detectYourGesture(landmarks: any[], history: any[][]) {
  if (history.length < 8) {
    return { detected: false, confidence: 0 };
  }

  // 1. Shape
  const palmFacing = isPalmFacing(landmarks);
  const fingersClosed = areFingersClosed(landmarks);

  // 2. Motion (real knocking = oscillation in Z)
  const knocking = isOscillating(history, "z");

  // Debug logs (VERY useful)
  console.log("---- YOUR DEBUG ----");
  console.log("PalmFacing:", palmFacing);
  console.log("FingersClosed:", fingersClosed);
  console.log("Knocking(Z oscillation):", knocking);

  const detected = palmFacing && fingersClosed && knocking;

  return {
    detected,
    confidence: detected ? 0.9 : 0,
  };
}
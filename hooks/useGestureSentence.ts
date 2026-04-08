import { useRef, useState } from "react";
import { HistoryBuffer } from "@/lib/gestures/history";
import { detectWhatGesture } from "@/lib/gestures/detectWhat.rule";
import { detectYourGesture } from "@/lib/gestures/detectYour.rule";
import { detectNameGesture } from "@/lib/gestures/detectName.rule";
import { GestureSequence, validateSentence } from "@/lib/gestures/sequence";


export const useGestureSentence = () => {
  const MODE: "RULES" | "ML" = "ML"; // 🔁 switch anytime

const RECORDING = false;
const RECORD_LABEL = "NAME"; // only YOUR for now
const datasetRef = useRef<any[]>([]);

  const history = useRef(new HistoryBuffer(25));
  const sequence = useRef(new GestureSequence());

  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const downloadDataset = () => {
  const blob = new Blob(
    [JSON.stringify(datasetRef.current)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gesture-data.json";
  a.click();
};
(window as any).downloadData = downloadDataset;
  const process = (landmarks: any[]) => {
    history.current.add(landmarks);
    const hist = history.current.get();
    if (RECORDING && hist.length >= 20) {
  const sample = hist
    .slice(-20)
    .map(frame => frame.flatMap(p => [p.x, p.y, p.z]));

  datasetRef.current.push({
    input: sample,
    label: RECORD_LABEL,
  });

  console.log("📦 Recorded:", datasetRef.current.length);
}


    let best: { label: string; confidence: number } | null = null;

    // ================= RULES MODE =================
    if (MODE === "RULES") {
      const what = detectWhatGesture(landmarks, hist);
      const your = detectYourGesture(landmarks, hist);
      const name = detectNameGesture(landmarks, hist);

      const candidates = [
        { label: "WHAT", ...what },
        { label: "YOUR", ...your },
        { label: "NAME", ...name },
      ];

      console.log("---- FRAME (RULES) ----");
      console.log("WHAT:", what);
      console.log("YOUR:", your);
      console.log("NAME:", name);

      best = candidates
        .filter((c) => c.detected)
        .sort((a, b) => b.confidence - a.confidence)[0] || null;
    }

    // ================= ML MODE =================
  if (MODE === "ML") {
  const input = hist
    .slice(-20)
    .map(frame => frame.flatMap(p => [p.x, p.y, p.z]))
    .flat();

  console.log("ML input length:", input.length);
  console.log("MODEL:", (window as any).model);

  if (!(window as any).model) {
  console.log("⏳ Waiting for model...");
  return;
}

if (
  input.length === 20 * 63 &&
  (window as any).tf
) {
        const prediction = (window as any).model.predict(
          (window as any).tf.tensor([input])
        );

        const probs = prediction.dataSync();

        const labels = ["WHAT", "YOUR", "NAME"];
        const index = probs.indexOf(Math.max(...probs));

        best = {
          label: labels[index],
          confidence: probs[index],
        };

        console.log("---- FRAME (ML) ----");
        console.log("Prediction:", labels[index], probs);
      }
    }

    // ================= APPLY RESULT =================
    if (best && best.confidence > 0.6) {
      setCurrentGesture(best.label);

      const last = sequence.current.get().slice(-1)[0];

      if (last !== best.label) {
        sequence.current.add(best.label);
      }

      console.log("Sequence:", sequence.current.get());
    }

    // ================= VALIDATE SENTENCE =================
    const seq = sequence.current.get();

    if (seq.length === 3) {
      const res = validateSentence(seq);
      setResult(res);
    }
  };

  return {
    process,
    currentGesture,
    sequence: sequence.current.get(),
    result,
  };
};
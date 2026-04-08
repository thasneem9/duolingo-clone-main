import { useRef, useState } from "react";
import { HistoryBuffer } from "@/lib/gestures/history";
import { GestureSequence } from "@/lib/gestures/sequence";

export const useGestureSentence = () => {
  const history = useRef(new HistoryBuffer(25));
  const sequence = useRef(new GestureSequence());

  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [finalSentence, setFinalSentence] = useState<string | null>(null);

  // 🧠 stability system
  const stableGestureRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  const REQUIRED_STABLE_FRAMES = 5; // 🔥 tune this (4–7 ideal)

  const process = (landmarks: any[]) => {
    if (result !== null) return; // stop after result

    history.current.add(landmarks);
    const hist = history.current.get();

    const input = hist
      .slice(-20)
      .map(frame => frame.flatMap(p => [p.x, p.y, p.z]))
      .flat();

    if (
      input.length !== 20 * 63 ||
      !(window as any).model ||
      !(window as any).tf
    ) return;

    const prediction = (window as any).model.predict(
      (window as any).tf.tensor([input])
    );

    const probs = prediction.dataSync();
    const labels = ["WHAT", "YOUR", "NAME"];
    const index = probs.indexOf(Math.max(...probs));

    const detectedLabel = labels[index];
    const confidence = probs[index];

    // 🔥 ignore weak predictions
    if (confidence < 0.7) return;

    // ================= STABILITY LOGIC =================
    if (stableGestureRef.current === detectedLabel) {
      stableCountRef.current++;
    } else {
      stableGestureRef.current = detectedLabel;
      stableCountRef.current = 1;
    }

    // wait until stable
    if (stableCountRef.current < REQUIRED_STABLE_FRAMES) return;

    // ================= ACCEPT GESTURE =================
    const last = sequence.current.get().slice(-1)[0];

    if (last === detectedLabel) return; // avoid duplicates

    // 🔥 START ONLY WITH "YOUR"
    if (sequence.current.get().length === 0 && detectedLabel !== "YOUR") {
      return; // ignore random start
    }

    // 🔥 LIMIT TO 3
    if (sequence.current.get().length >= 3) return;

    sequence.current.add(detectedLabel);
    setCurrentGesture(detectedLabel);

    console.log("✅ Stable Gesture:", detectedLabel);
    console.log("Sequence:", sequence.current.get());

    // ================= VALIDATION =================
    const seq = sequence.current.get();
    const TARGET = ["YOUR", "NAME", "WHAT"];

    for (let i = 0; i < seq.length; i++) {
      if (seq[i] !== TARGET[i]) {
        console.log("❌ Wrong order:", seq);

        setResult("incorrect");

        // reset everything
        sequence.current.reset();
        stableGestureRef.current = null;
        stableCountRef.current = 0;

        return;
      }
    }

    // ✅ FULL CORRECT
  if (seq.length === TARGET.length) {
  console.log("🎉 Sequence complete");

  // 🧠 show final sentence first
  setFinalSentence("What is your name?");

  // delay success trigger
  setTimeout(() => {
    setResult("correct");

    // reset everything
    sequence.current.reset();
    stableGestureRef.current = null;
    stableCountRef.current = 0;
  }, 1800);
}
  };

return {
  process,
  currentGesture,
  sequence: sequence.current.get(),
  result,
  finalSentence,
};
};
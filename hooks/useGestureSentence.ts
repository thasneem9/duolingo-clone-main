import { useRef, useState } from "react";
import { HistoryBuffer } from "@/lib/gestures/history";
import { detectWhatGesture } from "@/lib/gestures/detectWhat";
import { detectYourGesture } from "@/lib/gestures/detectYour";
import { detectNameGesture } from "@/lib/gestures/detectName";
import { GestureSequence, validateSentence } from "@/lib/gestures/sequence";

export const useGestureSentence = () => {
  const history = useRef(new HistoryBuffer(15));
  const sequence = useRef(new GestureSequence());

  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const process = (landmarks: any[]) => {
    history.current.add(landmarks);

    const hist = history.current.get();

    const what = detectWhatGesture(landmarks, hist);
    const your = detectYourGesture(landmarks, hist);
    const name = detectNameGesture(landmarks, hist);

    const candidates = [
      { label: "WHAT", ...what },
      { label: "YOUR", ...your },
      { label: "NAME", ...name },
    ];

    const best = candidates
      .filter((c) => c.detected)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (best && best.confidence > 0.6) {
      setCurrentGesture(best.label);
      sequence.current.add(best.label);
    }

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
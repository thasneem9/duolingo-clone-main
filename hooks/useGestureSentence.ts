import { useRef, useState } from "react";
import { HistoryBuffer } from "@/lib/gestures/history";
import { GestureSequence } from "@/lib/gestures/sequence";

export const useGestureSentence = () => {
  const history = useRef(new HistoryBuffer(25));
  // 🎥 RECORDING MODE
const RECORDING = false; // turn true when recording
const RECORD_LABEL = "I_KNOW";
const datasetRef = useRef<any[]>([]);


  const sequence = useRef(new GestureSequence());

  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [finalSentence, setFinalSentence] = useState<string | null>(null);

  // 🧠 stability system
  const stableGestureRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  const REQUIRED_STABLE_FRAMES = 2; 

  const process = (landmarks: any[]) => {
    if (result !== null) return; // stop after result

    history.current.add(landmarks);
    const hist = history.current.get();

    // 📦 RECORD DATA
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

    const input = hist
      .slice(-20)
      .map(frame => frame.flatMap(p => [p.x, p.y, p.z]))
      .flat();

     if (!(window as any).model) {
  console.log("⏳ model not ready");
  return;
}

if (!(window as any).tf) {
  console.log("⏳ tf not ready");
  return;
}

if (input.length !== 20 * 63) {
  console.log("⏳ waiting frames:", input.length);
  return;
}

    const prediction = (window as any).model.predict(
      (window as any).tf.tensor([input])
    );

    const probs = prediction.dataSync();
    const labels = ["WHAT", "YOUR", "NAME","I_KNOW"];
    const index = probs.indexOf(Math.max(...probs));
  const confidence = probs[index];
    const detectedLabel = labels[index];
    console.log("🎯 DETECTED:", detectedLabel, "conf:", confidence);
  
      // detect if this is single gesture mode
    const isSingleGesture = (window as any).expectedGesture === "I_KNOW";

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
    

 

 

// 🔥 START ONLY WITH "YOUR"
   // 🔥 HANDLE SINGLE GESTURE (I_KNOW)
if (isSingleGesture) {
  if (detectedLabel === "I_KNOW") {
    setFinalSentence("I know");

    setTimeout(() => {
      setResult("correct");

      stableGestureRef.current = null;
      stableCountRef.current = 0;
    }, 600);
  }

  return;
}

const last = sequence.current.get().slice(-1)[0];
    
   if (last === detectedLabel) return; // avoid duplicates
    // 🔥 LIMIT TO 3
    if (sequence.current.get().length >= 3) return;

    sequence.current.add(detectedLabel);
    setCurrentGesture(detectedLabel);

    console.log("✅ Stable Gesture:", detectedLabel);
    console.log("Sequence:", sequence.current.get());

    // ================= VALIDATION =================
    const seq = sequence.current.get();
    // detect if this is single gesture mode

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

  // 💾 DOWNLOAD DATASET
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


return {
  process,
  currentGesture,
  sequence: sequence.current.get(),
  result,
  finalSentence,
};
};
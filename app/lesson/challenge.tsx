import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";

import { Card } from "./card";
import { GestureCamera } from "./gesture-camera";
import { useRef, useMemo } from "react";

type ChallengeProps = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  onContinue: (correct?: boolean) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number | number[];
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  imageSrc?: string;
  gestureRef?: any;
  matchedPairs?: number[];
};

// ✅ shuffle helper
function shuffle<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export const Challenge = ({
  options,
  onSelect,
  onContinue,
  status,
  selectedOption,
  disabled,
  type,
  imageSrc,
  gestureRef,
  matchedPairs = [],
}: ChallengeProps) => {
  const correctOption = options.find((o) => o.correct);

  // ✅ stable filtering
  const imageOptions = useMemo(
    () => options.filter((o) => o.imageSrc),
    [options]
  );

  const textOptions = useMemo(
    () => options.filter((o) => o.text),
    [options]
  );

  // ✅ shuffle only once per question
  const shuffledTextOptions = useMemo(() => {
    return shuffle(textOptions);
  }, [textOptions]);

  // ================= GESTURE =================
  if (type === "GESTURE") {
    return (
      <div className="flex flex-col items-center gap-6">
        {imageSrc && (
          <img src={imageSrc} className="h-40 rounded-xl" />
        )}

        <GestureCamera
          key={status}
          expectedGesture={correctOption?.text?.trim() || ""}
          onResult={(correct) => {
            console.log("🎯 Gesture result:", correct);
            onContinue(correct);
          }}
        />
      </div>
    );
  }

  // ================= MATCH =================
  if (type === "MATCH") {
    return (
      <div className="flex justify-center gap-[250px] items-start">

        {/* LEFT → IMAGES */}
        <div className="flex flex-col gap-3 w-[220px]">
          {imageOptions.map((option) => (
            <Card
              key={option.id}
              id={option.id}
              imageSrc={option.imageSrc}
              selected={
                (Array.isArray(selectedOption) &&
                  selectedOption.includes(option.id)) ||
                matchedPairs.includes(option.pairId!)
              }
              onClick={() => onSelect(option.id)}
              status={status === "wrong" ? "wrong" : "none"}
              disabled={
                disabled || matchedPairs.includes(option.pairId!)
              }
              type={type}
            />
          ))}
        </div>

        {/* RIGHT → TEXT (SHUFFLED) */}
        <div className="flex flex-col gap-[150px] w-[160px]">
          {shuffledTextOptions.map((option) => (
            <Card
              key={option.id}
              id={option.id}
              text={option.text}
              selected={
                (Array.isArray(selectedOption) &&
                  selectedOption.includes(option.id)) ||
                matchedPairs.includes(option.pairId!)
              }
              onClick={() => onSelect(option.id)}
              status={status === "wrong" ? "wrong" : "none"}
              disabled={
                disabled || matchedPairs.includes(option.pairId!)
              }
              type={type}
            />
          ))}
        </div>
      </div>
    );
  }

  // ================= DEFAULT =================
  return (
    <>
      {imageSrc && (
        <div className="flex justify-center mb-6">
          <img src={imageSrc} className="h-40 rounded-xl" />
        </div>
      )}

      <div
        className={cn(
          "grid gap-2",
          type === "ASSIST" && "grid-cols-1",
          type === "SELECT" &&
            "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
        )}
      >
        {options.map((option, i) => (
          <Card
            key={option.id}
            id={option.id}
            text={option.text}
            imageSrc={option.imageSrc}
            shortcut={`${i + 1}`}
            selected={
              Array.isArray(selectedOption)
                ? selectedOption.includes(option.id)
                : selectedOption === option.id
            }
            onClick={() => onSelect(option.id)}
            status={status}
            disabled={disabled}
            type={type}
          />
        ))}
      </div>
    </>
  );
};
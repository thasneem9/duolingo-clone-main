import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";

import { Card } from "./card";
import { GestureCamera } from "./gesture-camera";

type ChallengeProps = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
   imageSrc?: string;
};

export const Challenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  type,
    imageSrc,
}: ChallengeProps) => {
   if (type === "GESTURE") {
    return (
      <div className="flex flex-col items-center gap-6">

        {imageSrc && (
          <img src={imageSrc} className="h-40 rounded-xl" />
        )}

    <GestureCamera
  target="8"
  onCorrect={() => {
    const correct = options.find(o => o.correct);
    if (correct) onSelect(correct.id);
  }}
/>

      </div>
    );
  }
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
  selected={selectedOption === option.id}
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

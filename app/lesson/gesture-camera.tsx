"use client";

type Props = {
  target: string;
  onCorrect: () => void;
};

export const GestureCamera = ({ target, onCorrect }: Props) => {
  return (
    <div className="flex flex-col items-center gap-4">

      <div className="bg-black text-white p-6 rounded-lg">
        Camera placeholder
      </div>

      <button
        onClick={onCorrect}
        className="bg-indigo-500 text-white px-4 py-2 rounded-lg"
      >
        Simulate Correct Gesture ({target})
      </button>

    </div>
  );
};
"use client";
import { useRef } from "react";

import { useState, useTransition, useEffect } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize, useMount } from "react-use";
import { toast } from "sonner";

import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { reduceHearts } from "@/actions/user-progress";
import { MAX_HEARTS } from "@/constants";
import { challengeOptions, challenges, userSubscription } from "@/db/schema";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";

import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ResultCard } from "./result-card";

type QuizProps = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  userSubscription:
    | (typeof userSubscription.$inferSelect & {
        isActive: boolean;
      })
    | null;
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonChallenges,
  userSubscription,
}: QuizProps) => {
  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
  const [checking, setChecking] = useState(false);

  const [incorrectAudio, _i, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio] = useAudio({
    src: "/finish.mp3",
    autoPlay: true,
  });
  const { width, height } = useWindowSize();

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const gestureRef = useRef<any>(null);
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  useMount(() => {
    if (initialPercentage === 100) openPracticeModal();
  });

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(() => {
    return initialPercentage === 100 ? 0 : initialPercentage;
  });
  const [challenges] = useState(initialLessonChallenges);

  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex(
      (challenge) => !challenge.completed
    );
    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number | number[]>();
  const selectedOptionRef = useRef<number | number[] | undefined>(undefined);
  const [status, setStatus] = useState<"none" | "wrong" | "correct">("none");

  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  const challenge = challenges[activeIndex];
  const options = challenge?.challengeOptions ?? [];

  const onNext = () => {
    setActiveIndex((current) => current + 1);
  };

  useEffect(() => {
    setMatchedPairs([]);
  }, [activeIndex]);

  const onSelect = (id: number) => {
    if (status !== "none") return;

    // ✅ MATCH LOGIC (FIXED)
    if (challenge.type === "MATCH") {
      const current = (selectedOptionRef.current as number[]) || [];

      if (current.length === 2) return;

      const updated = [...current, id];
      selectedOptionRef.current = updated;
      setSelectedOption(updated);

      if (updated.length === 2) {
        const selected = options.filter((o) => updated.includes(o.id));

        if (selected[0]?.pairId === selected[1]?.pairId) {
          const pairId = selected[0].pairId!;

          if (matchedPairs.includes(pairId)) return;

          const newMatched = [...matchedPairs, pairId];
          setMatchedPairs(newMatched);

          setStatus("correct");

          setTimeout(() => {
            setStatus("none");
            setSelectedOption(undefined);
            selectedOptionRef.current = undefined;

            const totalPairs = options.length / 2;

            if (newMatched.length === totalPairs) {
              startTransition(() => {
                upsertChallengeProgress(challenge.id);
              });

              onNext();
              setMatchedPairs([]);
            }
          }, 500);
        } else {
          setStatus("wrong");
        }
      }

      return;
    }

    // ✅ NORMAL SELECT
    if (selectedOptionRef.current) return;

    selectedOptionRef.current = id;
    setSelectedOption(id);
  };

  const onContinue = (correct?: boolean) => {
    if (checking) return;

    // ✅ MATCH RETRY FIX
    if (challenge.type === "MATCH") {
      if (status === "wrong") {
        setStatus("none");
        setSelectedOption(undefined);
        selectedOptionRef.current = undefined;
      }
      return;
    }

    // ✅ GESTURE FIX
    if (challenge.type === "GESTURE") {
      if (status === "wrong") {
        setStatus("none");
        return;
      }

      if (correct) {
        void correctControls.play();
        setStatus("correct");

        setTimeout(() => {
          onNext();
          setStatus("none");
        }, 800);
      } else {
        void incorrectControls.play();
        setStatus("wrong");
      }

      return;
    }

    const option = selectedOptionRef.current;
    if (!option) return;

    setChecking(true);

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      selectedOptionRef.current = undefined;
      setChecking(false);
      return;
    }

    if (status === "correct") {
      onNext();
      setStatus("none");
      setSelectedOption(undefined);
      selectedOptionRef.current = undefined;
      setChecking(false);
      return;
    }

    const correctOption = options.find((option) => option.correct);
    if (!correctOption) {
      setChecking(false);
      return;
    }

    if (correctOption.id === option) {
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void correctControls.play();
            setStatus("correct");
            setPercentage((prev) => prev + 100 / challenges.length);

            if (initialPercentage === 100) {
              setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
            }
          })
          .finally(() => setChecking(false));
      });
    } else {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            void incorrectControls.play();
            setStatus("wrong");

            if (!response?.error)
              setHearts((prev) => Math.max(prev - 1, 0));
          })
          .finally(() => setChecking(false));
      });
    }
  };

  if (!challenge) {
    return (
      <>
        {finishAudio}
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-4 text-center lg:gap-y-8">
          <h1 className="text-lg font-bold text-neutral-700 lg:text-3xl">
            Great job! <br /> You&apos;ve completed the lesson.
          </h1>

          <div className="flex w-full items-center gap-x-4">
            <ResultCard variant="points" value={challenges.length * 10} />
            <ResultCard
              variant="hearts"
              value={userSubscription?.isActive ? Infinity : hearts}
            />
          </div>
        </div>

        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push("/learn")}
        />
      </>
    );
  }

  const title =
    challenge.type === "ASSIST"
      ? "Select the correct meaning"
      : challenge.question;

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="flex w-full flex-col gap-y-12 px-6 lg:w-[600px]">
          <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-3xl">
            {title}
          </h1>

          <Challenge
            options={options}
            onSelect={onSelect}
            onContinue={onContinue}
            status={status}
            selectedOption={selectedOption}
            disabled={pending}
            type={challenge.type}
            imageSrc={challenge.imageSrc}
            gestureRef={gestureRef}
             matchedPairs={matchedPairs}
          />
        </div>
      </div>

      <Footer disabled={pending} status={status} onCheck={onContinue} />
    </>
  );
};
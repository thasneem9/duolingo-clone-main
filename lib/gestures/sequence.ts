export class GestureSequence {
  sequence: string[] = [];
  lastGesture: string | null = null;
  lastTime = 0;

  add(gesture: string) {
    const now = Date.now();

    // prevent spam
    if (gesture === this.lastGesture && now - this.lastTime < 800) return;

    this.sequence.push(gesture);
    this.lastGesture = gesture;
    this.lastTime = now;
  }

  get() {
    return this.sequence;
  }

  reset() {
    this.sequence = [];
    this.lastGesture = null;
  }
}

export const validateSentence = (seq: string[]) => {
  const expected = ["YOUR", "NAME","WHAT"];

  if (seq.length !== expected.length) return "incorrect";

  for (let i = 0; i < expected.length; i++) {
    if (seq[i] !== expected[i]) return "incorrect";
  }

  return "correct";
};
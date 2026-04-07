export const getPalmCenter = (landmarks: any[]) => {
  return landmarks[0]; // wrist as reference
};

export const getMovement = (history: any[][], axis: "x" | "y" | "z") => {
  if (history.length < 2) return 0;

  const first = history[0][0];
  const last = history[history.length - 1][0];

  return last[axis] - first[axis];
};

export const isOscillating = (history: any[][], axis: "x" | "y") => {
  let directionChanges = 0;

  for (let i = 2; i < history.length; i++) {
    const prev = history[i - 1][0][axis] - history[i - 2][0][axis];
    const curr = history[i][0][axis] - history[i - 1][0][axis];

    if (prev * curr < 0) directionChanges++;
  }

  return directionChanges >= 2;
};
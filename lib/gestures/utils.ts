export const getPalmCenter = (landmarks: any[]) => {
  return landmarks[0]; // wrist as reference
};

export const getMovement = (history: any[][], axis: "x" | "y" | "z") => {
  if (history.length < 2) return 0;

  const first = history[0][0];
  const last = history[history.length - 1][0];

  return last[axis] - first[axis];
};

export const isOscillating = (
  history: any[][],
  axis: "x" | "y" | "z"
) => {
  let directionChanges = 0;
  let totalMovement = 0;

  for (let i = 2; i < history.length; i++) {
    const prev =
      history[i - 1][9][axis] - history[i - 2][9][axis];
    const curr =
      history[i][9][axis] - history[i - 1][9][axis];

    // count direction flips
    if (prev * curr < 0) directionChanges++;

    // accumulate movement
    totalMovement += Math.abs(curr);
  }

  return directionChanges >= 2 && totalMovement > 0.03;
};
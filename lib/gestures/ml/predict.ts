
export function predictGesture(model: any, tf: any, hist: any[][]) {
  const input = hist
    .map(frame => frame.flatMap(p => [p.x, p.y, p.z]))
    .flat();

  if (input.length !== 20 * 63) return null;

  const prediction = model.predict(tf.tensor([input]));
  const probs = prediction.dataSync();

  const labels = ["WHAT", "YOUR", "NAME"];
  const index = probs.indexOf(Math.max(...probs));

  return {
    label: labels[index],
    confidence: probs[index],
  };
}
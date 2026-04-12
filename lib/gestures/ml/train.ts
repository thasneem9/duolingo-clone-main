  import * as tf from "@tensorflow/tfjs";

  export async function trainModel(data: any[]) {
    const xs = tf.tensor(data.map(d => d.input.flat()));

    const labels = ["WHAT", "YOUR", "NAME","I_KNOW"];

    const ys = tf.tensor(
      data.map(d => {
          console.log("Label index:", labels.indexOf(d.label), d.label);
        const arr = [0, 0, 0, 0];
        arr[labels.indexOf(d.label)] = 1;
        return arr;
      })
    );

    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [xs.shape[1]],
      units: 64,
      activation: "relu",
    }));

    model.add(tf.layers.dense({ units: 32, activation: "relu" }));

    model.add(tf.layers.dense({
      units: 4,
      activation: "softmax",
    }));

    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

  try {
    await model.fit(xs, ys, {
      epochs: 3,
      batchSize: 4,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log("📈 Epoch", epoch, logs);
        }
      }
    });
  } catch (e) {
    console.error("❌ TRAINING ERROR:", e);
  }
  xs.dispose();
  ys.dispose();

    return model;
  }
import * as tf from "@tensorflow/tfjs"

export default class PricePredictionModel {
  constructor() {
    // Define the model architecture
    this.model = tf.sequential()
    this.model.add(
      tf.layers.dense({ units: 64, inputShape: [10], activation: "relu" })
    )
    this.model.add(tf.layers.dense({ units: 64, activation: "relu" }))
    this.model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }))

    // Compile the model
    this.model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    })
  }

  async train(features, labels) {
    console.log(features, labels)
    if (!features || features.length === 0 || !features[0]) {
      throw new Error("Los datos de características (features) no son válidos.")
    }

    // Convert JavaScript arrays to TensorFlow tensors
    const xs = tf.tensor2d(features, [features.length, features[0].length])
    const ys = tf.tensor2d(labels, [labels.length, 1])

    // Train the model
    await this.model.fit(xs, ys, { epochs: 10 })

    // Free up the memory used by tensors
    xs.dispose()
    ys.dispose()
  }

  predict(features) {
    // Convert JavaScript array to TensorFlow tensor
    const xs = tf.tensor2d(features)

    // Make predictions
    const predictions = this.model.predict(xs).dataSync()

    // Free up the memory used by tensors
    xs.dispose()

    return predictions
  }
}

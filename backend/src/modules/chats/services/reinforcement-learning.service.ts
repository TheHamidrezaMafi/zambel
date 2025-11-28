import { Injectable } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
// import * as tf from '@tensorflow/tfjs-node';
import { TfIdf } from 'natural';

@Injectable()
export class ReinforcementLearningService {
  // private model: tf.Sequential;
  private tfidf;

  constructor(private feedbackService: FeedbackService) {
    // this.model = this.buildModel();
    this.tfidf = new TfIdf();
  }

  // private buildModel(): tf.Sequential {
    // const model = tf.sequential();
    // model.add(
    //   tf.layers.dense({ units: 128, inputShape: [100], activation: 'relu' }),
    // );
    // model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    // model.compile({
    //   optimizer: 'adam',
    //   loss: 'binaryCrossentropy',
    //   metrics: ['accuracy'],
    // });

    // return model;
  // }

  async trainModel(): Promise<void> {
    const feedbacks = await this.feedbackService.getAllFeedbacks();

    const inputs = feedbacks.map((feedback) =>
      this.encodeMessage(feedback.message),
    );

    const labels = feedbacks.map((feedback) =>
      feedback.feedback == 'like' ? 1 : 0,
    );

    // const xs = tf.tensor2d(inputs, [inputs.length, 100]);
    // const ys = tf.tensor2d(labels, [labels.length, 1]);

    // await this.model.fit(xs, ys, {
    //   epochs: 10,
    //   batchSize: 32,
    // });
  }

  private encodeMessage(message: string): number[] {
    // تبدیل متن به بردار عددی (مثلاً با استفاده از توکن‌سازی)
    const words = message.split(' ');
    const vector: number[] = [];
    words.forEach((word) => {
      this.tfidf.addDocument(word);
    });

    this.tfidf.listTerms(0).forEach((term) => {
      vector.push(term.tfidf);
    });

    return vector;
  }

  async predictFeedback(message: string) {
    // const input = this.encodeMessage(message);
    // const xs = tf.tensor2d([input], [1, 100]);
    // const prediction = this.model.predict(xs) as tf.Tensor;
    // return prediction.dataSync()[0];
  }
}

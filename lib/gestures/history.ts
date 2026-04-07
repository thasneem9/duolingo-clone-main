export type Landmark = { x: number; y: number; z: number };

export class HistoryBuffer {
  buffer: Landmark[][] = [];
  maxSize: number;

  constructor(size = 15) {
    this.maxSize = size;
  }

  add(frame: Landmark[]) {
    this.buffer.push(frame);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  get() {
    return this.buffer;
  }

  isFull() {
    return this.buffer.length >= this.maxSize;
  }
}
//remebers last few hand movements
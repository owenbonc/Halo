// Served as a same-origin module so microphone processing runs off the UI thread.
const processor = `class CallCapture extends AudioWorkletProcessor {
  constructor() { super(); this.samples = new Float32Array(2048); this.offset = 0; }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) for (const sample of channel) {
      this.samples[this.offset++] = sample;
      if (this.offset === this.samples.length) {
        this.port.postMessage(this.samples); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('call-capture', CallCapture);`;
export function GET() {
  return new Response(processor, {
    headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'public, max-age=3600' },
  });
}

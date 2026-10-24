// Served as a same-origin module so microphone processing runs off the UI thread.
const processor = `class CallCapture extends AudioWorkletProcessor {
  constructor() {
    super(); this.samples = new Float32Array(2048); this.offset = 0; this.enabled = false;
    this.generation = 0;
    this.port.onmessage = ({data}) => {
      this.enabled = data.enabled; this.generation = data.generation; this.offset = 0;
    };
  }
  process(inputs) {
    if (!this.enabled) return true;
    const channel = inputs[0]?.[0];
    if (channel) for (const sample of channel) {
      this.samples[this.offset++] = sample;
      if (this.offset === this.samples.length) {
        this.port.postMessage({ samples: this.samples, generation: this.generation }); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('call-capture', CallCapture);`;
export function GET() {
  return new Response(processor, {
    headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' },
  });
}

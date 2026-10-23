import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { GET } from './route';

it('starts paused and discards partial audio across pause/resume generations', async () => {
  type Frame = { samples: Float32Array; generation: number };
  type Control = { data: { enabled: boolean; generation: number } };
  type ProcessorInstance = {
    port: { onmessage: (event: Control) => void };
    process: (inputs: Float32Array[][]) => void;
  };
  const frames: Frame[] = [];
  let Processor: (new () => ProcessorInstance) | undefined;
  class Base {
    port = {
      postMessage: (frame: Frame) => frames.push(structuredClone(frame)),
      onmessage: (_: Control) => {},
    };
  }
  const response = GET();
  expect(response.headers.get('cache-control')).toBe('no-cache');
  runInNewContext(await response.text(), {
    AudioWorkletProcessor: Base,
    registerProcessor: (_name: string, ctor: new () => ProcessorInstance) => {
      Processor = ctor;
    },
  });
  if (!Processor) throw new Error('Processor was not registered');
  const processor = new Processor();
  processor.process([[new Float32Array(2048).fill(0.1)]]);
  expect(frames).toHaveLength(0);
  processor.port.onmessage({ data: { enabled: true, generation: 1 } });
  processor.process([[new Float32Array(1024).fill(0.1)]]);
  processor.port.onmessage({ data: { enabled: false, generation: 2 } });
  processor.port.onmessage({ data: { enabled: true, generation: 3 } });
  processor.process([[new Float32Array(2048).fill(0.5)]]);
  expect(frames).toHaveLength(1);
  expect(frames[0]?.generation).toBe(3);
  expect(frames[0]?.samples.every((n) => n === 0.5)).toBe(true);
});

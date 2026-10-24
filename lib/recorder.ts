'use client';

// Starts the microphone; call the returned stop() to get the recording.
export async function startRecording(
  signal?: AbortSignal,
): Promise<{ stop: () => Promise<Blob>; cancel: () => void }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const release = () => {
    for (const track of stream.getTracks()) track.stop();
  };
  if (signal?.aborted) {
    release();
    throw new DOMException('Cancelled', 'AbortError');
  }
  try {
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    let rejectRecording: (error: Error) => void = () => {};
    const audio = new Promise<Blob>((resolve, reject) => {
      rejectRecording = reject;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        cleanup();
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error('Recording failed.'));
      };
    });
    void audio.catch(() => {});
    const cleanup = () => {
      release();
      signal?.removeEventListener('abort', cancel);
    };
    const cancel = () => {
      cleanup();
      rejectRecording(new DOMException('Cancelled', 'AbortError'));
      if (recorder.state !== 'inactive') recorder.stop();
    };
    signal?.addEventListener('abort', cancel, { once: true });
    recorder.start();
    let finished = false;
    return {
      cancel,
      stop: () => {
        if (!finished) {
          finished = true;
          if (recorder.state !== 'inactive') recorder.stop();
          release();
        }
        return audio;
      },
    };
  } catch (error) {
    release();
    throw error;
  }
}

export function speak(text: string) {
  speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'en-GB';
  speechSynthesis.speak(speech);
}

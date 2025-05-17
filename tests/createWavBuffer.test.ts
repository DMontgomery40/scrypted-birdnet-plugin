import { createWavBuffer } from '../src/wav';

describe('createWavBuffer', () => {
  it('creates a valid wav buffer from samples', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const buf = createWavBuffer(samples);

    const expectedLength = 44 + samples.length * 2;
    expect(buf.length).toBe(expectedLength);
    expect(buf.slice(0, 4).toString()).toBe('RIFF');
    expect(buf.slice(8, 12).toString()).toBe('WAVE');
  });
});

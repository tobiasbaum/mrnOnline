import { IsSafeUrlPipe } from './is-safe-url.pipe';

describe('IsSafeUrlPipe', () => {
  it('create an instance', () => {
    const pipe = new IsSafeUrlPipe();
    expect(pipe).toBeTruthy();
  });
});

import { isShelterSuitability, SHELTER_SUITABILITIES } from '../evacuation-shelter';

describe('isShelterSuitability', () => {
  it.each(SHELTER_SUITABILITIES)('既知の適否 %s を受け入れる', (suitability) => {
    expect(isShelterSuitability(suitability)).toBe(true);
  });

  it.each([
    ['未知の文字列', 'unknown-value'],
    ['null', null],
    ['undefined', undefined],
    ['数値', 1],
  ])('%s は受け入れない', (_label, value) => {
    expect(isShelterSuitability(value)).toBe(false);
  });
});

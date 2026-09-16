import { CREDIT_ATTRIBUTIONS, ROUTING_ATTRIBUTIONS } from '../attributions';

describe('帰属表示', () => {
  it('経路表示には ORS と OpenStreetMap のクレジットを含む（ODbL 要件）', () => {
    const labels = ROUTING_ATTRIBUTIONS.map((attribution) => attribution.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        expect.stringContaining('openrouteservice'),
        expect.stringContaining('OpenStreetMap'),
      ]),
    );
  });

  it('クレジット画面は経路の帰属表示をすべて含む', () => {
    expect(CREDIT_ATTRIBUTIONS).toEqual(expect.arrayContaining([...ROUTING_ATTRIBUTIONS]));
  });

  it('すべての帰属表示が https のリンクを持つ', () => {
    for (const attribution of CREDIT_ATTRIBUTIONS) {
      expect(attribution.url).toMatch(/^https:\/\//);
    }
  });
});

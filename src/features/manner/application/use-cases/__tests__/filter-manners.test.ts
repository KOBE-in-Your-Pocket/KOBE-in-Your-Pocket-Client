import { filterMannersByKind, filterMannersByScope } from '../filter-manners';

import type { MannerItem } from '../../../domain/manner-item';

const makeManner = (
  id: string,
  kind: MannerItem['kind'],
  scope: MannerItem['scope'] = 'local',
): MannerItem => ({
  id,
  kind,
  title: id,
  description: '',
  icon: id,
  imageKey: null,
  scope,
  relatedSpotIds: [],
});

const MANNERS: MannerItem[] = [
  makeManner('no-trespassing', 'rule'),
  makeManner('no-smoking-while-walking', 'rule'),
  makeManner('show-consideration', 'manner'),
  makeManner('no-loud-conversation', 'manner'),
];

describe('filterMannersByKind', () => {
  it.each([
    [
      'all',
      ['no-trespassing', 'no-smoking-while-walking', 'show-consideration', 'no-loud-conversation'],
    ],
    ['rule', ['no-trespassing', 'no-smoking-while-walking']],
    ['manner', ['show-consideration', 'no-loud-conversation']],
  ] as const)("'%s' を指定すると期待件数・内容を返す", (kind, expectedIds) => {
    const result = filterMannersByKind(MANNERS, kind);

    expect(result).toHaveLength(expectedIds.length);
    expect(result.map((manner) => manner.id)).toEqual(expectedIds);
  });

  it("'all' を指定すると同じ配列参照を返す", () => {
    expect(filterMannersByKind(MANNERS, 'all')).toBe(MANNERS);
  });

  it('該当項目がない場合は空配列を返す', () => {
    const mannersOnly = MANNERS.filter((manner) => manner.kind !== 'rule');

    expect(filterMannersByKind(mannersOnly, 'rule')).toHaveLength(0);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(filterMannersByKind([], 'manner')).toHaveLength(0);
  });

  it('入力配列を変更しない（非破壊）', () => {
    const input = [...MANNERS];

    filterMannersByKind(input, 'rule');

    expect(input).toEqual(MANNERS);
  });
});

const SCOPED_MANNERS: MannerItem[] = [
  makeManner('no-trespassing', 'rule', 'local'),
  makeManner('handle-products-with-care', 'manner', 'local'),
  makeManner('put-trash-in-bin', 'manner', 'japan'),
  makeManner('no-smoking-while-walking', 'rule', 'japan'),
];

describe('filterMannersByScope', () => {
  it("'all' を指定すると全件を返す", () => {
    expect(filterMannersByScope(SCOPED_MANNERS, 'all')).toHaveLength(SCOPED_MANNERS.length);
  });

  it("'all' を指定すると同じ配列参照を返す", () => {
    expect(filterMannersByScope(SCOPED_MANNERS, 'all')).toBe(SCOPED_MANNERS);
  });

  it.each([
    ['local', ['no-trespassing', 'handle-products-with-care']],
    ['japan', ['put-trash-in-bin', 'no-smoking-while-walking']],
  ] as const)("'%s' を指定すると該当項目のみ返す", (scope, expectedIds) => {
    const result = filterMannersByScope(SCOPED_MANNERS, scope);

    expect(result.map((manner) => manner.id)).toEqual(expectedIds);
  });

  it('該当項目がない場合は空配列を返す', () => {
    const localOnly = SCOPED_MANNERS.filter((manner) => manner.scope !== 'japan');

    expect(filterMannersByScope(localOnly, 'japan')).toHaveLength(0);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(filterMannersByScope([], 'local')).toHaveLength(0);
  });
});

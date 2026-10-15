import type { DisasterType, EvacuationShelter } from '../../domain/evacuation-shelter';

/**
 * 選択した災害種別のいずれかで「利用できる（`suitable`）」避難所だけに絞り込む（OR）。
 * 1 つも選んでいないときは絞り込まず、全件をそのまま返す。
 *
 * `conditional`（条件付き）は `suitable` に丸めない。条件付きの避難所を
 * 「使える」と見せると、災害時に誤った判断をさせるため（#580）。
 * 適否の情報が無い避難所も、利用できると言い切れないため絞り込み時は含めない。
 */
export function filterSheltersByDisaster<T extends EvacuationShelter>(
  shelters: T[],
  selectedDisasters: readonly DisasterType[],
): T[] {
  if (selectedDisasters.length === 0) return shelters;

  return shelters.filter((shelter) =>
    selectedDisasters.some((disaster) => shelter.suitability?.[disaster] === 'suitable'),
  );
}

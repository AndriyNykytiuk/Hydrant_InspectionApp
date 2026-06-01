// Список ключів-чекбоксів окрім трьох "ядрових" (isWorking/cleanPath/banner).
export const OPTIONAL_CHECK_FIELDS = [
  'lidOk',
  'bodyOk',
  'patrubCapOk',
  'stockOk',
  'tightnessOk',
  'threadOk',
  'stockHeightOk',
  'waterStartOk',
  'pressureOk',
  'flowRateOk',
  'waterCleanOk',
  'wellDepthOk',
  'wellDryOk',
  'wellNeckOk',
  'signReadableOk',
  'signMatchesOk',
];

export const serializeInspectionChecks = (i) => {
  const out = {};
  for (const k of OPTIONAL_CHECK_FIELDS) out[k] = i[k] ?? null;
  return out;
};

export const inspectionHasDefect = (i) => {
  if (!i) return false;
  if (!i.isWorking || !i.cleanPath || !i.banner) return true;
  if (i.weakness?.trim()) return true;
  return OPTIONAL_CHECK_FIELDS.some((k) => i[k] === false);
};

// Ключі питань чек-листа, що зберігаються в JSON-полі Inspection.checks.
// Має збігатися з пунктами в client checklist.js (без "ядрового" isWorking).
// Загальний стан гідранта зберігається окремо в колонці isWorking.
export const CHECK_KEYS = [
  // Технічний стан та працездатність
  'stacksDrained',
  'biannualCheck',
  'waterSupplyNorm',
  // Доступність та під'їзні шляхи
  'accessYearRound',
  'hardSurface',
  'snowCleared',
  'noParkingZone',
  // Маркування та вказівники
  'signPresent',
  'signInfoComplete',
  'signLighting',
  // Утримання колодязів (підземні ПГ)
  'lidRed',
  'lidHandles',
  'lidClean',
  'lidInsulated',
  // Експлуатація та безпека
  'shutdownAgreed',
  'pressureDropAlert',
  'noOpenFlame',
  'maintenanceLogged',
];

// Збираємо map відповідей із вхідних полів форми (tri-state: true/false/null).
export const collectChecks = (read) => {
  const out = {};
  for (const k of CHECK_KEYS) out[k] = read(k);
  return out;
};

// Розкладаємо checks-map у пласкі поля для відповіді API (клієнт читає insp[key]).
export const serializeInspectionChecks = (i) => {
  const checks = i?.checks ?? {};
  const out = {};
  for (const k of CHECK_KEYS) out[k] = checks[k] ?? null;
  return out;
};

export const inspectionHasDefect = (i) => {
  if (!i) return false;
  if (!i.isWorking) return true;
  if (i.weakness?.trim()) return true;
  const checks = i.checks ?? {};
  return CHECK_KEYS.some((k) => checks[k] === false);
};

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

const MONTHS_UK = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

const formatActDate = (d = new Date()) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_UK[d.getMonth()];
  const year = d.getFullYear();
  return { day, month, year };
};

// Тексти недоліків для акта. `isWorking` — окрема колонка, решта — у insp.checks.
const OVERALL_DEFECT = 'ПГ несправний';
const CHECK_DEFECTS = {
  stacksDrained: 'стояки підземних гідрантів не звільнені від води на зимовий період',
  biannualCheck: 'перевірка працездатності ПГ не проводиться двічі на рік (навесні/восени)',
  waterSupplyNorm: 'мережа не забезпечує потрібних витрати води / тиску для пожежогасіння',
  accessYearRound: "немає вільного під'їзду пожежних автомобілів у будь-яку пору року",
  hardSurface: "під'їзд до ПГ не має твердого покриття",
  snowCleared: 'підступи / дороги до гідранта не очищені від снігу',
  noParkingZone: 'транспорт паркується ближче ніж 5 м від ПГ',
  signPresent: 'відсутній покажчик місця розташування ПГ',
  signInfoComplete: 'покажчик не містить повної інформації (індекс «ПГ», відстань, діаметр, вид мережі)',
  signLighting: 'немає освітлення для пошуку покажчиків ПГ у нічний час',
  lidRed: 'кришки люків колодязів не пофарбовані в червоний колір',
  lidHandles: 'кришки люків не мають втоплюваних ручок',
  lidClean: 'кришки люків забруднені (бруд, лід, сніг)',
  lidInsulated: 'люки колодязів не утеплені на холодний період',
  shutdownAgreed: 'тимчасове відключення гідрантів не погоджено з пожежною охороною',
  pressureDropAlert: 'пожежна охорона не сповіщається про зниження тиску в мережі',
  noOpenFlame: 'для відігрівання замерзлих гідрантів використовується відкритий вогонь',
  maintenanceLogged: 'результати техобслуговування / ремонту не документуються',
};

const defectsFromInspection = (insp) => {
  if (!insp) return ['Не перевірено'];
  const list = [];
  if (insp.isWorking === false) list.push(OVERALL_DEFECT);
  const checks = insp.checks ?? {};
  for (const [key, label] of Object.entries(CHECK_DEFECTS)) {
    if (checks[key] === false) list.push(label);
  }
  if (insp.weakness?.trim()) list.push(insp.weakness.trim());
  return list.length ? list : ['—'];
};

const para = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: opts.spacing,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size, // half-points
        italics: opts.italic,
      }),
    ],
  });

const cellPara = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [new TextRun({ text: String(text ?? ''), bold: opts.bold, size: 20 })],
  });

const tcell = (children, opts = {}) =>
  new TableCell({
    width: opts.width
      ? { size: opts.width, type: WidthType.PERCENTAGE }
      : undefined,
    children: Array.isArray(children) ? children : [children],
  });

export async function buildDefectActDocx({
  brigade,
  hydrantsWithDefects,
  ourRepresentative,
  representativeSurname,
  aggregated = false,
}) {
  const { day, month, year } = formatActDate();

  // header note (Додаток 4 ...)
  const headerNote = [
    para('Додаток 4', { align: AlignmentType.RIGHT, size: 20 }),
    para('до Інструкції про порядок утримання, обліку та перевірки технічного стану джерел зовнішнього протипожежного водопостачання', {
      align: AlignmentType.RIGHT,
      size: 20,
    }),
    para('(пункт 4 розділу ІІІ)', { align: AlignmentType.RIGHT, size: 20 }),
    para(''),
  ];

  // Title
  const title = [
    para('АКТ', { align: AlignmentType.CENTER, bold: true, size: 32 }),
    para('виявлених несправностей джерел зовнішнього протипожежного водопостачання', {
      align: AlignmentType.CENTER,
      bold: true,
      size: 24,
    }),
    para(''),
  ];

  // Date line
  const localityLabel = aggregated ? brigade.name : brigade.name;
  const dateLine = new Paragraph({
    children: [
      new TextRun({ text: `«${day}» ${month} ${year} року`, size: 22 }),
      new TextRun({ text: '                                                                              ', size: 22 }),
      new TextRun({ text: localityLabel, size: 22, italics: true }),
    ],
  });
  const dateHint = para('(назва підрозділу / частина)', {
    align: AlignmentType.RIGHT,
    italic: true,
    size: 18,
  });

  // Body paragraph
  const bodyText = new Paragraph({
    children: [
      new TextRun({
        text: 'Ми, що нижче підписалися, представник пожежно-рятувального підрозділу ДСНС ',
        size: 22,
      }),
      new TextRun({ text: ourRepresentative || '________________________', size: 22, bold: true }),
      new TextRun({
        text: ', з одного боку, і представник ',
        size: 22,
      }),
      new TextRun({
        text: representativeSurname || '________________________',
        size: 22,
        bold: true,
      }),
      new TextRun({
        text: ` (представник власника (орендаря, користувача) об'єкта, представник підприємства питного водопостачання, балансоутримувач), з іншого боку, склали цей акт про те, що «${day}» ${month} ${year} року нами була проведена спільна перевірка джерел зовнішнього протипожежного водопостачання:`,
        size: 22,
      }),
    ],
  });

  // Table
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      tcell(cellPara('№\nз/п', { align: AlignmentType.CENTER, bold: true }), { width: 6 }),
      tcell(cellPara('Вид джерела водопостачання та його номер', { align: AlignmentType.CENTER, bold: true }), { width: 22 }),
      tcell(cellPara('Адреса (місце розташування)', { align: AlignmentType.CENTER, bold: true }), { width: 28 }),
      tcell(cellPara('Наявність і стан покажчика', { align: AlignmentType.CENTER, bold: true }), { width: 16 }),
      tcell(cellPara('Стан джерела водопостачання. Характер виявлених несправностей', { align: AlignmentType.CENTER, bold: true }), { width: 28 }),
    ],
  });

  const dataRows = hydrantsWithDefects.map((h, idx) => {
    const insp = h.latestInspection;
    const defects = defectsFromInspection(insp).join('; ');
    const signPresent = insp?.checks?.signPresent;
    const bannerStatus = signPresent === false ? 'відсутній' : signPresent === true ? 'наявний' : '—';
    const brigadeNote = aggregated && h.brigade?.name ? ` (${h.brigade.name})` : '';
    return new TableRow({
      children: [
        tcell(cellPara(String(idx + 1), { align: AlignmentType.CENTER })),
        tcell(cellPara(`ПГ-${h.number}${brigadeNote}`)),
        tcell(cellPara(h.address)),
        tcell(cellPara(bannerStatus, { align: AlignmentType.CENTER })),
        tcell(cellPara(defects)),
      ],
    });
  });

  // If no defects, add a single row indicating so
  if (dataRows.length === 0) {
    dataRows.push(
      new TableRow({
        children: [
          tcell(
            cellPara('Недоліків не виявлено', { align: AlignmentType.CENTER, bold: true })
          ),
        ],
        // Span across columns isn't trivial; fall back to single column for simplicity
      })
    );
  }

  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
  });

  // Signatures
  const signatures = [
    para(''),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Представник пожежно-рятувального підрозділу ДСНС  ',
          size: 22,
        }),
        new TextRun({ text: ourRepresentative || '________________________', size: 22, bold: true }),
      ],
    }),
    para('(посада, підпис, власне ім\'я, ПРІЗВИЩЕ)', { align: AlignmentType.RIGHT, italic: true, size: 18 }),
    para(''),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Представник власника (орендаря, користувача) об\'єкта, представник підприємства питного водопостачання, балансоутримувач  ',
          size: 22,
        }),
        new TextRun({ text: representativeSurname || '________________________', size: 22, bold: true }),
      ],
    }),
    para('(посада, підпис, власне ім\'я, ПРІЗВИЩЕ)', { align: AlignmentType.RIGHT, italic: true, size: 18 }),
    para(''),
    para('{Додаток 4 із змінами, внесеними згідно з Наказом Міністерства внутрішніх справ № 107 від 06.02.2026}', { italic: true, size: 18 }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerNote,
          ...title,
          dateLine,
          dateHint,
          para(''),
          bodyText,
          para(''),
          table,
          ...signatures,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

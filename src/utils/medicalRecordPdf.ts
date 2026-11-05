export interface StructuredMedicalRecord {
  title: string;
  category: string;
  status: string;
  date: string;
  hospital?: string | null;
  doctor?: string | null;
  laboratory?: string | null;
  summary?: string | null;
}

function pdfText(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');
}

export function downloadMedicalRecordPdf(record: StructuredMedicalRecord) {
  const rawLines = [
    'WellNest - Structured Medical Record',
    '',
    `Title: ${record.title}`,
    `Category: ${record.category}`,
    `Status: ${record.status}`,
    `Date: ${record.date}`,
    `Hospital: ${record.hospital || 'Not recorded'}`,
    `Doctor: ${record.doctor || 'Not recorded'}`,
    `Laboratory: ${record.laboratory || 'Not recorded'}`,
    '',
    'Summary:',
    record.summary || 'No structured summary is available.',
    '',
    'Generated from structured information saved in the patient record.',
  ];
  const lines = rawLines.flatMap((line) => {
    const words = line.split(/\s+/);
    const wrapped: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && `${current} ${word}`.length > 84) {
        wrapped.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current || line === '') wrapped.push(current);
    return wrapped;
  }).slice(0, 42);
  const commands = ['BT', '/F1 11 Tf', '50 750 Td', '16 TL', ...lines.flatMap((line, index) => [index ? 'T*' : '', `(${pdfText(line)}) Tj`]).filter(Boolean), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${record.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'medical-record'}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Let the browser begin consuming the blob before releasing its object URL.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

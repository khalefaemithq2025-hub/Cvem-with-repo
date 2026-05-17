const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export function normalizeArabicNumerals(input: string): string {
  return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (c) => {
    const idx = ARABIC_INDIC.indexOf(c);
    return idx >= 0 ? String(idx) : c;
  });
}

/** Strip HTML tags and dangerous characters from user input fields */
export function sanitizeInput(val: string): string {
  return val.replace(/<[^>]*>/g, '').replace(/[<>"]/g, '');
}

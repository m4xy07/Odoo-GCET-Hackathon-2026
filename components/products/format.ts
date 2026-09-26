// Mockup shows cost as "3000 Rs"
export const formatCost = (n: number) => `${n.toLocaleString('en-IN')} Rs`;

export const UOM_LABEL: Record<string, string> = { unit: 'Units', kg: 'kg', g: 'g', l: 'Litres', m: 'Metres', box: 'Boxes' };

export const formatQty = (n: number, uom: string) => `${n.toLocaleString('en-IN')}${uom === 'unit' ? '' : ` ${uom}`}`;

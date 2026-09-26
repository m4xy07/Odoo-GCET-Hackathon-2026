// Shapes the API returns. Shared by every page, change only after telling the team.

export type OpType = 'IN' | 'OUT' | 'INT' | 'ADJ';
export type OpStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  unitCost: number;
  reorderMin: number;
  onHand: number;
  freeToUse: number;
  stockState: 'ok' | 'low' | 'out';
};

export type StockRow = {
  productId: string;
  name: string;
  sku: string;
  unitCost: number;
  onHand: number;
  freeToUse: number;
  stockState: 'ok' | 'low' | 'out';
};

export type OperationRow = {
  id: string;
  reference: string;
  type: OpType;
  status: OpStatus;
  contact: string;
  from: string;
  to: string;
  scheduledDate: string;
  isLate: boolean;
};

export type OperationDetail = OperationRow & {
  warehouse: string;
  responsible: { id: string; name: string };
  deliveryAddress?: string;
  notes?: string;
  sourceLocationId: string;
  destLocationId: string;
  lines: { productId: string; name: string; sku: string; quantity: number; available: boolean; freeToUse: number }[];
  canEdit: boolean;
  actions: ('confirm' | 'check' | 'validate' | 'cancel' | 'print')[];
};

// direction: IN or ADJ into an internal location = 'in' (green), OUT or ADJ out = 'out' (red), INT = 'internal'
export type MoveRow = {
  id: string;
  date: string;
  reference: string;
  type: OpType;
  direction: 'in' | 'out' | 'internal';
  product: string;
  sku: string;
  from: string;
  to: string;
  quantity: number;
  contact: string;
  status: 'done';
};

export type LowStockItem = {
  productId: string;
  name: string;
  sku: string;
  onHand: number;
  reorderMin: number;
  state: 'low' | 'out';
};

export type DashboardData = {
  kpis: {
    productsInStock: number;
    lowStock: number;
    outOfStock: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    transfersScheduled: number;
  };
  receipts: { toReceive: number; late: number; upcoming: number };
  deliveries: { toDeliver: number; late: number; waiting: number; upcoming: number };
  recent: MoveRow[]; // last 8
};

// GET /api/me
export type Me = { id: string; loginId: string; email: string; name: string; role: 'manager' | 'staff' };

// Every route answers { data } on success or { error } on failure
export type ApiSuccess<T> = { data: T };
export type ApiFailure = { error: { message: string; fields?: Record<string, string> } };

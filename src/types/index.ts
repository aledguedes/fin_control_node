export interface User {
  id: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  date: string;
  payment_method: string;
  is_installment: boolean;
  category_id: string;
  user_id: string;
  installments?: {
    total_installments: number;
    paid_installments: number;
    start_date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface InstallmentEntry {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  date: string;
  payment_method: string;
  category_id: string;
  user_id: string;
  installment_number: number;
  total_installments: number;
  parent_transaction_id: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  total_amount: number;
  type: 'revenue' | 'expense';
  payment_method: string;
  category_id: string;
  user_id: string;
  status: 'active' | 'overdue' | 'completed';
  total_installments: number;
  paid_installments: number;
  paid_amount: number;
  pending_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'l' | 'dz' | 'm' | 'cx';
  category_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
  total_amount?: number;
  user_id: string;
}

export interface ShoppingListItem {
  id: string;
  quantity: number;
  price: number;
  checked: boolean;
  shopping_list_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingListItemWithProduct[];
}

export interface ShoppingListItemWithProduct extends ShoppingListItem {
  product: Product;
}

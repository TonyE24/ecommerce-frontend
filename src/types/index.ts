export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items?: CartItem[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CheckoutSessionResponse {
  url: string;
}

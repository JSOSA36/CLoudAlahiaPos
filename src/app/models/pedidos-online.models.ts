export interface PedidoOnlineCategoria {
  idCategoria: number;
  nombre: string;
  imagenPath?: string | null;
}

export interface PedidoOnlineProducto {
  idProducto: number;
  idCategoria?: number | null;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  precio: number;
  itbis: number;
  precioConItbis: number;
  esServicio: boolean;
}

export interface PedidoOnlineMenu {
  slug: string;
  nombrePublico: string;
  whatsApp?: string | null;
  logoUrl?: string | null;
  nombreEmpresa?: string | null;
  categorias: PedidoOnlineCategoria[];
  productos: PedidoOnlineProducto[];
}

export interface PedidoOnlineLineaCarrito {
  idProducto: number;
  nombre: string;
  precioConItbis: number;
  cantidad: number;
  observacion: string;
}

export interface PedidoOnlineCheckout {
  nombre: string;
  telefono: string;
  tipoEntrega: 'Delivery' | 'Recoger';
  direccion?: string;
  referencia?: string;
  metodoPago: string;
  observacion?: string;
  idempotencyKey?: string;
  latitud?: number;
  longitud?: number;
  lineas: { idProducto: number; cantidad: number; observacion?: string }[];
}

export interface PedidoOnlineConfirmacion {
  idPedidoOnline: number;
  idFacturaHeader: number;
  numeroPedido: string;
  total: number;
  tipoEntrega: string;
  estado: string;
  estadoUnificado?: string;
  mensaje?: string;
  fecha: string;
}

export interface PedidoOnlineSeguimiento {
  idPedidoOnline: number;
  numeroPedido: string;
  tipoEntrega: string;
  estadoCocina: string;
  estadoLogistico: string;
  estadoUnificado: string;
  mensaje: string;
  total: number;
  fecha: string;
  items: PedidoDeliveryItem[];
}

export interface PedidoOnlinePerfil {
  nombre: string;
  telefono: string;
  direccion?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  pedidos: number;
}

export interface PedidoOnlineHistorialItem {
  idPedidoOnline: number;
  numeroPedido: string;
  tipoEntrega: string;
  estadoUnificado: string;
  mensaje: string;
  total: number;
  fecha: string;
  direccion?: string | null;
  items: PedidoDeliveryItem[];
}

export interface PedidoDeliveryItem {
  nombre: string;
  cantidad: number;
  observacion?: string | null;
  subTotal: number;
}

export interface PedidoDeliveryListado {
  idPedidoOnline: number;
  idFacturaHeader: number;
  numeroPedido: string;
  nombreCliente: string;
  telefono: string;
  tipoEntrega: string;
  direccion?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  metodoPago: string;
  observacion?: string | null;
  total: number;
  estadoCocina: string;
  estadoLogistico: string;
  estadoUnificado: string;
  idUsuarioRepartidor?: number | null;
  nombreRepartidor?: string | null;
  fecha: string;
  items: PedidoDeliveryItem[];
}

export interface DeliveryRepartidor {
  idRepartidor: number;
  idUsuario: number;
  nombre: string;
  userName: string;
  disponible: boolean;
  activo: boolean;
  pedidosActivos: number;
}

export interface PedidoOnlineCanalEmpresa {
  idCanal: number;
  slug: string;
  nombrePublico: string;
  whatsApp?: string | null;
  activo: boolean;
}

export function urlMapaPedido(p: {
  latitud?: number | null;
  longitud?: number | null;
  direccion?: string | null;
  referencia?: string | null;
}): string | null {
  const lat = Number(p.latitud);
  const lng = Number(p.longitud);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const q = [p.direccion, p.referencia].filter(Boolean).join(' ');
  if (!q) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

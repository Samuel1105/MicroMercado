export type SideNavItem = {
    title: string;
    path: string;
    icon?: JSX.Element;
    submenu?: boolean;
    subMenuItems?: SideNavItem[];
    enable?: boolean,
    roles?:number[]
  };
  
  export type ProductCardProps = {
    id:Number;
    nombre: string;
    descripcion:string,
    precio?: number;
    proveedor: string;
    categoria: string;
    cantidad: number;
  }
  
  export type Producto = {
    id: Number;
    nombre: string;
    descripcion: string,
    precioVenta: number;
    stock:number;
    Proveedor: { nombre: string };
    Categoria: { nombre: string };
    cantidad: number;
  };
  
  // Definimos las interfaces para las categorías y proveedores
  export type Categoria ={
    id: number;
    nombre: string;
  }
  
  export type Proveedor = {
    id: number;
    nombre: string;
  }

export type Usuario = {
  id: number;
  primerNombre: string;
  segundoNombre?: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  correo: string;
  celular: string;
  rol: string;
  estado: number;
  fechaRegistro: string;
  usuarioIdRegistro: number;
  fechaActualizacion: string;
  usuarioIdActualizacion: number;
}

// Primero definimos la interfaz para el Lote
export interface Lote {
  numeroLote: string;
  fechaVencimiento: Date;
  cantidad: number;
}

// Actualizamos la interfaz ProductoSeleccionado para incluir los lotes
export interface ProductoSeleccionado extends Omit<Producto, 'cantidad'> {
  esPorMayor: boolean;
  cantidadMayor: number;
  precioUnitarioMayor: number;
  unidadesPorMayor: number;
  cantidadIndividual: number;
  precioUnitario: number;
  descuentoMayor: number;
  descuentoIndividual: number;
  subtotal: number;
  descuento: number;
  total: number;
  unidadMedidaMayorId?: number;
  lotes: Lote[]; // Agregamos el array de lotes
}

export interface UnidadMedida {
  id: number;
  nombre: string;
}
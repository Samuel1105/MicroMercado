import { Icon } from '@iconify/react';
import { SideNavItem } from './type/types';

export const SIDENAV_ITEMS: SideNavItem[] = [
  {
    title: 'Home',
    path: '/Inicio',
    icon: <Icon icon="lucide:home" width="24" height="24" />,
    roles: [1, 2, 3], 
  },
  {
    title: 'Almacen',
    path: '/Almacen/Ingreso',
    icon: <Icon icon="lucide:warehouse" width="24" height="24" />,
    submenu: true,
    subMenuItems: [
      { title: 'Almacen', path: '/Almacen/Ingreso', enable: false },
      { title: 'Historial Almacen', path: '/Almacen/Historico', enable: false },
    ],
    roles: [1, 2, 3], 
  },
  {
    title: 'Productos',
    path: '/Productos/Catalogo',
    icon: <Icon icon="lucide:shopping-bag" width="24" height="24" />,
    roles: [1, 2],
  },
  {
    title: 'Ventas',
    path: '/Ventas/Crear',
    icon: <Icon icon="lucide:shopping-cart" width="24" height="24" />,
    submenu: true,
    subMenuItems: [
      { title: 'Ventas', path: '/Ventas/Crear', enable: false },
      { title: 'Historial Ventas', path: '/Ventas/Historial', enable: false },
    ],
    roles: [1, 2],
  },
  {
    title: 'Compras',
    path: '/Compras/Crear',
    icon: <Icon icon="lucide:package" width="24" height="24" />,
    submenu: true,
    subMenuItems: [
      { title: 'Compras', path: '/Compras/Crear', enable: false },
      { title: 'Historial Compras', path: '/Compras/Historial', enable: false },
    ],
    roles: [1, 2],
  },
  {
    title: 'Reportes',
    path: '/Reportes/Mostrar',
    icon: <Icon icon="lucide:bar-chart-2" width="24" height="24" />,
    submenu: true,
    subMenuItems: [
      { title: 'Estado Financiero', path: '/Reportes/Administrativos/EstadoFinanciero', enable: false },
      { title: 'Rentabilidad Productos', path: '/Reportes/Administrativos/Rentabilidad', enable: false },
      { title: 'Evolucion de Ventas', path: '/Reportes/Administrativos/EvolucionVentas', enable: false },
      { title: 'Clientes', path: '/Reportes/Administrativos/Clientes', enable: false },
      { title: 'Ventas por Producto', path: '/Reportes/Operacionales/VentasProductos', enable: false },

      { title: 'Almacen de Productos', path: '/Reportes/Operacionales/AlmacenProductos', enable: false },
      { title: 'Movimiento Almacen', path: '/Reportes/Operacionales/MovimientoAlmacen', enable: false },
      { title: 'Ventas Empleados', path: '/Reportes/Operacionales/VentasEmpleados', enable: false },
    ],
    roles: [1, 2],
  },
  {
    title: 'Usuarios',
    path: '/Usuarios/Mostrar',
    icon: <Icon icon="lucide:users" width="24" height="24" />,
    roles: [1, 2],
  },
  /*{
    title: 'Settings',
    path: '/settings',
    icon: <Icon icon="lucide:settings" width="24" height="24" />,
    submenu: true,
    subMenuItems: [
      { title: 'Account', path: '/settings/account', enable: false },
      { title: 'Privacy', path: '/settings/privacy', enable: false },
    ],
    enable: false,
    roles: [1, 2],
  },
  {
    title: 'Help',
    path: '/help',
    icon: <Icon icon="lucide:help-circle" width="24" height="24" />,
    enable: false,
    roles: [1, 2],
  },*/
];

'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox } from "@nextui-org/react";
import { Package, ChevronLeft, ChevronRight, Search, ShoppingCart, Trash2, Barcode } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '@/app/context/AuthContext';

interface DetallesProducto {
  id: number;
  productoID: number;
  codigoBarras: string | null;
  fechaVencimiento: string | null;
  cantidad: number;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stock: number;
  DetallesProducto: DetallesProducto[];
}

interface ProductoVenta extends Producto {
  cantidad: number;
  descuento: number;
  subtotal: number;
  total: number;
  codigoBarrasSeleccionado?: string;
}

interface Cliente {
  id?: number;
  carnet: string;
  nombre: string;
  correo: string;
}
const DESCUENTO_MAXIMO_PORCENTAJE = 50;
const PAGE_SIZE = 10;

export default function VentaComponent() {
  const { user } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registrarCliente, setRegistrarCliente] = useState(false);
  const [cliente, setCliente] = useState<Cliente>({ carnet: '', nombre: '', correo: '' });
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [cambio, setCambio] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductos(currentPage);
  }, [currentPage, searchTerm]);

  const fetchProductos = async (page: number) => {
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await axios.get<{data: Producto[], total: number}>(
        `/Api/producto/venta?skip=${skip}&take=${PAGE_SIZE}&search=${searchTerm}`
      );
      setProductos(response.data.data.map(p => ({
        ...p,
        precioVenta: Number(p.precioVenta),
        stock: Number(p.stock)
      })));
      setTotalProductos(response.data.total);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  const buscarCliente = async (carnet: string) => {
    try {
      const response = await axios.get<Cliente>(`/Api/cliente/${carnet}`);
      setClienteEncontrado(response.data);
      setCliente(response.data);
    } catch (error) {
      console.error('Error al buscar el cliente:', error);
      setClienteEncontrado(null);
      setCliente({ carnet, nombre: '', correo: '' });
    }
  };

  const registrarNuevoCliente = async () => {
    try {
      const response = await axios.post<Cliente>('/Api/cliente', cliente);
      setClienteEncontrado(response.data);
      Swal.fire({
        title: 'Éxito',
        text: 'Nuevo cliente registrado correctamente',
        icon: 'success',
        confirmButtonText: 'Ok'
      });
    } catch (error) {
      console.error('Error al registrar el nuevo cliente:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al registrar el nuevo cliente',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };

  const agregarProducto = (producto: Producto, cantidad = 1, codigoBarrasSeleccionado?: string) => {
    // Validar si hay suficiente stock antes de agregar
    if (cantidad > producto.stock) {
      Swal.fire({
        title: 'Error',
        text: `No hay suficiente stock. Stock disponible: ${producto.stock}`,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (codigoBarrasSeleccionado) {
      const productoExistente = productosVenta.find(p => 
        p.codigoBarrasSeleccionado === codigoBarrasSeleccionado
      );
      if (productoExistente) {
        Swal.fire({
          title: 'Código de barras duplicado',
          text: 'Este código de barras ya ha sido agregado a la venta.',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    } else {
      const productoExistente = productosVenta.find(p => 
        p.id === producto.id && !p.codigoBarrasSeleccionado
      );
      if (productoExistente) {
        Swal.fire({
          title: 'Producto ya agregado',
          text: 'Este producto ya ha sido agregado a la venta.',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    const nuevoProductoVenta: ProductoVenta = {
      ...producto,
      cantidad,
      descuento: 0,
      subtotal: producto.precioVenta * cantidad,
      total: producto.precioVenta * cantidad,
      codigoBarrasSeleccionado
    };
    setProductosVenta([...productosVenta, nuevoProductoVenta]);
  };

  const quitarProducto = (id: number, codigoBarrasSeleccionado?: string) => {
    setProductosVenta(productosVenta.filter(p => 
      !(p.id === id && p.codigoBarrasSeleccionado === codigoBarrasSeleccionado)
    ));
  };

  const actualizarCantidad = (id: number, cantidad: string, codigoBarrasSeleccionado?: string) => {
    setProductosVenta(productosVenta.map(p => {
      if (p.id === id && p.codigoBarrasSeleccionado === codigoBarrasSeleccionado) {
        if (!codigoBarrasSeleccionado) {
          const nuevaCantidad = cantidad === '' ? 0 : parseInt(cantidad);
          
          // Buscar el producto original para verificar el stock
          const productoOriginal = productos.find(prod => prod.id === id);
          
          if (productoOriginal) {
            // Si la nueva cantidad excede el stock
            if (nuevaCantidad > productoOriginal.stock) {
              Swal.fire({
                title: 'Error',
                text: `No hay suficiente stock. Stock disponible: ${productoOriginal.stock}`,
                icon: 'error',
                confirmButtonText: 'Ok'
              });
              // Mantener la cantidad anterior
              return p;
            }
            
            const subtotal = p.precioVenta * nuevaCantidad;
            const total = subtotal - p.descuento;
            return { ...p, cantidad: nuevaCantidad, subtotal, total };
          }
        }
      }
      return p;
    }));
  };
  
  const actualizarDescuento = (id: number, descuento: string, codigoBarrasSeleccionado?: string) => {
    setProductosVenta(productosVenta.map(p => {
      if (p.id === id && p.codigoBarrasSeleccionado === codigoBarrasSeleccionado) {
        const nuevoDescuento = descuento === '' ? 0 : Math.max(0, parseFloat(descuento));
        
        // Calcular el descuento máximo permitido (50% del subtotal)
        const descuentoMaximoPermitido = (p.subtotal * DESCUENTO_MAXIMO_PORCENTAJE) / 100;
  
        // Si el descuento excede el máximo permitido
        if (nuevoDescuento > descuentoMaximoPermitido) {
          Swal.fire({
            title: 'Error',
            text: `El descuento no puede superar el ${DESCUENTO_MAXIMO_PORCENTAJE}% del valor del producto (Máximo: Bs. ${descuentoMaximoPermitido.toFixed(2)})`,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          // Mantener el descuento anterior
          return p;
        }
  
        const total = p.subtotal - nuevoDescuento;
        return { ...p, descuento: nuevoDescuento, total: Math.max(0, total) };
      }
      return p;
    }));
  };

  const actualizarPrecio = (id: number, precio: string, codigoBarrasSeleccionado?: string) => {
    setProductosVenta(productosVenta.map(p => {
      if (p.id === id && p.codigoBarrasSeleccionado === codigoBarrasSeleccionado) {
        const nuevoPrecio = precio === '' ? 0 : Math.max(0, parseFloat(precio));
        const subtotal = nuevoPrecio * p.cantidad;
        const total = subtotal - p.descuento;
        return { ...p, precioVenta: nuevoPrecio, subtotal, total };
      }
      return p;
    }));
  };

  const calcularTotales = () => {
    return productosVenta.reduce((totales, p) => ({
      subtotal: totales.subtotal + p.subtotal,
      descuentoTotal: totales.descuentoTotal + p.descuento,
      total: totales.total + p.total
    }), { subtotal: 0, descuentoTotal: 0, total: 0 });
  };

  const calcularCambio = (monto: number) => {
    const totalVenta = calcularTotales().total;
    const nuevoMonto = monto || 0;
    setMontoRecibido(nuevoMonto);
    setCambio(Math.max(0, nuevoMonto - totalVenta));
  };

  const procesarVenta = async () => {
    setIsModalOpen(true);
  };

  const confirmarVenta = async () => {
    // Validar stock antes de procesar la venta
    const stockInsuficiente = productosVenta.some(productoVenta => {
      const productoOriginal = productos.find(p => p.id === productoVenta.id);
      return productoOriginal && productoVenta.cantidad > productoOriginal.stock;
    });

    if (stockInsuficiente) {
      Swal.fire({
        title: 'Error',
        text: 'Uno o más productos no tienen suficiente stock para completar la venta',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    const totales = calcularTotales();
    
    let clienteID = clienteEncontrado?.id;
  
    if (registrarCliente && !clienteEncontrado) {
      try {
        const nuevoCliente = await axios.post<Cliente>('/Api/cliente', cliente);
        clienteID = nuevoCliente.data.id;
      } catch (error) {
        console.error('Error al registrar el nuevo cliente:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al registrar el nuevo cliente',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
    }
  
    if (montoRecibido < totales.total) {
      Swal.fire({
        title: 'Error',
        text: 'El monto recibido es menor que el total de la venta',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
  
    const datosVenta = {
      subtotal: totales.subtotal,
      descuento: totales.descuentoTotal,
      total: totales.total,
      clienteID: clienteID || 2,
      usuarioIdRegistro: user?.id,
      montoRecibido,
      cambio
    };
  
    const detallesVenta = productosVenta.map(producto => ({
      productoID: producto.id,
      cantidad: producto.cantidad,
      precioUnitario: producto.precioVenta,
      descuento: producto.descuento,
      subtotal: producto.subtotal,
      total: producto.total,
      codigoBarras: producto.codigoBarrasSeleccionado
    }));
  
    try {
      const response = await axios.post('/Api/venta', { venta: datosVenta, detalles: detallesVenta });
      console.log('Venta procesada con éxito', response.data);
  
      if (registrarCliente && cliente.correo) {
        try {
          await axios.post('/Api/enviarfactura', {
            ventaId: response.data.ventaID,
            email: cliente.correo
          });
          console.log('Factura enviada por correo electrónico');
        } catch (emailError) {
          console.error('Error al enviar la factura por correo:', emailError);
          Swal.fire({
            title: 'Advertencia',
            text: 'La venta se procesó correctamente, pero hubo un problema al enviar la factura por correo electrónico.',
            icon: 'warning',
            confirmButtonText: 'Ok'
          });
        }
      }
  
      setProductosVenta([]);
      setIsModalOpen(false);
      setCliente({ carnet: '', nombre: '', correo: '' });
      setRegistrarCliente(false);
      setClienteEncontrado(null);
      setMontoRecibido(0);
      setCambio(0);
      Swal.fire({
        title: 'Éxito',
        text: 'Venta procesada correctamente' + (registrarCliente && cliente.correo ? ' y proforma enviada por correo' : ''),
        icon: 'success',
        confirmButtonText: 'Ok'
      });
    } catch (error) {
      console.error('Error al procesar la venta', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al procesar la venta',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };

  const handleCodigoBarras = async (codigo: string) => {
    try {
      const response = await axios.get<DetallesProducto>(`/Api/detallesproducto/codigobarras/${codigo}`);
      
      const detallesProducto = response.data;
      
      const productoExistente = productosVenta.find(p => p.codigoBarrasSeleccionado === detallesProducto.codigoBarras);
      
      if (productoExistente) {
        Swal.fire({
          title: 'Código de barras duplicado',
          text: 'Este código de barras ya ha sido agregado a la venta.',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      
      const productoEncontrado = productos.find(p => p.id === detallesProducto.productoID);
      
      if (productoEncontrado) {
        agregarProducto(productoEncontrado, 1, detallesProducto.codigoBarras || undefined);
      } else {
        console.log('Producto no encontrado en la lista actual. Buscando en la base de datos...');
        try {
          const productoResponse = await axios.get<Producto>(`/Api/producto/${detallesProducto.productoID}`);
          const productoCompleto = productoResponse.data;
          agregarProducto(productoCompleto, 1, detallesProducto.codigoBarras || undefined);
        } catch (error) {
          console.error('Error al buscar el producto en la base de datos:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo encontrar el producto asociado a este código de barras.',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        }
      }
    } catch (error) {
      console.error('Error al buscar el producto por código de barras:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al procesar el código de barra.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const codigo = e.target.value;
    setCodigoBarras(codigo);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCodigoBarras(codigoBarras);
      setCodigoBarras('');
    }
  };

  const handleCarnetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const carnet = e.target.value;
    setCliente({...cliente, carnet});
  };

  const handleCarnetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarCliente(cliente.carnet);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={codigoBarras}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escanear código de barras"
              className="pr-10"
              endContent={<Barcode className="text-gray-400" size={20} />}
            />
          </div>
        </div>
        <Button
          onClick={procesarVenta}
          className="bg-green-600 hover:bg-green-700 text-white ml-4"
          disabled={productosVenta.length === 0}
        >
          Procesar Venta
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Package className="mr-2" />
            Productos Disponibles
          </h2>
          <div className="mb-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                endContent={<Search className="text-gray-400" size={20} />}
              />
            </div>
          </div>
          <Table aria-label="Tabla de Productos Disponibles" selectionMode="single" onRowAction={(key) => {
            const producto = productos.find(p => p.id === Number(key));
            if (producto) agregarProducto(producto);
          }}>
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>DESCRIPCIÓN</TableColumn>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>
                    <div className="truncate max-w-xs" title={producto.descripcion}>
                      {producto.descripcion}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-2 flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-full bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium">
              {currentPage}/{Math.ceil(totalProductos / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(totalProductos / PAGE_SIZE)))}
              disabled={currentPage === Math.ceil(totalProductos / PAGE_SIZE)}
              className="p-1 rounded-full bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <ShoppingCart className="mr-2" />
            Productos en Venta
          </h2>
          <Table aria-label="Tabla de Productos en Venta">
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>CÓDIGO DE BARRAS</TableColumn>
              <TableColumn>PRECIO</TableColumn>
              <TableColumn>CANTIDAD</TableColumn>
              <TableColumn>DESCUENTO</TableColumn>
              <TableColumn>SUBTOTAL</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {productosVenta.map((producto, index) => (
                <TableRow key={`${producto.id}-${producto.codigoBarrasSeleccionado || index}`}>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.codigoBarrasSeleccionado || 'N/A'}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={producto.precioVenta === 0 ? '' : producto.precioVenta.toFixed(2)}
                      onChange={(e) => actualizarPrecio(producto.id, e.target.value, producto.codigoBarrasSeleccionado)}
                      min="0"
                      placeholder="0.00"
                      className="w-24" 
                    />
                  </TableCell>
                  <TableCell>
                    {producto.codigoBarrasSeleccionado ? (
                      producto.cantidad.toString()
                    ) : (
                      <Input
                        type="number"
                        value={producto.cantidad === 0 ? '' : producto.cantidad.toString()}
                        onChange={(e) => actualizarCantidad(producto.id, e.target.value, producto.codigoBarrasSeleccionado)}
                        min="0"
                        placeholder="0"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={producto.descuento === 0 ? '' : producto.descuento.toFixed(2)}
                      onChange={(e) => actualizarDescuento(producto.id, e.target.value, producto.codigoBarrasSeleccionado)}
                      min="0"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>Bs. {producto.subtotal.toFixed(2)}</TableCell>
                  <TableCell>Bs. {producto.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => quitarProducto(producto.id, producto.codigoBarrasSeleccionado)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 bg-white shadow-md rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-600">Subtotal</p>
                <p className="text-xl font-semibold">
                  Bs. {calcularTotales().subtotal.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Descuento Total</p>
                <p className="text-xl font-semibold text-red-600">
                  Bs. {calcularTotales().descuentoTotal.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Total Final</p>
                <p className="text-xl font-semibold text-green-600">
                  Bs. {calcularTotales().total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        size="xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Datos del Cliente y Pago</ModalHeader>
          <ModalBody>
            <Checkbox 
              isSelected={registrarCliente}
              onValueChange={setRegistrarCliente}
            >
              Registrar cliente en la compra
            </Checkbox>
            {registrarCliente && (
              <div className="space-y-4">
                <Input
                  label="Carnet"
                  placeholder="Ingrese el carnet"
                  value={cliente.carnet}
                  onChange={handleCarnetChange}
                  onKeyDown={handleCarnetKeyDown}
                />
                <Input
                  label="Nombre"
                  placeholder="Ingrese el nombre"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({...cliente, nombre: e.target.value})}
                  disabled={!!clienteEncontrado}
                />
                <Input
                  label="Correo"
                  placeholder="Ingrese el correo electrónico"
                  value={cliente.correo}
                  onChange={(e) => setCliente({...cliente, correo: e.target.value})}
                  disabled={!!clienteEncontrado}
                />
                {!clienteEncontrado && cliente.carnet && (
                  <Button color="primary" onPress={registrarNuevoCliente}>
                    Registrar Nuevo Cliente
                  </Button>
                )}
              </div>
            )}
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Resumen de la Venta</h3>
              <p>Subtotal: Bs. {calcularTotales().subtotal.toFixed(2)}</p>
              <p>Descuento Total: Bs. {calcularTotales().descuentoTotal.toFixed(2)}</p>
              <p>Total Final: Bs. {calcularTotales().total.toFixed(2)}</p>
            </div>
            <div className="mt-4 space-y-4">
              <Input
                type="number"
                label="Monto Recibido"
                placeholder="Ingrese el monto recibido"
                value={montoRecibido.toString()}
                onChange={(e) => calcularCambio(parseFloat(e.target.value))}
              />
              <p>Cambio a devolver: Bs. {cambio.toFixed(2)}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" onPress={confirmarVenta}>
              Confirmar Venta
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
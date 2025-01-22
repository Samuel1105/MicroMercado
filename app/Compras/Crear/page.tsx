'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Producto } from '@/type/types';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@nextui-org/react';
import { useAuth } from '@/app/context/AuthContext';
import Swal from 'sweetalert2'
import ProductosDisponibles from '@/components/CompraComponents/ProductisDisponibles';
import ProductosSeleccionados from '@/components/CompraComponents/ProductosSeleccionados';
import TotalesCompra from '@/components/CompraComponents/TotalesCompra';
import { ProductoSeleccionado } from '@/type/types';
const PAGE_SIZE = 10;



export default function Page() {
  const { user } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProductos, setSelectedProductos] = useState<ProductoSeleccionado[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);

  const fetchProductos = async (page: number) => {
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await axios.get(`/Api/producto/catalogo?skip=${skip}&take=${PAGE_SIZE}`);
      setProductos(response.data.data);
      setTotalProductos(response.data.total);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProductos(currentPage);
  }, [currentPage]);

  const calcularTotal = (producto: ProductoSeleccionado) => {
    if (producto.esPorMayor) {
      const subtotal = producto.cantidadMayor * producto.precioUnitarioMayor;
      return Math.max(0, subtotal - producto.descuentoMayor);
    } else {
      const subtotal = producto.cantidadIndividual * producto.precioUnitario;
      return Math.max(0, subtotal - producto.descuentoIndividual);
    }
  };

  const handleSelectProducto = (producto: Producto) => {
    if (!selectedProductos.find((p) => p.id === producto.id)) {
      const nuevoProductoSeleccionado: ProductoSeleccionado = {
        ...producto,
        esPorMayor: false,
        cantidadMayor: 0,
        precioUnitarioMayor: producto.precioVenta * 10,
        unidadesPorMayor: 10,
        cantidadIndividual: 1,
        precioUnitario: producto.precioVenta,
        descuentoMayor: 0,
        descuentoIndividual: 0,
        subtotal: producto.precioVenta,
        descuento: 0,
        total: producto.precioVenta,
        lotes: [] // Inicializamos el array de lotes vacío
      };
      setSelectedProductos([...selectedProductos, nuevoProductoSeleccionado]);
    }
  };

  const handleRemoveProducto = (id: Number) => {
    setSelectedProductos(selectedProductos.filter((p) => p.id !== id));
  };

  const actualizarProducto = (id: Number, actualizaciones: Partial<ProductoSeleccionado>) => {
    setSelectedProductos(selectedProductos.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, ...actualizaciones };
        const subtotal = productoActualizado.esPorMayor
          ? Number(productoActualizado.cantidadMayor) * Number(productoActualizado.precioUnitarioMayor)
          : Number(productoActualizado.cantidadIndividual) * Number(productoActualizado.precioUnitario);
        
        const descuento = productoActualizado.esPorMayor
          ? Number(productoActualizado.descuentoMayor)
          : Number(productoActualizado.descuentoIndividual);
  
        productoActualizado.subtotal = subtotal;
        productoActualizado.descuento = descuento;
        productoActualizado.total = Math.max(0, subtotal - descuento);
  
        return productoActualizado;
      }
      return producto;
    }));
  };

  const calcularTotales = () => {
    return selectedProductos.reduce((acc, producto) => {
      const subtotal = Number(producto.subtotal) || 0;
      const descuento = producto.esPorMayor 
        ? Number(producto.descuentoMayor) || 0
        : Number(producto.descuentoIndividual) || 0;
      const total = Number(producto.total) || 0;

      return {
        subtotal: acc.subtotal + subtotal,
        descuentoTotal: acc.descuentoTotal + descuento,
        total: acc.total + total
      };
    }, { subtotal: 0, descuentoTotal: 0, total: 0 });
  };

  const handleRealizarCompra = async () => {
    try {
      const totales = calcularTotales();

      const detalleCompra = selectedProductos.map(producto => ({
        productoID: producto.id,
        cantidadMayor: producto.esPorMayor ? producto.cantidadMayor : 0,
        precioUnitarioMayor: producto.esPorMayor ? producto.precioUnitarioMayor : 0,
        unidadesPorMayor: producto.esPorMayor ? producto.unidadesPorMayor : 0,
        cantidadIndividual: producto.esPorMayor ? 0 : producto.cantidadIndividual,
        precioUnitario: producto.esPorMayor ? 0 : producto.precioUnitario,
        descuentoMayor: producto.esPorMayor ? producto.descuentoMayor : 0,
        descuentoIndividual: producto.esPorMayor ? 0 : producto.descuentoIndividual,
        subtotal: producto.subtotal,
        descuento: producto.descuento,
        total: producto.total,
        unidadMedidaMayorId: producto.unidadMedidaMayorId,
        lotes: producto.lotes // Incluimos los lotes en el detalle
      }));
      console.log(detalleCompra)

      const datosCompra = {
        subtotal: totales.subtotal,
        descuentoTotal: totales.descuentoTotal,
        total: totales.total,
        user: user?.id
      };

      console.log("Datos de la compra:", datosCompra);
      console.log("Datos de la compra por producto:", detalleCompra);

      const response = await axios.post('/Api/compra', {
        datosCompra,
        detalleCompra
      });

      if (response.status === 201) {
        Swal.fire({
          icon: 'success',
          title: 'Compra realizada',
          text: 'La compra se ha realizado con éxito',
          confirmButtonText: 'Aceptar'
        });
        setSelectedProductos([]);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error("Error al realizar la compra:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al realizar la compra. Intenta nuevamente.',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const totales = calcularTotales();
  console.log(totales)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleRealizarCompra}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={selectedProductos.length === 0}
        >
          Realizar Compra
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <ProductosDisponibles
          productos={productos}
          currentPage={currentPage}
          totalProductos={totalProductos}
          onSelectProducto={handleSelectProducto}
          onPageChange={setCurrentPage}
        />

        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <ShoppingCart className="mr-2" />
            Productos Seleccionados
          </h2>
          <ProductosSeleccionados
            productos={selectedProductos}
            onUpdateProducto={actualizarProducto}
            onRemoveProducto={handleRemoveProducto}
          />
          <TotalesCompra totales={totales} />
        </div>
      </div>
    </div>
  );
}
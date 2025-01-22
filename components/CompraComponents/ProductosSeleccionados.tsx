import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { Checkbox, Select, SelectItem, Button, Input } from '@nextui-org/react';
import axios from 'axios';
import { ProductoSeleccionado, UnidadMedida } from '@/type/types';
import Swal from 'sweetalert2';

interface Lote {
  numeroLote: string;
  fechaVencimiento: Date;
  cantidad: number;
}

interface ProductoSeleccionadoConLotes extends ProductoSeleccionado {
  lotes: Lote[];
}

interface Props {
  productos: ProductoSeleccionadoConLotes[];
  onUpdateProducto: (id: Number, actualizaciones: Partial<ProductoSeleccionadoConLotes>) => void;
  onRemoveProducto: (id: Number) => void;
}

export default function ProductosSeleccionados({ productos, onUpdateProducto, onRemoveProducto }: Props) {
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [loteAbierto, setLoteAbierto] = useState<number | null>(null);
  const [tieneFecha, setTieneFecha] = useState<boolean>(false);
  const [nuevoLote, setNuevoLote] = useState<{
    numeroLote: string;
    fechaVencimiento: string;
  }>({
    numeroLote: '',
    fechaVencimiento: ''
  });

  useEffect(() => {
    const fetchUnidadesMedida = async () => {
      try {
        const response = await axios.get('/Api/unidadmedidas');
        setUnidadesMedida(response.data.data);
      } catch (error) {
        console.error("Error fetching unidades de medida:", error);
      }
    };

    fetchUnidadesMedida();
  }, []);

  const toggleTipoCompra = (id: Number) => {
    const producto = productos.find(p => p.id === id);
    if (producto) {
      onUpdateProducto(id, { 
        esPorMayor: !producto.esPorMayor,
        cantidadMayor: producto.esPorMayor ? 0 : 1,
        cantidadIndividual: producto.esPorMayor ? 1 : 0,
        descuentoMayor: 0,
        descuentoIndividual: 0,
        lotes: [] // Limpiar lotes al cambiar el tipo de compra
      });
    }
  };

  const handleInputChange = (
    id: Number,
    field: keyof ProductoSeleccionado,
    value: string,
    isInteger: boolean = false
  ) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    let parsedValue: number | string = value;
    
    if (value !== '') {
      if (isInteger) {
        if (!/^\d*$/.test(value)) return;
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) return;
      } else {
        if (!/^(\d*\.?\d*|\.\d*)$/.test(value)) return;
        parsedValue = value;
      }
    }

    const cantidad = producto.esPorMayor ? producto.cantidadMayor : producto.cantidadIndividual;
    const precio = producto.esPorMayor ? producto.precioUnitarioMayor : producto.precioUnitario;
    const subtotal = cantidad * (typeof precio === 'number' ? precio : parseFloat(precio) || 0);

    if (field === 'descuentoMayor' || field === 'descuentoIndividual') {
      const descuento = parseFloat(parsedValue as string);
      if (!isNaN(descuento) && descuento > subtotal) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El descuento no puede ser mayor al subtotal'
        });
        return;
      }
    }

    // Si se cambia la cantidad, validar y resetear los lotes si es necesario
    if (field === 'cantidadMayor' || field === 'cantidadIndividual' || field === 'unidadesPorMayor') {
      const updatedProducto = { ...producto, [field]: parsedValue };
      const cantidadTotal = updatedProducto.esPorMayor 
        ? updatedProducto.cantidadMayor * updatedProducto.unidadesPorMayor 
        : updatedProducto.cantidadIndividual;
      
      const cantidadLotes = producto.lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
      
      if (cantidadLotes > cantidadTotal) {
        onUpdateProducto(id, { 
          [field]: parsedValue,
          lotes: [] // Limpiar lotes si la nueva cantidad es menor
        });
        Swal.fire({
          icon: 'warning',
          title: 'Lotes reiniciados',
          text: 'Se han eliminado los lotes debido al cambio en la cantidad total'
        });
        return;
      }
    }

    onUpdateProducto(id, { [field]: parsedValue });
  };

  const handleAgregarLote = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    if (!nuevoLote.numeroLote.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El número de lote es requerido'
      });
      return;
    }

    if (tieneFecha && !nuevoLote.fechaVencimiento) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La fecha de vencimiento es requerida'
      });
      return;
    }

    // Calcular la cantidad total disponible
    const cantidadTotal = producto.esPorMayor 
      ? producto.cantidadMayor * producto.unidadesPorMayor 
      : producto.cantidadIndividual;

    // Calcular la cantidad ya asignada a otros lotes
    const cantidadAsignada = producto.lotes.reduce((sum, lote) => sum + lote.cantidad, 0);

    // La cantidad para este nuevo lote será lo que falta por asignar
    const cantidadLote = cantidadTotal - cantidadAsignada;

    if (cantidadLote <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya se ha asignado toda la cantidad a otros lotes'
      });
      return;
    }

    const nuevoLoteCompleto: Lote = {
      numeroLote: nuevoLote.numeroLote,
      fechaVencimiento: tieneFecha ? new Date(nuevoLote.fechaVencimiento) : new Date(0),
      cantidad: cantidadLote
    };

    onUpdateProducto(productoId, {
      lotes: [...producto.lotes, nuevoLoteCompleto]
    });

    setNuevoLote({
      numeroLote: '',
      fechaVencimiento: ''
    });
    setLoteAbierto(null);
    setTieneFecha(false);
  };

  const handleRemoverLote = (productoId: number, index: number) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const nuevosLotes = [...producto.lotes];
    nuevosLotes.splice(index, 1);
    onUpdateProducto(productoId, { lotes: nuevosLotes });
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad de Medida</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades por Mayor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {productos.map((producto) => (
            <React.Fragment key={producto.id.toString()}>
              <tr>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium">{producto.nombre}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs" title={producto.descripcion}>
                      {producto.descripcion}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Checkbox
                    isSelected={producto.esPorMayor}
                    onChange={() => toggleTipoCompra(producto.id)}
                  >
                    {producto.esPorMayor ? 'Por mayor' : 'Por unidad'}
                  </Checkbox>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={producto.esPorMayor 
                      ? (producto.cantidadMayor === 0 ? '' : producto.cantidadMayor.toString())
                      : (producto.cantidadIndividual === 0 ? '' : producto.cantidadIndividual.toString())
                    }
                    onChange={(e) => handleInputChange(
                      producto.id,
                      producto.esPorMayor ? 'cantidadMayor' : 'cantidadIndividual',
                      e.target.value,
                      true
                    )}
                    className="w-16 px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {producto.esPorMayor && (
                    <Select
                      value={producto.unidadMedidaMayorId?.toString() || ''}
                      onChange={(e) => onUpdateProducto(producto.id, { unidadMedidaMayorId: parseInt(e.target.value) })}
                      className="w-32"
                    >
                      {unidadesMedida.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id.toString()}>
                          {unidad.nombre}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {producto.esPorMayor && (
                    <input
                      type="text"
                      value={producto.unidadesPorMayor === 0 ? '' : producto.unidadesPorMayor.toString()}
                      onChange={(e) => handleInputChange(producto.id, 'unidadesPorMayor', e.target.value, true)}
                      className="w-16 px-2 py-1 border rounded-md"
                    />
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={producto.esPorMayor
                      ? (producto.precioUnitarioMayor === 0 ? '' : producto.precioUnitarioMayor.toString())
                      : (producto.precioUnitario === 0 ? '' : producto.precioUnitario.toString())
                    }
                    onChange={(e) => handleInputChange(
                      producto.id,
                      producto.esPorMayor ? 'precioUnitarioMayor' : 'precioUnitario',
                      e.target.value
                    )}
                    className="w-20 px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={producto.esPorMayor
                      ? (producto.descuentoMayor === 0 ? '' : producto.descuentoMayor.toString())
                      : (producto.descuentoIndividual === 0 ? '' : producto.descuentoIndividual.toString())
                    }
                    onChange={(e) => handleInputChange(
                      producto.id,
                      producto.esPorMayor ? 'descuentoMayor' : 'descuentoIndividual',
                      e.target.value
                    )}
                    className="w-20 px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {typeof producto.total === 'number'
                      ? producto.total.toFixed(2)
                      : Number(producto.total).toFixed(2) || '0.00'} Bs.
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onRemoveProducto(producto.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                  >
                    <X size={20} />
                  </button>
                </td>
              </tr>
              <tr>
                <td colSpan={9} className="px-4 py-2 bg-gray-50">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center">
                        <Package className="mr-2" size={20} />
                        Lotes
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setLoteAbierto(loteAbierto === producto.id ? null : Number(producto.id))}
                        className="bg-blue-500 text-white"
                      >
                       {loteAbierto === producto.id ? 'Cerrar' : 'Agregar Lote'}
                      </Button>
                    </div>

                    {loteAbierto === producto.id && (
                      <div className="grid grid-cols-2 gap-2 mb-2 bg-white p-4 rounded-md">
                        <Input
                          label="Número de Lote"
                          value={nuevoLote.numeroLote}
                          onChange={(e) => setNuevoLote({...nuevoLote, numeroLote: e.target.value})}
                          size="sm"
                          placeholder="Ej: L001"
                        />
                        <div className="flex items-center">
                          <Checkbox
                            isSelected={tieneFecha}
                            onValueChange={(checked: boolean) => {
                              setTieneFecha(checked);
                              if (!checked) {
                                setNuevoLote({...nuevoLote, fechaVencimiento: ''});
                              }
                            }}
                          >
                            Tiene fecha de vencimiento
                          </Checkbox>
                        </div>
                        
                        {tieneFecha && (
                          <div className="col-span-2">
                            <Input
                              type="date"
                              label="Fecha de Vencimiento"
                              value={nuevoLote.fechaVencimiento}
                              onChange={(e) => setNuevoLote({...nuevoLote, fechaVencimiento: e.target.value})}
                              size="sm"
                            />
                          </div>
                        )}

                        <Button
                          className="bg-green-500 text-white col-span-2"
                          onClick={() => handleAgregarLote(Number(producto.id))}
                        >
                          Agregar Lote
                        </Button>
                      </div>
                    )}

                    {producto.lotes && producto.lotes.length > 0 ? (
                      <div className="bg-white rounded-md overflow-hidden mt-2">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-xs font-medium text-gray-500">Nº Lote</th>
                              <th className="px-4 py-2 text-xs font-medium text-gray-500">Vencimiento</th>
                              <th className="px-4 py-2 text-xs font-medium text-gray-500">Cantidad Asignada</th>
                              <th className="px-4 py-2 text-xs font-medium text-gray-500">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {producto.lotes.map((lote, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-center">{lote.numeroLote}</td>
                                <td className="px-4 py-2 text-sm text-center">
                                  {lote.fechaVencimiento && lote.fechaVencimiento.getTime() !== 0 
                                    ? new Date(lote.fechaVencimiento).toLocaleDateString()
                                    : 'Sin fecha'}
                                </td>
                                <td className="px-4 py-2 text-sm text-center font-medium">
                                  {lote.cantidad} {producto.esPorMayor ? 'unidades' : 'unidad(es)'}
                                </td>
                                <td className="px-4 py-2 text-sm text-center">
                                  <button
                                    onClick={() => handleRemoverLote(Number(producto.id), index)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50">
                              <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">
                                Total a asignar:
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-center">
                                {producto.esPorMayor 
                                  ? producto.cantidadMayor * producto.unidadesPorMayor 
                                  : producto.cantidadIndividual} unidades
                              </td>
                              <td></td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">
                                Cantidad restante:
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-center">
                                {(producto.esPorMayor 
                                  ? producto.cantidadMayor * producto.unidadesPorMayor 
                                  : producto.cantidadIndividual) - 
                                  producto.lotes.reduce((sum, lote) => sum + lote.cantidad, 0)} unidades
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4 bg-white rounded-md mt-2">
                        No hay lotes registrados
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
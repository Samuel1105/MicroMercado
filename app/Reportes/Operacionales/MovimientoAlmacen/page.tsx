'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, DateRangePicker, Input, Tabs, Tab, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Pagination, Badge } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { Search, PackageCheck, PackageMinus, AlertTriangle, Calendar } from "lucide-react";
import axios from 'axios';

// types.ts
interface UnidadMedida {
  id: number;
  nombre: string;
}

interface Lote {
  id: number;
  numeroLote: string;
  fechaVencimiento: string | null;
  cantidadInicial: number;
  cantidadUsada: number;
  cantidadRestante: number;
  estado: number;
}

interface Cantidad {
  cantidadMayor: number;
  cantidadIndividual: number;
  total: number;
  unidadMedidaMayorId: number | null;
  lotes?: Lote[];
}

interface Egreso extends Cantidad {
  id: number;
  fecha: string;
  unidadMedida: string;
  lote: {
    id: number;
    numeroLote: string;
    fechaVencimiento: string | null;
  } | null;
}

interface Movimiento {
  id: number;
  fechaCompra: string;
  producto: {
    id: number;
    nombre: string;
    categoria: string;
    unidadMedida: string;
    unidadMedidaMayorId: number | null;
    unidadesPorMayor: number | null;
  };
  ingresos: Cantidad & { lotes: Lote[] };
  egresos: Egreso[];
  cantidadRestante: Cantidad & { lotes: Lote[] };
}

const ITEMS_PER_PAGE = 10;

export default function MovimientoAlmacenPage() {
  const [dateRange, setDateRange] = useState({
    start: today('America/La_Paz').subtract({ months: 1 }),
    end: today('America/La_Paz')
  });
  const [data, setData] = useState<any>(null);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState("todos");

  useEffect(() => {
    fetchData();
    fetchUnidadesMedida();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/Api/reportes/movimiento-almacen?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      setData(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnidadesMedida = async () => {
    try {
      const response = await axios.get<{ data: UnidadMedida[] }>('/Api/unidadmedidas');
      setUnidadesMedida(response.data.data);
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
    }
  };

  const getUnidadMedidaNombre = (id: number | null) => {
    if (id === null) return 'unidades';
    const unidad = unidadesMedida.find(u => u.id === id);
    return unidad ? unidad.nombre.toLowerCase() : 'unidades';
  };

  const formatCantidad = (cantidad: Cantidad, unidadMedidaId?: number | null, unidadesPorMayor?: number | null) => {
    if (!cantidad) return '0 unidades';
    
    const unidadMayor = getUnidadMedidaNombre(unidadMedidaId || cantidad.unidadMedidaMayorId);
    
    if (cantidad.unidadMedidaMayorId === null || cantidad.cantidadMayor === 0) {
      return `${cantidad.total} unidades`;
    }

    let formato = '';
    if (cantidad.cantidadMayor > 0) {
      formato += `${cantidad.cantidadMayor} ${unidadMayor}`;
      if (unidadesPorMayor) {
        formato += ` (${cantidad.cantidadMayor * unidadesPorMayor} unidades)`;
      }
    }
    if (cantidad.cantidadIndividual > 0) {
      if (formato) formato += ' y ';
      formato += `${cantidad.cantidadIndividual} unidades`;
    }
    return formato || '0 unidades';
  };

  const getLoteStatus = (lote: Lote) => {
    if (!lote.fechaVencimiento) return 'normal';
    
    const diasParaVencer = Math.ceil(
      (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    
    return diasParaVencer <= 0 ? 'vencido' :
           diasParaVencer <= 30 ? 'por-vencer' :
           'normal';
};

  const formatLoteInfo = (lote: Lote) => {
    // Si el lote no tiene fecha de vencimiento, mostrar un estado normal sin fecha
    if (!lote.fechaVencimiento) {
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            Lote: {lote.numeroLote} - {lote.cantidadRestante} unidades
            <Badge color="default">Sin fecha de vencimiento</Badge>
          </span>
        </div>
      );
    }

    // Si tiene fecha, proceder con la lógica de vencimiento
    const diasParaVencer = Math.ceil(
      (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );

    const estado = diasParaVencer <= 0 ? 'vencido' : 
                   diasParaVencer <= 30 ? 'por-vencer' : 
                   'normal';

    const colorClass = {
      'vencido': 'text-red-600',
      'por-vencer': 'text-amber-600',
      'normal': 'text-gray-600'
    }[estado];

    return (
      <div className={`flex items-center gap-2 ${colorClass}`}>
        <Calendar className="w-4 h-4" />
        <span>
          Lote: {lote.numeroLote} - {lote.cantidadRestante} unidades
          {` (Vence: ${new Date(lote.fechaVencimiento).toLocaleDateString()})`}
          {estado === 'vencido' && <Badge color="danger">Vencido</Badge>}
          {estado === 'por-vencer' && <Badge color="warning">Por vencer</Badge>}
        </span>
      </div>
    );
};

  const filteredMovimientos = data?.movimientos?.filter((movimiento: Movimiento) => {
    const matchesSearch = movimiento.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movimiento.producto.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (selectedTab) {
      case "con_stock":
        return matchesSearch && movimiento.cantidadRestante.total > 0;
      case "sin_stock":
        return matchesSearch && movimiento.cantidadRestante.total === 0;
      case "por_vencer":
        return matchesSearch && movimiento.cantidadRestante.lotes.some(lote => {
          if (!lote.fechaVencimiento) return false;
          const diasParaVencer = Math.ceil(
            (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          return diasParaVencer <= 30 && diasParaVencer > 0;
        });
      default:
        return matchesSearch;
    }
  }) || [];

  const paginatedMovimientos = filteredMovimientos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4">
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
          <h1 className="text-2xl font-bold text-gray-800">Movimientos de Almacén</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateRangePicker
              label="Período de análisis"
              value={dateRange}
              onChange={setDateRange}
            />
            <Input
              type="text"
              label="Buscar producto"
              placeholder="Nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="text-gray-400" size={20} />}
            />
          </div>
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={setSelectedTab as any}
            className="mt-4"
          >
            <Tab key="todos" title="Todos"/>
            <Tab key="con_stock" title="Con Stock"/>
            <Tab key="sin_stock" title="Sin Stock"/>
            <Tab key="por_vencer" title="Por Vencer"/>
          </Tabs>
        </CardHeader>

        <CardBody className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" label="Cargando datos..." />
            </div>
          ) : data ? (
            <>
              {/* Resumen Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Card className="bg-emerald-50">
                  <CardBody className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <PackageCheck size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {data.resumen.totalIngresos}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-red-50">
                  <CardBody className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <PackageMinus size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-red-600 font-medium">Egresos Totales</p>
                      <p className="text-2xl font-bold text-red-800">
                        {data.resumen.totalEgresos}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-blue-50">
                  <CardBody className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PackageCheck size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Con Stock</p>
                      <p className="text-2xl font-bold text-blue-800">
                      {filteredMovimientos.filter((m: Movimiento) => m.cantidadRestante.total > 0).length}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-amber-50">
                  <CardBody className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Por Vencer</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {data.resumen.lotesPorVencer}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Tabla Principal */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ingresos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Egresos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock por Lote
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMovimientos.map((movimiento: Movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(movimiento.fechaCompra).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {movimiento.producto.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {movimiento.producto.categoria}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-emerald-600">
                            {formatCantidad(
                              movimiento.ingresos,
                              movimiento.producto.unidadMedidaMayorId,
                              movimiento.producto.unidadesPorMayor
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {movimiento.ingresos.lotes.map(lote => (
                             <div key={lote.id}>
                             {formatLoteInfo(lote)}
                           </div>
                         ))}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm text-red-600">
                         {movimiento.egresos.length} movimientos
                       </div>
                       <div className="text-xs text-gray-500">
                         Total: {movimiento.egresos.reduce((sum, e) => sum + e.total, 0)} unidades
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm text-blue-600">
                         {formatCantidad(
                           movimiento.cantidadRestante,
                           movimiento.producto.unidadMedidaMayorId,
                           movimiento.producto.unidadesPorMayor
                         )}
                       </div>
                       <div className="text-xs space-y-1 mt-1">
                         {movimiento.cantidadRestante.lotes.map(lote => (
                           <div key={lote.id}>
                             {formatLoteInfo(lote)}
                           </div>
                         ))}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-center">
                       <Button
                         size="sm"
                         color="primary"
                         onPress={() => {
                           setSelectedMovimiento(movimiento);
                           setIsModalOpen(true);
                         }}
                       >
                         Ver Detalles
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>

             <div className="flex justify-center mt-4">
               <Pagination
                 total={Math.ceil(filteredMovimientos.length / ITEMS_PER_PAGE)}
                 page={currentPage}
                 onChange={setCurrentPage}
               />
             </div>
           </div>
         </>
       ) : null}
     </CardBody>
   </Card>

   {/* Modal de Detalle de Movimientos */}
   <Modal
     isOpen={isModalOpen}
     onClose={() => {
       setIsModalOpen(false);
       setSelectedMovimiento(null);
     }}
     size="5xl"
     scrollBehavior="inside"
   >
     <ModalContent>
       <ModalHeader className="flex flex-col gap-1">
         <h3 className="text-lg font-semibold">
           Detalles - {selectedMovimiento?.producto.nombre}
         </h3>
         <p className="text-sm text-gray-500">
           {selectedMovimiento?.producto.categoria}
         </p>
       </ModalHeader>
       <ModalBody>
         <div className="space-y-4">
           {/* Información de Ingreso con Lotes */}
           <div className="bg-emerald-50 p-4 rounded-lg">
             <div className="text-sm font-medium text-gray-600">Ingreso Original</div>
             <div className="text-lg font-semibold text-emerald-600">
               {selectedMovimiento && formatCantidad(
                 selectedMovimiento.ingresos,
                 selectedMovimiento.producto.unidadMedidaMayorId,
                 selectedMovimiento.producto.unidadesPorMayor
               )}
             </div>
             <div className="text-sm text-gray-500">
               Fecha: {selectedMovimiento && new Date(selectedMovimiento.fechaCompra).toLocaleString()}
             </div>
             <div className="mt-2">
               <div className="text-sm font-medium text-gray-600">Lotes Ingresados:</div>
               <div className="space-y-2 mt-1">
                 {selectedMovimiento?.ingresos.lotes.map((lote) => (
                   <div key={lote.id} className="bg-white p-2 rounded border border-emerald-100">
                     {formatLoteInfo(lote)}
                     <div className="ml-6 mt-1 text-sm text-gray-500">
                       <div>Cantidad Inicial: {lote.cantidadInicial} unidades</div>
                       <div>Cantidad Usada: {lote.cantidadUsada} unidades</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>

           {/* Lista de Egresos con información de Lotes */}
           <div className="divide-y divide-gray-200">
             <div className="text-lg font-medium text-gray-700 py-2">
               Historial de Egresos
             </div>
             {selectedMovimiento?.egresos.length === 0 ? (
               <div className="text-center py-8 text-gray-500">
                 No hay egresos registrados
               </div>
             ) : (
               selectedMovimiento?.egresos.map((egreso) => (
                 <div key={egreso.id} className="py-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="text-red-600 font-medium">
                         {formatCantidad(
                           egreso,
                           selectedMovimiento.producto.unidadMedidaMayorId,
                           selectedMovimiento.producto.unidadesPorMayor
                         )}
                       </div>
                       <div className="text-sm text-gray-500">
                         Total en unidades: {egreso.total}
                       </div>
                       {egreso.lote && (
                         <div className="mt-1 text-sm">
                           {formatLoteInfo(egreso.lote as Lote)}
                         </div>
                       )}
                     </div>
                     <div className="text-sm text-gray-500">
                       {new Date(egreso.fecha).toLocaleString()}
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>

           {/* Stock Actual por Lote */}
           <div className="bg-blue-50 p-4 rounded-lg">
             <div className="text-sm font-medium text-gray-600">Stock Actual por Lote</div>
             <div className="space-y-2 mt-2">
               {selectedMovimiento?.cantidadRestante.lotes.length === 0 ? (
                 <div className="text-center py-4 text-gray-500">
                   No hay stock disponible
                 </div>
               ) : (
                 selectedMovimiento?.cantidadRestante.lotes.map((lote) => (
                   <div key={lote.id} className="bg-white p-3 rounded border border-blue-100">
                     {formatLoteInfo(lote)}
                     <div className="ml-6 mt-1 grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="text-gray-500">Cantidad Inicial: </span>
                         <span className="font-medium">{lote.cantidadInicial} unidades</span>
                       </div>
                       <div>
                         <span className="text-gray-500">Cantidad Actual: </span>
                         <span className="font-medium">{lote.cantidadRestante} unidades</span>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
             <div className="mt-4 pt-3 border-t border-blue-200">
               <div className="text-lg font-semibold text-blue-600">
                 Total Disponible: {selectedMovimiento?.cantidadRestante.total} unidades
               </div>
             </div>
           </div>

           {/* Resumen de Movimientos */}
           <div className="bg-gray-50 p-4 rounded-lg">
             <div className="grid grid-cols-3 gap-4">
               <div>
                 <div className="text-sm text-gray-500">Total Ingresos</div>
                 <div className="text-lg font-semibold text-emerald-600">
                   {selectedMovimiento?.ingresos.total} unidades
                 </div>
               </div>
               <div>
                 <div className="text-sm text-gray-500">Total Egresos</div>
                 <div className="text-lg font-semibold text-red-600">
                   {selectedMovimiento?.egresos.reduce((sum, e) => sum + e.total, 0)} unidades
                 </div>
               </div>
               <div>
                 <div className="text-sm text-gray-500">Lotes Activos</div>
                 <div className="text-lg font-semibold text-blue-600">
                   {selectedMovimiento?.cantidadRestante.lotes.length} lotes
                 </div>
               </div>
             </div>
           </div>
         </div>
       </ModalBody>
       <ModalFooter>
         <Button
           color="primary"
           variant="light"
           onPress={() => {
             setIsModalOpen(false);
             setSelectedMovimiento(null);
           }}
         >
           Cerrar
         </Button>
       </ModalFooter>
     </ModalContent>
   </Modal>
 </div>
);
}
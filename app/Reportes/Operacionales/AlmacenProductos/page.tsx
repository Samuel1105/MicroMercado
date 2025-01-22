'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, DateRangePicker, Input, Tabs, Tab } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Search, Package, AlertTriangle, Archive, TrendingDown } from "lucide-react";

interface ProductoAlmacen {
  id: number;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockActual: number;
  nivelOptimo: number;
  bajoPuntoReorden: boolean;
  estado: number;
  estadoInventario: {
    totalIngresos: number;
    totalEgresos: number;
    stockActual: number;
  };
  alertas: {
    bajoPuntoReorden: boolean;
    cantidadFaltante: number;
    productosProximosVencer: number;
    detalleProximosVencer: {
      id: number;
      fechaVencimiento: Date;
      cantidad: number;
    }[];
  };
}

interface ResumenAlmacen {
  totalProductos: number;
  productosBajoPuntoReorden: number;
  productosConAlertaVencimiento: number;
  productosSinStock: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AlmacenPage() {
  // Estados
  const [dateRange, setDateRange] = useState({
    start: today('America/La_Paz').subtract({ months: 1 }),
    end: today('America/La_Paz')
  });
  const [productosData, setProductosData] = useState<ProductoAlmacen[] | null>(null);
  const [resumen, setResumen] = useState<ResumenAlmacen | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('general');
  const [selectedProducto, setSelectedProducto] = useState<ProductoAlmacen | null>(null);

  // Cargar datos
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/Api/reportes/almacen-productos');
      if (!response.ok) throw new Error('Error al cargar los datos');
      const { data, resumen } = await response.json();
      setProductosData(data);
      setResumen(resumen);
    } catch (error) {
      setError('No se pudieron cargar los datos del almacén');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    if (!productosData) return [];
    return productosData
      .filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.stockActual - a.stockActual);
  }, [productosData, searchTerm]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Estado del Almacén</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label="Buscar producto"
            placeholder="Nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<Search className="text-gray-400" size={20} />}
          />
          <Button
            color="primary"
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : 'Actualizar Datos'}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">{error}</div>
        ) : (
          <>
            {/* Resumen General */}
            {resumen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Productos</p>
                      <p className="text-2xl font-bold text-blue-800">{resumen.totalProductos}</p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-red-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-red-600 font-medium">Bajo Stock</p>
                      <p className="text-2xl font-bold text-red-800">{resumen.productosBajoPuntoReorden}</p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-amber-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Archive size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Por Vencer</p>
                      <p className="text-2xl font-bold text-amber-800">{resumen.productosConAlertaVencimiento}</p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-gray-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <TrendingDown size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sin Stock</p>
                      <p className="text-2xl font-bold text-gray-800">{resumen.productosSinStock}</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
            >
              <Tab key="general" title="Vista General">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Productos con Bajo Stock */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Productos con Bajo Stock</h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productosFiltrados.filter(p => p.bajoPuntoReorden).slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="nombre"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="stockActual"
                            name="Stock Actual"
                            fill="#ef4444"
                          />
                          <Bar
                            dataKey="nivelOptimo"
                            name="Nivel Óptimo"
                            fill="#3b82f6"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Distribución por Categorías */}
                  {productosFiltrados.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Estado por Categorías</h3>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              dataKey="cantidad"
                              data={Object.values(
                                productosFiltrados.reduce((acc: any, producto) => {
                                  if (!acc[producto.categoria]) {
                                    acc[producto.categoria] = {
                                      name: producto.categoria,
                                      cantidad: 0,
                                      bajoPuntoReorden: 0
                                    };
                                  }
                                  acc[producto.categoria].cantidad++;
                                  if (producto.bajoPuntoReorden) {
                                    acc[producto.categoria].bajoPuntoReorden++;
                                  }
                                  return acc;
                                }, {})
                              )}
                              cx="50%"
                              cy="50%"
                              outerRadius={150}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </div>
              </Tab>

              <Tab key="detalle" title="Detalle de Productos">
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Stock Actual
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Nivel Óptimo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productosFiltrados.map((producto) => (
                        <tr
                          key={producto.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedProducto(producto)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {producto.nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {producto.categoria}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {producto.stockActual} {producto.unidadMedida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {producto.nivelOptimo} {producto.unidadMedida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              producto.stockActual === 0
                                ? 'bg-red-100 text-red-800'
                                : producto.bajoPuntoReorden
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {producto.stockActual === 0
                                ? 'Sin Stock'
                                : producto.bajoPuntoReorden
                                ? 'Bajo Stock'
                                : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {productosFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      No se encontraron productos que coincidan con la búsqueda
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>

            {/* Modal de Detalle de Producto */}
            {selectedProducto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <CardHeader className="flex justify-between items-center p-6 bg-gray-50">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedProducto.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedProducto.categoria}
                      </p>
                    </div>
                    <Button
                      color="default"
                      variant="light"
                      size="sm"
                      onClick={() => setSelectedProducto(null)}
                    >
                      Cerrar
                      </Button>
                  </CardHeader>
                  <CardBody className="p-6">
                    {/* Resumen del producto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Stock Actual</p>
                        <p className="text-xl font-bold text-blue-900">
                          {selectedProducto.stockActual} {selectedProducto.unidadMedida}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Nivel Óptimo</p>
                        <p className="text-xl font-bold text-green-900">
                          {selectedProducto.nivelOptimo} {selectedProducto.unidadMedida}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Cantidad Faltante</p>
                        <p className="text-xl font-bold text-purple-900">
                          {Math.max(0, selectedProducto.alertas.cantidadFaltante)} {selectedProducto.unidadMedida}
                        </p>
                      </div>
                    </div>

                    {/* Movimientos del producto */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-4">Movimientos del Inventario</h4>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            {
                              name: 'Ingresos',
                              cantidad: selectedProducto.estadoInventario.totalIngresos,
                              color: '#22c55e'
                            },
                            {
                              name: 'Egresos',
                              cantidad: selectedProducto.estadoInventario.totalEgresos,
                              color: '#ef4444'
                            },
                            {
                              name: 'Stock Actual',
                              cantidad: selectedProducto.estadoInventario.stockActual,
                              color: '#3b82f6'
                            }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="cantidad" name="Cantidad">
                              {
                                [0, 1, 2].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#22c55e', '#ef4444', '#3b82f6'][index]} />
                                ))
                              }
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Alertas y vencimientos */}
                    {selectedProducto.alertas.productosProximosVencer > 0 && (
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">
                          Productos Próximos a Vencer
                        </h4>
                        <div className="space-y-2">
                          {selectedProducto.alertas.detalleProximosVencer.map((detalle) => (
                            <div key={detalle.id} className="flex justify-between items-center text-sm">
                              <span className="text-amber-700">
                                {new Date(detalle.fechaVencimiento).toLocaleDateString()}
                              </span>
                              <span className="font-medium text-amber-900">
                                {detalle.cantidad} {selectedProducto.unidadMedida}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estado y recomendaciones */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">
                        Estado y Recomendaciones
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className={`${selectedProducto.bajoPuntoReorden ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedProducto.bajoPuntoReorden 
                            ? '⚠️ Producto con bajo stock. Se recomienda realizar una nueva compra.'
                            : '✅ Nivel de stock saludable.'}
                        </p>
                        {selectedProducto.alertas.productosProximosVencer > 0 && (
                          <p className="text-amber-600">
                            ⚠️ Hay unidades próximas a vencer. Considerar promociones o ventas especiales.
                          </p>
                        )}
                        {selectedProducto.stockActual === 0 && (
                          <p className="text-red-600">
                            🚫 Sin stock disponible. Atención urgente requerida.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
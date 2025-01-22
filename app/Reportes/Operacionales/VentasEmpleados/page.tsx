'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, DateRangePicker, Input, Tabs, Tab } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, TrendingUp, ShoppingCart, Users, Award } from "lucide-react";
import axios from 'axios';

// Tipos importados de la API
interface VentaEmpleado {
  usuarioId: number;
  nombreEmpleado: string;
  totalVentas: number;
  cantidadVentas: number;
  promedioVentaPorTransaccion: number;
  ventasPorDia: {
    fecha: string;
    total: number;
    cantidad: number;
  }[];
  productosMasVendidos: {
    productoId: number;
    nombreProducto: string;
    cantidad: number;
    total: number;
  }[];
  metricas: {
    ventaMaxima: number;
    ventaMinima: number;
    descuentosOtorgados: number;
    ticketPromedio: number;
  };
}

interface ResumenGeneral {
  totalVentasGlobal: number;
  cantidadVentasGlobal: number;
  promedioVentaGlobal: number;
  mejorVendedor: {
    nombreEmpleado: string;
    totalVentas: number;
  };
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function VentasEmpleadosPage() {
  // Estados
  const [dateRange, setDateRange] = useState({
    start: today('America/La_Paz').subtract({ months: 1 }),
    end: today('America/La_Paz')
  });
  const [data, setData] = useState<VentaEmpleado[] | null>(null);
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('general');
  const [selectedEmpleado, setSelectedEmpleado] = useState<VentaEmpleado | null>(null);

  // Cargar datos
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/Api/reportes/venta-empleados?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      setData(response.data.data.vendedores);
      setResumen(response.data.data.resumen);
    } catch (error) {
      setError('Error al cargar los datos de ventas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar empleados
  const empleadosFiltrados = useMemo(() => {
    if (!data) return [];
    return data.filter(empleado => 
      empleado.nombreEmpleado.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.totalVentas - a.totalVentas);
  }, [data, searchTerm]);

  // Formatear moneda
  const formatMoney = (amount: number) => `Bs. ${amount.toFixed(2)}`;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Análisis de Ventas por Empleado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DateRangePicker
            label="Período de análisis"
            value={dateRange}
            onChange={setDateRange}
            className="max-w-xs"
          />
          <Input
            type="text"
            label="Buscar empleado"
            placeholder="Nombre del empleado..."
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
            {/* Resumen Cards */}
            {resumen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Ventas</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatMoney(resumen.totalVentasGlobal)}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-green-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Promedio por Venta</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatMoney(resumen.promedioVentaGlobal)}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-amber-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Users size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Total Transacciones</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {resumen.cantidadVentasGlobal}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-purple-50">
                  <CardBody className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Mejor Vendedor</p>
                      <p className="text-lg font-bold text-purple-800">
                        {resumen.mejorVendedor.nombreEmpleado}
                      </p>
                      <p className="text-xs text-purple-500">
                        {formatMoney(resumen.mejorVendedor.totalVentas)}
                      </p>
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
                  {/* Gráfico de Ventas por Empleado */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Ventas por Empleado</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={empleadosFiltrados}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nombreEmpleado" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatMoney(Number(value))} />
                          <Bar dataKey="totalVentas" name="Total Ventas" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Gráfico de Tendencia de Ventas */}
                  {selectedEmpleado && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Tendencia de Ventas</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedEmpleado.ventasPorDia}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatMoney(Number(value))} />
                            <Line type="monotone" dataKey="total" stroke="#3b82f6" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </div>
              </Tab>

              <Tab key="detalle" title="Detalle de Vendedores">
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Empleado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Ventas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Promedio
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Descuentos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {empleadosFiltrados.map((empleado) => (
                        <tr 
                          key={empleado.usuarioId}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedEmpleado(empleado)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {empleado.nombreEmpleado}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {empleado.cantidadVentas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatMoney(empleado.totalVentas)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {formatMoney(empleado.promedioVentaPorTransaccion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {formatMoney(empleado.metricas.descuentosOtorgados)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tab>
            </Tabs>

            {/* Modal de Detalle de Empleado */}
            {selectedEmpleado && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <CardHeader className="flex justify-between items-center p-6 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">
                      Detalle del Vendedor: {selectedEmpleado.nombreEmpleado}
                    </h3>
                    <Button
                      color="default"
                      variant="light"
                      size="sm"
                      onClick={() => setSelectedEmpleado(null)}
                    >
                      Cerrar
                    </Button>
                  </CardHeader>
                  <CardBody className="p-6">
                    {/* Métricas del vendedor */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Total Vendido</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatMoney(selectedEmpleado.totalVentas)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Ventas Realizadas</p>
                        <p className="text-xl font-bold text-green-900">
                          {selectedEmpleado.cantidadVentas}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg"></div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Promedio por Venta</p>
                        <p className="text-xl font-bold text-purple-900">
                          {formatMoney(selectedEmpleado.promedioVentaPorTransaccion)}
                        </p>
                      </div>
                    </div>

                    {/* Productos más vendidos */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-4">Productos Más Vendidos</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Producto
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Cantidad
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Total Vendido
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedEmpleado.productosMasVendidos.map((producto) => (
                              <tr key={producto.productoId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {producto.nombreProducto}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                  {producto.cantidad}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatMoney(producto.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Métricas adicionales y gráfico de tendencia */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-50">
                        <CardBody className="p-4">
                          <h4 className="text-sm font-semibold text-gray-600 mb-4">Métricas de Ventas</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Venta más alta:</span>
                              <span className="font-medium">{formatMoney(selectedEmpleado.metricas.ventaMaxima)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Venta más baja:</span>
                              <span className="font-medium">{formatMoney(selectedEmpleado.metricas.ventaMinima)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ticket promedio:</span>
                              <span className="font-medium">{formatMoney(selectedEmpleado.metricas.ticketPromedio)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total descuentos:</span>
                              <span className="font-medium">{formatMoney(selectedEmpleado.metricas.descuentosOtorgados)}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card className="bg-gray-50">
                        <CardBody className="p-4">
                          <h4 className="text-sm font-semibold text-gray-600 mb-4">Tendencia de Ventas</h4>
                          <div className="h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={selectedEmpleado.ventasPorDia}>
                                <XAxis dataKey="fecha" hide />
                                <YAxis hide />
                                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                                <Line 
                                  type="monotone" 
                                  dataKey="total" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardBody>
                      </Card>
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
'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Button, Spinner, DateRangePicker } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VentasPorPeriodo {
    periodo: string;
    cantidadVentas: number;
    totalVentas: number;
    cantidadProductos: number;
    productosVendidos: Array<{
        productoID: number;
        nombre: string;
        cantidad: number;
        total: number;
    }>;
}

interface Resumen {
    totalVentas: number;
    totalProductos: number;
    promedioVentasPorPeriodo: number;
    productosMasVendidos: Array<{
        productoID: number;
        nombre: string;
        cantidad: number;
        total: number;
    }>;
}

const EvolucionVentas: React.FC = () => {
    // Estados
    const [dateRange, setDateRange] = useState({
        start: today('America/Mexico_City').subtract({ months: 1 }),
        end: today('America/Mexico_City')
    });
    const [ventasData, setVentasData] = useState<VentasPorPeriodo[] | null>(null);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agrupacion, setAgrupacion] = useState<'dia' | 'semana' | 'mes'>('dia');
    const [metricaSeleccionada, setMetricaSeleccionada] = useState<'totalVentas' | 'cantidadProductos'>('totalVentas');

    // Función para cargar datos
    const fetchVentasData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/Api/reportes/evolucion-ventas?startDate=${dateRange.start}&endDate=${dateRange.end}&agrupacion=${agrupacion}`
            );
            if (!response.ok) throw new Error('Error al cargar los datos');
            const { data, resumen } = await response.json();
            setVentasData(data);
            setResumen(resumen);
        } catch (error) {
            setError('No se pudieron cargar los datos de ventas');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVentasData();
    }, [agrupacion]);

    // Función para formatear fechas en el gráfico
    const formatPeriodo = (periodo: string) => {
        const date = new Date(periodo);
        if (agrupacion === 'mes') {
            return date.toLocaleDateString('es', { month: 'short', year: 'numeric' });
        } else if (agrupacion === 'semana') {
            return `Sem ${date.toLocaleDateString('es', { day: '2-digit', month: 'short' })}`;
        }
        return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
    };

    return (
        <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Evolución de Ventas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DateRangePicker
                        label="Período de análisis"
                        value={dateRange}
                        onChange={setDateRange}
                        className="max-w-xs"
                    />
                    <Select
                        label="Agrupar por"
                        value={agrupacion}
                        onChange={(e) => setAgrupacion(e.target.value as typeof agrupacion)}
                    >
                        <SelectItem key="dia" value="dia">Por Día</SelectItem>
                        <SelectItem key="semana" value="semana">Por Semana</SelectItem>
                        <SelectItem key="mes" value="mes">Por Mes</SelectItem>
                    </Select>
                    <Button 
                        color="primary"
                        onClick={fetchVentasData}
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Actualizar'}
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="p-6">
                {/* Resumen de Ventas */}
                {resumen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-50">
                            <CardBody className="p-4 text-center">
                                <h3 className="text-lg font-semibold text-blue-800">Total Vendido</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${resumen.totalVentas.toFixed(2)}
                                </p>
                            </CardBody>
                        </Card>
                        <Card className="bg-green-50">
                            <CardBody className="p-4 text-center">
                                <h3 className="text-lg font-semibold text-green-800">Productos Vendidos</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {resumen.totalProductos}
                                </p>
                            </CardBody>
                        </Card>
                        <Card className="bg-purple-50">
                            <CardBody className="p-4 text-center">
                                <h3 className="text-lg font-semibold text-purple-800">Promedio por {agrupacion}</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    ${resumen.promedioVentasPorPeriodo.toFixed(2)}
                                </p>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Gráfico de Evolución */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Spinner size="lg" />
                    </div>
                ) : ventasData ? (
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ventasData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="periodo"
                                    tickFormatter={formatPeriodo}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value: number, name) => [
                                        name === 'Total Ventas' ? `$${value.toFixed(2)}` : value,
                                        name
                                    ]}
                                    labelFormatter={formatPeriodo}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="totalVentas"
                                    name="Total Ventas"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cantidadProductos"
                                    name="Productos Vendidos"
                                    stroke="#16a34a"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : null}

                {/* Productos Más Vendidos */}
                {resumen?.productosMasVendidos && (
                  <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Productos Más Vendidos
                  </h3>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                      Producto
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                      Cantidad Vendida
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                      Total Vendido
                                  </th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {resumen.productosMasVendidos.map((producto) => (
                                  <tr key={producto.productoID} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {producto.nombre}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                          {producto.cantidad.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                          ${producto.total.toFixed(2)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Mensaje de error */}
          {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mt-4">
                  {error}
              </div>
          )}

          {/* Nota informativa */}
          <p className="text-sm text-gray-500 mt-6 text-center">
              Los datos mostrados corresponden al período seleccionado y están agrupados por {
                  agrupacion === 'dia' ? 'día' :
                  agrupacion === 'semana' ? 'semana' : 'mes'
              }
          </p>
      </CardBody>
  </Card>
);
};

export default EvolucionVentas;
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Button, Spinner, DateRangePicker, Input } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Search } from "lucide-react";

interface ProductoRentabilidad {
  productoID: number;
  nombre: string;
  cantidadComprada: number;
  cantidadVendida: number;
  costoTotal: number;
  ingresoTotal: number;
  gananciaOPerdida: number;
  estado: 'GANANCIA' | 'PÉRDIDA' | 'SIN MOVIMIENTO';
}

interface Totales {
  inversionTotal: number;
  ventasTotal: number;
  gananciaTotal: number;
  productosConGanancia: number;
  productosConPerdida: number;
}

const CHART_TYPES = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'pie', label: 'Circular' }
];

const METRIC_TYPES = [
  { value: 'gananciaOPerdida', label: 'Ganancia/Pérdida ($)' },
  { value: 'ingresoTotal', label: 'Ventas Totales ($)' },
  { value: 'costoTotal', label: 'Inversión ($)' },
  { value: 'cantidadVendida', label: 'Unidades Vendidas' }
];

const RentabilidadProductos: React.FC = () => {
  // Estados básicos
  const [dateRange, setDateRange] = useState({
    start: today('America/Mexico_City').subtract({ months: 1 }),
    end: today('America/Mexico_City')
  });
  const [rentabilidadData, setRentabilidadData] = useState<ProductoRentabilidad[] | null>(null);
  const [totales, setTotales] = useState<Totales | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtrado y visualización
  const [searchTerm, setSearchTerm] = useState('');
  const [showMode, setShowMode] = useState<'tabla' | 'grafico'>('tabla');
  const [chartType, setChartType] = useState('bar');
  const [metricToShow, setMetricToShow] = useState('gananciaOPerdida');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'GANANCIA' | 'PÉRDIDA'>('TODOS');

  // Fetch data
  const fetchRentabilidadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/Api/reportes/rentabilidad?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      const { data, totales } = await response.json();
      setRentabilidadData(data);
      setTotales(totales);
    } catch (error) {
      setError('Error al cargar los datos. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRentabilidadData();
  }, []);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    if (!rentabilidadData) return [];
    return rentabilidadData.filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'TODOS' || item.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rentabilidadData, searchTerm, statusFilter]);

  // Renderizado del gráfico
  const renderChart = () => {
    if (!filteredData?.length) return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No hay datos para mostrar
      </div>
    );

    const chartData = filteredData.slice(0, 10);

    const formatValue = (value: number) => {
      if (['gananciaOPerdida', 'ingresoTotal', 'costoTotal'].includes(metricToShow)) {
        return `$${value.toFixed(2)}`;
      }
      return value.toString();
    };

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={metricToShow}
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={entry => entry.nombre}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={index}
                  fill={entry.gananciaOPerdida >= 0 ? '#4ade80' : '#ef4444'}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatValue(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value: any) => formatValue(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={metricToShow}
              name={METRIC_TYPES.find(m => m.value === metricToShow)?.label}
              stroke="#2563eb"
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip formatter={(value: any) => formatValue(value)} />
          <Legend />
          <Bar
            dataKey={metricToShow}
            name={METRIC_TYPES.find(m => m.value === metricToShow)?.label}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={index}
                fill={entry.gananciaOPerdida >= 0 ? '#4ade80' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Rentabilidad de Productos</h2>
          
          {/* Controles principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DateRangePicker
              label="Seleccionar período"
              value={dateRange}
              onChange={setDateRange}
              className="max-w-xs"
            />
            <Input
              label="Buscar producto"
              placeholder="Nombre del producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="text-gray-400" size={20} />}
            />
            <Select
              label="Filtrar estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <SelectItem key="TODOS" value="TODOS">Todos</SelectItem>
              <SelectItem key="GANANCIA" value="GANANCIA">Con Ganancia</SelectItem>
              <SelectItem key="PÉRDIDA" value="PÉRDIDA">Con Pérdida</SelectItem>
            </Select>
            <Button 
              color="primary" 
              onClick={fetchRentabilidadData} 
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? <Spinner size="sm" /> : 'Actualizar'}
            </Button>
          </div>

          {showMode === 'grafico' && (
            <div className="flex gap-4">
              <Select
                label="Tipo de gráfico"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="max-w-xs"
              >
                {CHART_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Métrica a mostrar"
                value={metricToShow}
                onChange={(e) => setMetricToShow(e.target.value)}
                className="max-w-xs"
              >
                {METRIC_TYPES.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="p-6">
        {/* Resumen */}
        {totales && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={totales.gananciaTotal >= 0 ? 'bg-green-50' : 'bg-red-50'}>
              <CardBody className="p-4 text-center">
                <h3 className="text-lg font-semibold">{totales.gananciaTotal >= 0 ? 'Ganancia Total' : 'Pérdida Total'}</h3>
                <p className={`text-2xl font-bold ${totales.gananciaTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totales.gananciaTotal).toFixed(2)}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-blue-50">
              <CardBody className="p-4 text-center">
                <h3 className="text-lg font-semibold">Rentables</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {totales.productosConGanancia} productos
                </p>
              </CardBody>
            </Card>
            <Card className="bg-amber-50">
              <CardBody className="p-4 text-center">
                <h3 className="text-lg font-semibold">En Pérdida</h3>
                <p className="text-2xl font-bold text-amber-600">
                  {totales.productosConPerdida} productos
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Botones de vista */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Button
              color={showMode === 'tabla' ? "primary" : "default"}
              onClick={() => setShowMode('tabla')}
              size="sm"
            >
              Ver Tabla
            </Button>
            <Button
              color={showMode === 'grafico' ? "primary" : "default"}
              onClick={() => setShowMode('grafico')}
              size="sm"
            >
              Ver Gráfico
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">{error}</div>
        ) : showMode === 'grafico' ? (
          renderChart()
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Unidades<br/>Compradas</th>
                  <th className="px-4 py-3 text-right">Unidades<br/>Vendidas</th>
                  <th className="px-4 py-3 text-right">Inversión</th>
                  <th className="px-4 py-3 text-right">Ventas</th>
                  <th className="px-4 py-3 text-right">Ganancia/<br/>Pérdida</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.productoID} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{item.nombre}</td>
                    <td className="px-4 py-3 text-right">{item.cantidadComprada}</td>
                    <td className="px-4 py-3 text-right">{item.cantidadVendida}</td>
                    <td className="px-4 py-3 text-right">${item.costoTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${item.ingresoTotal.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      item.gananciaOPerdida >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(item.gananciaOPerdida).toFixed(2)}
                      {item.gananciaOPerdida >= 0 ? ' ↑' : ' ↓'}
                    </td>
                    <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.estado === 'GANANCIA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.estado === 'GANANCIA' ? '✓ Rentable' : '⚠ En Pérdida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mensaje cuando no hay resultados */}
            {filteredData.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No se encontraron productos que coincidan con los filtros seleccionados
              </div>
            )}
          </div>
        )}

        {/* Nota informativa */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          {showMode === 'grafico' && 'Mostrando los 10 productos más relevantes'}
        </div>
      </CardBody>
    </Card>
  );
};

export default RentabilidadProductos;
'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Button, Spinner, DateRangePicker } from "@nextui-org/react";
import { parseDate, today, CalendarDate } from "@internationalized/date";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialData {
  name: string;
  ingresos: number;
  gastos: number;
  utilidades: number;
}

interface Totales {
  ingresos: number;
  gastos: number;
  utilidades: number;
}

interface Period {
  startDate: string;
  endDate: string;
}

const chartTypes = [
  { value: 'bar', label: 'Gráfico de Barras' },
  { value: 'line', label: 'Gráfico de Líneas' },
  { value: 'area', label: 'Gráfico de Área' },
] as const;

type ChartType = typeof chartTypes[number]['value'];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const EstadoFinanciero: React.FC = () => {
  // Función para obtener el rango de fecha inicial (último mes)
  const getInitialDateRange = () => {
    const currentDate = today('America/Mexico_City'); // O usa la zona horaria que necesites
    const startDate = currentDate.subtract({ months: 1 });
    
    return {
      start: startDate,
      end: currentDate
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange());
  const [financialData, setFinancialData] = useState<FinancialData[] | null>(null);
  const [totales, setTotales] = useState<Totales | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dataKeys, setDataKeys] = useState<(keyof FinancialData)[]>(['ingresos', 'gastos', 'utilidades']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startDateStr = dateRange.start.toString();
      const endDateStr = dateRange.end.toString();
      
      const response = await fetch(`/Api/reportes/estado-financiero?startDate=${startDateStr}&endDate=${endDateStr}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      const { data, totales, period }: { data: FinancialData[], totales: Totales, period: Period } = await response.json();
      setFinancialData(data);
      setTotales(totales);
      setPeriod(period);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError('No se pudo cargar la información financiera. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const renderChart = () => {
    if (!financialData || financialData.length === 0) return <p>No hay datos disponibles para mostrar.</p>;

    const ChartComponent = {
      bar: BarChart,
      line: LineChart,
      area: AreaChart
    }[chartType];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={financialData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px' }} />
          <Legend />
          {dataKeys.map((key, index) => {
            if (chartType === 'bar') {
              return <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />;
            } else if (chartType === 'line') {
              return <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} />;
            } else if (chartType === 'area') {
              return <Area key={key} type="monotone" dataKey={key} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />;
            }
            return null;
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Estado Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DateRangePicker
            label="Período"
            value={dateRange}
            onChange={setDateRange}
            className="max-w-xs"
          />
          <Select
            label="Tipo de Gráfico"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="max-w-xs"
          >
            {chartTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
          <Button color="primary" onClick={fetchFinancialData} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Generar Reporte'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['ingresos', 'gastos', 'utilidades'] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              color={dataKeys.includes(key) ? "primary" : "default"}
              variant={dataKeys.includes(key) ? "solid" : "bordered"}
              onClick={() => setDataKeys(prev => 
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
              )}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardBody className="p-6">
        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}
        {period && (
          <p className="text-sm text-gray-600 mb-4">
            Periodo: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
          </p>
        )}
        {totales && (
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="font-bold text-blue-800">Total Ingresos</p>
              <p className="text-2xl text-blue-600">${totales.ingresos.toFixed(2)}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="font-bold text-red-800">Total Gastos</p>
              <p className="text-2xl text-red-600">${totales.gastos.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="font-bold text-green-800">Total Utilidades</p>
              <p className="text-2xl text-green-600">${totales.utilidades.toFixed(2)}</p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Spinner size="lg" />
          </div>
        ) : (
          renderChart()
        )}
      </CardBody>
    </Card>
  );
};

export default EstadoFinanciero;
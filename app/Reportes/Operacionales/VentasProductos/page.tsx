'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, DateRangePicker, Input, Tabs, Tab } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Search, TrendingUp, Package, ArrowDown, ArrowUp, Calendar } from "lucide-react";

interface ProductoVentas {
    productoID: number;
    nombre: string;
    descripcion: string;
    categoria: string;
    unidadMedida: string;
    cantidadVendida: number;
    totalVentas: number;
    precioPromedio: number;
    porcentajeDelTotal: number;
    tendencia: {
        mes: string;
        cantidad: number;
    }[];
}

interface ResumenVentas {
    totalProductos: number;
    totalUnidadesVendidas: number;
    promedioUnidadesPorProducto: number;
    productosMasVendidos: {
        cantidad: number;
        porcentaje: number;
    };
    productosPocaRotacion: {
        cantidad: number;
        porcentaje: number;
    };
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function VentasPorProductoPage() {
    // Estados
    const [dateRange, setDateRange] = useState({
        start: today('America/La_Paz').subtract({ months: 1 }),
        end: today('America/La_Paz')
    });
    const [productosData, setProductosData] = useState<ProductoVentas[] | null>(null);
    const [resumen, setResumen] = useState<ResumenVentas | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('general');
    const [selectedProducto, setSelectedProducto] = useState<ProductoVentas | null>(null);

    // Cargar datos
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/Api/reportes/ventas-por-producto?startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (!response.ok) throw new Error('Error al cargar los datos');
            const { data, resumen } = await response.json();
            setProductosData(data);
            setResumen(resumen);
        } catch (error) {
            setError('No se pudieron cargar los datos de ventas');
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
            .sort((a, b) => b.cantidadVendida - a.cantidadVendida);
    }, [productosData, searchTerm]);

    // Formatear cantidad monetaria
    const formatMoney = (amount: number | null | undefined) => {
        if (amount == null) return 'Bs. 0.00';
        return `Bs. ${amount.toFixed(2)}`;
    };

    return (
        <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
                <h2 className="text-2xl font-bold text-gray-800">Reporte de Ventas por Producto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DateRangePicker
                        label="Período de análisis"
                        value={dateRange}
                        onChange={setDateRange}
                        className="max-w-xs"
                    />
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
                                            <p className="text-xs text-blue-500">
                                                Con ventas en el período
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
                                            <p className="text-sm text-green-600 font-medium">Unidades Vendidas</p>
                                            <p className="text-2xl font-bold text-green-800">
                                                {resumen.totalUnidadesVendidas}
                                            </p>
                                            <p className="text-xs text-green-500">Total del período</p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="bg-amber-50">
                                    <CardBody className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <ArrowUp size={24} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-amber-600 font-medium">Alta Rotación</p>
                                            <p className="text-2xl font-bold text-amber-800">
                                                {resumen.productosMasVendidos.cantidad}
                                            </p>
                                            <p className="text-xs text-amber-500">
                                            Productos {resumen.productosMasVendidos?.porcentaje?.toFixed(1) ?? 0}%
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="bg-red-50">
                                    <CardBody className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <ArrowDown size={24} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-red-600 font-medium">Baja Rotación</p>
                                            <p className="text-2xl font-bold text-red-800">
                                                {resumen.productosPocaRotacion.cantidad}
                                            </p>
                                            <p className="text-xs text-red-500">
                                                Productos {resumen.productosPocaRotacion?.porcentaje?.toFixed(1) ?? 0}%
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
                                    {/* Top 10 Productos */}
                                    <Card className="p-4">
                                        <h3 className="text-lg font-semibold mb-4">Top 10 Productos más Vendidos</h3>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={productosFiltrados.slice(0, 10)}>
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
                                                        dataKey="cantidadVendida" 
                                                        name="Unidades Vendidas" 
                                                        fill="#3b82f6"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    {/* Distribución por Categorías */}
                                    {productosFiltrados.length > 0 && (
                                        <Card className="p-4">
                                            <h3 className="text-lg font-semibold mb-4">Distribución por Categorías</h3>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            dataKey="cantidadVendida"
                                                            data={Object.values(
                                                                productosFiltrados.reduce((acc: any, producto) => {
                                                                    if (!acc[producto.categoria]) {
                                                                        acc[producto.categoria] = {
                                                                            name: producto.categoria,
                                                                            cantidadVendida: 0
                                                                        };
                                                                    }
                                                                    acc[producto.categoria].cantidadVendida += producto.cantidadVendida;
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
                                                    Unidades Vendidas
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Total Ventas
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    % del Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {productosFiltrados.map((producto) => (
                                                <tr 
                                                    key={producto.productoID}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => setSelectedProducto(producto)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {producto.nombre}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {producto.descripcion}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {producto.categoria}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                        {producto.cantidadVendida} {producto.unidadMedida}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                        {formatMoney(producto.totalVentas)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            producto.porcentajeDelTotal > 5
                                                                ? 'bg-green-100 text-green-800'
                                                                : producto.porcentajeDelTotal < 1
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {producto.porcentajeDelTotal.toFixed(1)}%
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
                                                {selectedProducto.categoria} - {selectedProducto.descripcion}
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
                                                <p className="text-sm text-blue-600">Unidades Vendidas</p>
                                                <p className="text-xl font-bold text-blue-900">
                                                    {selectedProducto.cantidadVendida} {selectedProducto.unidadMedida}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-600">Total Ventas</p>
                                                <p className="text-xl font-bold text-green-900">
                                                    {formatMoney(selectedProducto.totalVentas)}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-purple-50 rounded-lg">
                                                <p className="text-sm text-purple-600">Precio Promedio</p>
                                                <p className="text-xl font-bold text-purple-900">
                                                    {formatMoney(selectedProducto.precioPromedio)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Gráfico de tendencia */}
                                        <div className="mt-6">
                                            <h4 className="text-lg font-semibold mb-4">Tendencia de Ventas</h4>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={selectedProducto.tendencia}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis 
                                                            dataKey="mes"
                                                            tickFormatter={(value) => {
                                                                const [year, month] = value.split('-');
                                                                return `${month}/${year.slice(2)}`;
                                                            }}
                                                        />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="cantidad"
                                                            name="Unidades Vendidas"
                                                            stroke="#3b82f6"
                                                            strokeWidth={2}
                                                            dot={{ r: 4 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                                Información Adicional
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Participación en ventas:</p>
                                                    <p className="font-medium">
                                                        {selectedProducto.porcentajeDelTotal.toFixed(2)}% del total
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Clasificación:</p>
                                                    <p className="font-medium">
                                                        {selectedProducto.porcentajeDelTotal > 5 
                                                            ? 'Alta rotación'
                                                            : selectedProducto.porcentajeDelTotal < 1
                                                            ? 'Baja rotación'
                                                            : 'Rotación normal'}
                                                    </p>
                                                </div>
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
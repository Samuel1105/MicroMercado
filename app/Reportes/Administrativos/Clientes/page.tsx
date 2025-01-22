'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, DateRangePicker, Input, Tabs, Tab } from "@nextui-org/react";
import { parseDate, today } from "@internationalized/date";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Search, TrendingUp, ShoppingCart, Users, Calendar } from "lucide-react";

interface ClienteAnalisis {
    clienteID: number;
    nombre: string;
    cantidadCompras: number;
    totalGastado: number;
    promedioCompra: number;
    ultimaCompra: Date;
    diasDesdeUltimaCompra: number;
    productosComprados: Array<{
        productoID: number;
        nombre: string;
        cantidad: number;
        totalGastado: number;
        frecuencia: number;
    }>;
    frecuenciaCompra: number;
}

interface ResumenClientes {
    totalClientes: number;
    clientesActivos: number;
    promedioCompraGeneral: number;
    clientesNuevos: number;
    frecuenciaPromedio: number;
    clientesPorFrecuencia: {
        frecuentes: number;
        moderados: number;
        ocasionales: number;
    };
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

const AnalisisClientes: React.FC = () => {
    // Estados
    const [dateRange, setDateRange] = useState({
        start: today('America/La_Paz').subtract({ months: 1 }),
        end: today('America/La_Paz')
    });
    
    const [clientesData, setClientesData] = useState<ClienteAnalisis[] | null>(null);
    const [resumen, setResumen] = useState<ResumenClientes | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('general');
    const [selectedCliente, setSelectedCliente] = useState<ClienteAnalisis | null>(null);

    // Cargar datos
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/Api/reportes/analisis-clientes?startDate=${dateRange.start}&endDate=${dateRange.end}`
            );
            if (!response.ok) throw new Error('Error al cargar los datos');
            const { data, resumen } = await response.json();
            setClientesData(data);
            setResumen(resumen);
        } catch (error) {
            setError('No se pudieron cargar los datos de clientes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtrar clientes
    const clientesFiltrados = useMemo(() => {
        if (!clientesData) return [];
        return clientesData
            .filter(cliente => cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.totalGastado - a.totalGastado);
    }, [clientesData, searchTerm]);

    // Formatear cantidad monetaria con manejo de null/undefined
    const formatMoney = (amount: number | null | undefined) => {
        if (amount == null) return 'Bs. 0.00';
        return `Bs. ${amount.toFixed(2)}`;
    };

    return (
        <Card className="w-full shadow-lg">
            <CardHeader className="flex flex-col gap-4 bg-gray-50 p-6">
                <h2 className="text-2xl font-bold text-gray-800">Análisis de Clientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DateRangePicker
                        label="Período de análisis"
                        value={dateRange}
                        onChange={setDateRange}
                        className="max-w-xs"
                    />
                    <Input
                        type="text"
                        label="Buscar cliente"
                        placeholder="Nombre del cliente..."
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
                                            <Users size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total Clientes</p>
                                            <p className="text-2xl font-bold text-blue-800">{resumen.totalClientes}</p>
                                            <p className="text-xs text-blue-500">
                                                {resumen.clientesNuevos} nuevos en el período
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="bg-green-50">
                                    <CardBody className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <ShoppingCart size={24} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Compra Promedio</p>
                                            <p className="text-2xl font-bold text-green-800">
                                                {formatMoney(resumen?.promedioCompraGeneral)}
                                            </p>
                                            <p className="text-xs text-green-500">Por cliente</p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="bg-amber-50">
                                    <CardBody className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <TrendingUp size={24} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-amber-600 font-medium">Clientes Activos</p>
                                            <p className="text-2xl font-bold text-amber-800">{resumen.clientesActivos}</p>
                                            <p className="text-xs text-amber-500">Últimos 30 días</p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card className="bg-purple-50">
                                    <CardBody className="p-4 flex items-center gap-4">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Calendar size={24} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Frecuencia Promedio</p>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {Math.round(resumen.frecuenciaPromedio)} días
                                            </p>
                                            <p className="text-xs text-purple-500">Entre compras</p>
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
                                    {/* Gráfico de Frecuencia de Clientes */}
                                    {resumen && (
                                        <Card className="p-4">
                                            <h3 className="text-lg font-semibold mb-4">Distribución de Clientes</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            dataKey="value"
                                                            data={[
                                                                { name: 'Frecuentes', value: resumen.clientesPorFrecuencia.frecuentes },
                                                                { name: 'Moderados', value: resumen.clientesPorFrecuencia.moderados },
                                                                { name: 'Ocasionales', value: resumen.clientesPorFrecuencia.ocasionales }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={100}
                                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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

                                    {/* Top Clientes por Compras */}
                                    <Card className="p-4">
                                        <h3 className="text-lg font-semibold mb-4">Top Clientes por Consumo</h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={clientesFiltrados.slice(0, 5)}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="nombre" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                                                    <Bar dataKey="totalGastado" name="Total Gastado" fill="#3b82f6" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </div>
                            </Tab>

                            <Tab key="detalle" title="Detalle de Clientes">
                                <div className="overflow-x-auto mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Cliente
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Compras
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Total Gastado
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Promedio
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Última Compra
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clientesFiltrados.map((cliente) => (
                                                <tr 
                                                    key={cliente.clienteID}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => setSelectedCliente(cliente)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {cliente.nombre}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                        {cliente.cantidadCompras}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                        {formatMoney(cliente.totalGastado)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                        {formatMoney(cliente.promedioCompra)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                        {new Date(cliente.ultimaCompra).toLocaleDateString()}
                                                        <br />
                                                        <span className="text-xs text-gray-400">
                                                            ({cliente.diasDesdeUltimaCompra} días)
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {clientesFiltrados.length === 0 && (
                                        <div className="text-center py-10 text-gray-500">
                                            No se encontraron clientes que coincidan con la búsqueda
                                        </div>
                                    )}
                                </div>
                                </Tab>
                        </Tabs>

                        {/* Modal de Detalle de Cliente */}
                        {selectedCliente && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <CardHeader className="flex justify-between items-center p-6 bg-gray-50">
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Detalle del Cliente: {selectedCliente.nombre}
                                        </h3>
                                        <Button
                                            color="default"
                                            variant="light"
                                            size="sm"
                                            onClick={() => setSelectedCliente(null)}
                                        >
                                            Cerrar
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="p-6">
                                        {/* Resumen del cliente */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-600">Total Gastado</p>
                                                <p className="text-xl font-bold text-blue-900">
                                                    {formatMoney(selectedCliente?.totalGastado)}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-600">Compras Realizadas</p>
                                                <p className="text-xl font-bold text-green-900">
                                                    {selectedCliente.cantidadCompras}
                                                </p>
                                            </div>
                                            { <div className="p-4 bg-purple-50 rounded-lg">
                                                <p className="text-sm text-purple-600">Promedio por Compra</p>
                                                <p className="text-xl font-bold text-purple-900">
                                                    {formatMoney(selectedCliente?.promedioCompra)}
                                                </p>
                                            </div> }
                                        </div>

                                        {/* Productos más comprados */}
                                        <div className="mt-6">
                                            <h4 className="text-lg font-semibold mb-4">Productos Preferidos</h4>
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
                                                                Total Gastado
                                                            </th>
                                                            {/* <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                                % del Total
                                                            </th> */}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {selectedCliente.productosComprados.map((producto) => (
                                                            <tr key={producto.productoID} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {producto.nombre}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                                                    {producto.cantidad}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                                                    {formatMoney(producto?.totalGastado)}
                                                                </td>
                                                                {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                                                                    {producto.frecuencia?.toFixed(1)}%
                                                                </td> */}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Información adicional */}
                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                                Información Adicional
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Última compra:</p>
                                                    <p className="font-medium">
                                                        {new Date(selectedCliente.ultimaCompra).toLocaleDateString()}
                                                        {' '}
                                                        <span className="text-gray-500">
                                                            (hace {selectedCliente.diasDesdeUltimaCompra} días)
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Frecuencia de compra:</p>
                                                    <p className="font-medium">
                                                        {Math.round(selectedCliente.frecuenciaCompra)} días entre compras
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
};

export default AnalisisClientes;
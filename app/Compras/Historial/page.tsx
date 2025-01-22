'use client'

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Pagination, Spinner, Chip, DateRangePicker } from "@nextui-org/react";
import { parseDate, DateValue } from "@internationalized/date";

interface DetalleCompra {
    producto: string;
    cantidadComprada: number;
    unidadesPorPaquete: number | null;
    totalUnidades: number;
    precioUnitario: number | string;
    subtotal: number | string;
    descuento: number | string;
    total: number | string;
    ingresado: boolean;
    cantidadIngresada: number;
    cantidadPendiente: number;
}

interface Compra {
    id: number;
    fechaCompra: string;
    subtotal: number | string;
    descuento: number | string;
    total: number | string;
    cantidadProductos: number;
    estado: string;
    detalles: DetalleCompra[];
}

const ROWS_PER_PAGE = 10;

export default function HistorialComprasPage() {
    const [historial, setHistorial] = useState<Compra[]>([]);
    const [filteredHistorial, setFilteredHistorial] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [dateRange, setDateRange] = useState<{ start: DateValue | null; end: DateValue | null }>({
        start: null,
        end: null
    });

    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                const response = await fetch('/Api/compra/historial');
                const data: Compra[] = await response.json();
                setHistorial(data);
                setFilteredHistorial(data);
                setTotalPages(Math.ceil(data.length / ROWS_PER_PAGE));
                setLoading(false);
            } catch (error) {
                console.error("Error al obtener el historial de compras:", error);
                setLoading(false);
            }
        };

        fetchHistorial();
    }, []);

    useEffect(() => {
        filterHistorial();
    }, [dateRange, historial]);

    const filterHistorial = () => {
        let filtered = historial;
        if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start.year, dateRange.start.month - 1, dateRange.start.day);
            const endDate = new Date(dateRange.end.year, dateRange.end.month - 1, dateRange.end.day);
            filtered = historial.filter(compra => {
                const compraDate = new Date(compra.fechaCompra);
                return compraDate >= startDate && compraDate <= endDate;
            });
        }
        setFilteredHistorial(filtered);
        setTotalPages(Math.ceil(filtered.length / ROWS_PER_PAGE));
        setPage(1);
    };

    const paginatedHistorial = filteredHistorial.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const formatMoney = (amount: number | string | null): string => {
        if (amount === null) return 'N/A';
        if (typeof amount === 'number') {
            return `Bs. ${amount.toFixed(2)}`;
        }
        if (typeof amount === 'string') {
            const numAmount = parseFloat(amount);
            if (!isNaN(numAmount)) {
                return `Bs. ${numAmount.toFixed(2)}`;
            }
        }
        return 'N/A';
    };

    const handleVerDetalles = (compra: Compra) => {
        setSelectedCompra(compra);
        onOpen();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="container mx-auto mt-5">
            <h1 className="text-2xl font-bold mb-4">Historial de Compras</h1>
            
            <div className="mb-4">
                <DateRangePicker 
                    label="Rango de fechas" 
                    className="max-w-xs" 
                    onChange={(range) => setDateRange({ start: range.start, end: range.end })}
                />
            </div>

            <div className="overflow-x-auto">
                <Table aria-label="Tabla de historial de compras" className="min-w-full">
                    <TableHeader>
                        <TableColumn>FECHA</TableColumn>
                        <TableColumn className="hidden md:table-cell">SUBTOTAL</TableColumn>
                        <TableColumn className="hidden md:table-cell">DESCUENTO</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                        <TableColumn className="hidden md:table-cell">CANTIDAD DE PRODUCTOS</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {paginatedHistorial.map((compra) => (
                            <TableRow key={compra.id}>
                                <TableCell>{formatDate(compra.fechaCompra)}</TableCell>
                                <TableCell className="hidden md:table-cell">{formatMoney(compra.subtotal)}</TableCell>
                                <TableCell className="hidden md:table-cell">{formatMoney(compra.descuento)}</TableCell>
                                <TableCell>{formatMoney(compra.total)}</TableCell>
                                <TableCell className="hidden md:table-cell">{compra.cantidadProductos}</TableCell>
                                <TableCell>
                                    <Chip size="sm" color={compra.estado === 'Registrado' ? 'success' : 'warning'}>
                                        {compra.estado}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" onPress={() => handleVerDetalles(compra)}>Ver Detalles</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-center mt-4">
                <Pagination
                    total={totalPages}
                    page={page}
                    onChange={(newPage) => setPage(newPage)}
                />
            </div>

            <Modal 
                size="5xl" 
                isOpen={isOpen} 
                onClose={onClose}
                scrollBehavior="inside"
                className="m-auto"
            >
                <ModalContent className="max-h-[90vh] my-8">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Detalles de la Compra</ModalHeader>
                            <ModalBody>
                                {selectedCompra && (
                                    <div className="overflow-x-auto">
                                        <Table aria-label="Tabla de detalles de compra" className="min-w-full">
                                            <TableHeader>
                                                <TableColumn>PRODUCTO</TableColumn>
                                                <TableColumn>CANTIDAD</TableColumn>
                                                <TableColumn className="hidden md:table-cell">UNIDADES POR PAQUETE</TableColumn>
                                                <TableColumn className="hidden md:table-cell">TOTAL UNIDADES</TableColumn>
                                                <TableColumn>PRECIO UNITARIO</TableColumn>
                                                <TableColumn>SUBTOTAL</TableColumn>
                                                <TableColumn>DESCUENTO</TableColumn>
                                                <TableColumn>TOTAL</TableColumn>
                                                <TableColumn>INGRESADO</TableColumn>
                                                <TableColumn>PENDIENTE</TableColumn>
                                                <TableColumn>ESTADO</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedCompra.detalles.map((detalle, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{detalle.producto}</TableCell>
                                                        <TableCell>{detalle.cantidadComprada}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{detalle.unidadesPorPaquete || 'N/A'}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{detalle.totalUnidades}</TableCell>
                                                        <TableCell>{formatMoney(detalle.precioUnitario)}</TableCell>
                                                        <TableCell>{formatMoney(detalle.subtotal)}</TableCell>
                                                        <TableCell>{formatMoney(detalle.descuento)}</TableCell>
                                                        <TableCell>{formatMoney(detalle.total)}</TableCell>
                                                        <TableCell>{detalle.cantidadIngresada}</TableCell>
                                                        <TableCell>{detalle.cantidadPendiente}</TableCell>
                                                        <TableCell>
                                                            <Chip size="sm" color={detalle.ingresado ? 'success' : 'warning'}>
                                                                {detalle.ingresado ? 'Ingresado' : 'Pendiente'}
                                                            </Chip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        
                                        <div className="mt-6 mb-4 p-4 bg-gray-100 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2">Resumen de la compra</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="font-medium">Subtotal:</p>
                                                    <p>{formatMoney(selectedCompra.subtotal)}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Descuento:</p>
                                                    <p>{formatMoney(selectedCompra.descuento)}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Total:</p>
                                                    <p className="text-lg font-bold">{formatMoney(selectedCompra.total)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p><strong>Productos pendientes de ingreso:</strong></p>
                                            <ul className="list-disc pl-5">
                                                {selectedCompra.detalles
                                                    .filter(detalle => !detalle.ingresado)
                                                    .map((detalle, index) => (
                                                        <li key={index}>{`${detalle.producto} - Pendiente: ${detalle.cantidadPendiente} unidades`}</li>
                                                    ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
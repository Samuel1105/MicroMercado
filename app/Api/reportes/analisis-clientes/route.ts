// app/Api/reportes/analisis-clientes/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');

        // Función auxiliar para ajustar la zona horaria
        const adjustDateToLocalMidnight = (date: Date, isEndDate: boolean): Date => {
            const newDate = new Date(date);
            if (isEndDate) {
                // Para la fecha final, establecemos la hora a 23:59:59.999 del día siguiente
                newDate.setDate(newDate.getDate() + 1);
                newDate.setHours(0, 0, 0, 0);
            } else {
                // Para la fecha inicial, establecemos la hora a 00:00:00.000
                newDate.setHours(0, 0, 0, 0);
            }
            return newDate;
        };

        let startDateTime: Date;
        let endDateTime: Date;

        if (!startDate || !endDate) {
            const today = new Date();
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            
            startDateTime = adjustDateToLocalMidnight(threeMonthsAgo, false);
            endDateTime = adjustDateToLocalMidnight(today, true);
        } else {
            startDateTime = adjustDateToLocalMidnight(new Date(startDate), false);
            endDateTime = adjustDateToLocalMidnight(new Date(endDate), true);
        }

        // Obtener todas las ventas con sus detalles
        const ventas = await prisma.venta.findMany({
            where: {
                fechaRegistro: {
                    gte: startDateTime,
                    lt: endDateTime // Cambiado a lt (less than) para que incluya todo el día final
                }
            },
            include: {
                Cliente: true,
                DetalleVentas: {
                    include: {
                        Producto: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                fechaRegistro: 'asc'
            }
        });

        // Obtener historial completo para análisis de frecuencia
        const historicoVentas = await prisma.venta.findMany({
            select: {
                clienteID: true,
                fechaRegistro: true
            },
            orderBy: {
                fechaRegistro: 'asc'
            }
        });

        const today = new Date();
        const clientesMap = new Map<number, ClienteAnalisis>();
        const productosPreferidos = new Map<number, Map<number, number>>();

        // Procesar ventas del período
        ventas.forEach(venta => {
            if (!clientesMap.has(venta.clienteID)) {
                clientesMap.set(venta.clienteID, {
                    clienteID: venta.clienteID,
                    nombre: venta.Cliente.nombre || 'Cliente sin nombre',
                    cantidadCompras: 0,
                    totalGastado: 0,
                    promedioCompra: 0,
                    ultimaCompra: venta.fechaRegistro!,
                    diasDesdeUltimaCompra: Math.floor((today.getTime() - new Date(venta.fechaRegistro!).getTime()) / (1000 * 60 * 60 * 24)),
                    productosComprados: [],
                    frecuenciaCompra: 0
                });
            }

            const clienteData = clientesMap.get(venta.clienteID)!;
            clienteData.cantidadCompras++;
            clienteData.totalGastado += Number(venta.total);
            
            if (new Date(venta.fechaRegistro!) > new Date(clienteData.ultimaCompra)) {
                clienteData.ultimaCompra = venta.fechaRegistro!;
                clienteData.diasDesdeUltimaCompra = Math.floor((today.getTime() - new Date(venta.fechaRegistro!).getTime()) / (1000 * 60 * 60 * 24));
            }

            // Procesar productos comprados
            venta.DetalleVentas.forEach(detalle => {
                if (!productosPreferidos.has(venta.clienteID)) {
                    productosPreferidos.set(venta.clienteID, new Map());
                }
                const clienteProductos = productosPreferidos.get(venta.clienteID)!;
                const cantidadActual = clienteProductos.get(detalle.productoID) || 0;
                clienteProductos.set(detalle.productoID, cantidadActual + detalle.cantidad);
            });
        });

        // Calcular frecuencia de compra
        const comprasPorCliente = new Map<number, Date[]>();
        historicoVentas.forEach(venta => {
            if (!comprasPorCliente.has(venta.clienteID)) {
                comprasPorCliente.set(venta.clienteID, []);
            }
            comprasPorCliente.get(venta.clienteID)!.push(new Date(venta.fechaRegistro!));
        });

        // Procesar datos finales y crear array de clientes
        const clientes = Array.from(clientesMap.entries()).map(([clienteID, clienteData]) => {
            // Calcular frecuencia de compra
            const fechasCompra = comprasPorCliente.get(clienteID) || [];
            if (fechasCompra.length > 1) {
                const primerCompra = fechasCompra[0];
                const ultimaCompra = fechasCompra[fechasCompra.length - 1];
                const diasTotales = Math.floor((ultimaCompra.getTime() - primerCompra.getTime()) / (1000 * 60 * 60 * 24));
                clienteData.frecuenciaCompra = diasTotales / (fechasCompra.length - 1);
            }

            // Procesar productos preferidos
            const productosCliente = productosPreferidos.get(clienteID);
            if (productosCliente) {
                clienteData.productosComprados = Array.from(productosCliente.entries())
                    .map(([productoID, cantidad]) => {
                        const detalles = ventas
                            .flatMap(v => v.DetalleVentas)
                            .filter(d => d.productoID === productoID);
                        
                        return {
                            productoID,
                            nombre: detalles[0]?.Producto.nombre || 'Producto no encontrado',
                            cantidad,
                            totalGastado: detalles.reduce((sum, d) => sum + Number(d.total), 0),
                            frecuencia: (cantidad / clienteData.cantidadCompras) * 100
                        };
                    })
                    .sort((a, b) => b.cantidad - a.cantidad);
            }

            clienteData.promedioCompra = clienteData.totalGastado / clienteData.cantidadCompras;
            return clienteData;
        });

        // Preparar resumen
        const resumen: ResumenClientes = {
            totalClientes: clientes.length,
            clientesActivos: clientes.filter(c => c.diasDesdeUltimaCompra <= 30).length,
            promedioCompraGeneral: clientes.reduce((sum, c) => sum + c.promedioCompra, 0) / clientes.length,
            clientesNuevos: clientes.filter(c => {
                const primeraCompra = comprasPorCliente.get(c.clienteID)?.[0];
                return primeraCompra && primeraCompra >= startDateTime;
            }).length,
            frecuenciaPromedio: clientes.reduce((sum, c) => sum + (c.frecuenciaCompra || 0), 0) / clientes.length,
            clientesPorFrecuencia: {
                frecuentes: clientes.filter(c => c.frecuenciaCompra <= 30).length,
                moderados: clientes.filter(c => c.frecuenciaCompra > 30 && c.frecuenciaCompra <= 90).length,
                ocasionales: clientes.filter(c => c.frecuenciaCompra > 90).length
            }
        };

        return NextResponse.json({
            data: clientes,
            resumen,
            period: {
                startDate: startDateTime.toISOString(),
                endDate: new Date(endDateTime.getTime() - 1).toISOString() // Ajustamos la fecha final para mostrar
            }
        });

    } catch (error) {
        console.error('Error en el análisis de clientes:', error);
        return NextResponse.json(
            { error: 'Error al procesar el análisis de clientes' },
            { status: 500 }
        );
    }
}
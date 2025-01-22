// app/Api/reportes/evolucion-ventas/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');
        const agrupacion = searchParams.get('agrupacion') || 'dia'; // dia, semana, mes

        if (!startDate || !endDate) {
            const today = new Date();
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setDate(today.getDate() - 30);
            
            startDate = oneMonthAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';
            endDate = today.toISOString().split('T')[0] + 'T23:59:59.999Z';
        } else {
            startDate = new Date(startDate + 'T00:00:00.000Z').toISOString();
            endDate = new Date(endDate + 'T23:59:59.999Z').toISOString();
        }

        // Obtener todas las ventas en el período
        const ventas = await prisma.venta.findMany({
            where: {
                fechaRegistro: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
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

        // Función para obtener la clave del período según la agrupación
        const getPeriodKey = (date: Date) => {
            if (agrupacion === 'mes') {
                return date.toISOString().slice(0, 7); // YYYY-MM
            } else if (agrupacion === 'semana') {
                const firstDay = new Date(date);
                firstDay.setDate(date.getDate() - date.getDay());
                return firstDay.toISOString().slice(0, 10); // YYYY-MM-DD de inicio de semana
            } else {
                return date.toISOString().slice(0, 10); // YYYY-MM-DD
            }
        };

        // Agrupar ventas por período
        const ventasPorPeriodo = new Map<string, VentasPorPeriodo>();
        const productosPopulares = new Map<number, { nombre: string, cantidad: number, total: number }>();

        ventas.forEach(venta => {
            const periodo = getPeriodKey(new Date(venta.fechaRegistro!));
            
            if (!ventasPorPeriodo.has(periodo)) {
                ventasPorPeriodo.set(periodo, {
                    periodo,
                    cantidadVentas: 0,
                    totalVentas: 0,
                    cantidadProductos: 0,
                    productosVendidos: []
                });
            }

            const periodoData = ventasPorPeriodo.get(periodo)!;
            periodoData.cantidadVentas++;
            periodoData.totalVentas += Number(venta.total);
            periodoData.cantidadProductos += venta.DetalleVentas.reduce((sum, det) => sum + det.cantidad, 0);

            // Acumular productos vendidos
            venta.DetalleVentas.forEach(detalle => {
                const producto = productosPopulares.get(detalle.productoID) || {
                    nombre: detalle.Producto.nombre,
                    cantidad: 0,
                    total: 0
                };
                producto.cantidad += detalle.cantidad;
                producto.total += Number(detalle.total);
                productosPopulares.set(detalle.productoID, producto);

                // Agregar a productos vendidos del período
                const productoExistente = periodoData.productosVendidos.find(p => p.productoID === detalle.productoID);
                if (productoExistente) {
                    productoExistente.cantidad += detalle.cantidad;
                    productoExistente.total += Number(detalle.total);
                } else {
                    periodoData.productosVendidos.push({
                        productoID: detalle.productoID,
                        nombre: detalle.Producto.nombre,
                        cantidad: detalle.cantidad,
                        total: Number(detalle.total)
                    });
                }
            });
        });

        // Calcular resumen
        const resumen = {
            totalVentas: Array.from(ventasPorPeriodo.values()).reduce((sum, p) => sum + p.totalVentas, 0),
            totalProductos: Array.from(ventasPorPeriodo.values()).reduce((sum, p) => sum + p.cantidadProductos, 0),
            promedioVentasPorPeriodo: ventasPorPeriodo.size > 0 
                ? Array.from(ventasPorPeriodo.values()).reduce((sum, p) => sum + p.totalVentas, 0) / ventasPorPeriodo.size 
                : 0,
            productosMasVendidos: Array.from(productosPopulares.entries())
                .map(([id, data]) => ({
                    productoID: id,
                    ...data
                }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 5)
        };

        return NextResponse.json({
            data: Array.from(ventasPorPeriodo.values()),
            resumen,
            period: {
                startDate,
                endDate
            },
            agrupacion
        });

    } catch (error) {
        console.error('Error en el análisis de evolución de ventas:', error);
        return NextResponse.json(
            { error: 'Error al procesar el análisis de ventas' },
            { status: 500 }
        );
    }
}
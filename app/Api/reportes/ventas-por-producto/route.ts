// app/Api/reportes/ventas-por-producto/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');

        // Función auxiliar para ajustar la zona horaria
        const adjustDateToLocalMidnight = (date: Date, isEndDate: boolean): Date => {
            const newDate = new Date(date);
            if (isEndDate) {
                newDate.setDate(newDate.getDate() + 1);
                newDate.setHours(0, 0, 0, 0);
            } else {
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

        // Obtener ventas por producto
        const ventas = await prisma.detalleVentas.findMany({
            where: {
                Venta: {
                    fechaRegistro: {
                        gte: startDateTime,
                        lt: endDateTime
                    }
                }
            },
            include: {
                Producto: {
                    include: {
                        Categoria: true,
                        UnidadMedida: true
                    }
                },
                Venta: {
                    select: {
                        fechaRegistro: true
                    }
                }
            }
        });

        // Procesar datos de ventas
        const productosMap = new Map<number, ProductoVentas>();
        let totalUnidadesVendidas = 0;

        ventas.forEach(venta => {
            const fechaVenta = new Date(venta.Venta.fechaRegistro!);
            const mesVenta = `${fechaVenta.getFullYear()}-${String(fechaVenta.getMonth() + 1).padStart(2, '0')}`;

            if (!productosMap.has(venta.productoID)) {
                productosMap.set(venta.productoID, {
                    productoID: venta.productoID,
                    nombre: venta.Producto.nombre,
                    descripcion: venta.Producto.descripcion,
                    categoria: venta.Producto.Categoria.nombre,
                    unidadMedida: venta.Producto.UnidadMedida.nombre,
                    cantidadVendida: 0,
                    totalVentas: 0,
                    precioPromedio: 0,
                    porcentajeDelTotal: 0,
                    tendencia: []
                });
            }

            const productoData = productosMap.get(venta.productoID)!;
            productoData.cantidadVendida += venta.cantidad;
            productoData.totalVentas += Number(venta.total);
            totalUnidadesVendidas += venta.cantidad;

            // Actualizar tendencia mensual
            const tendenciaMes = productoData.tendencia.find(t => t.mes === mesVenta);
            if (tendenciaMes) {
                tendenciaMes.cantidad += venta.cantidad;
            } else {
                productoData.tendencia.push({
                    mes: mesVenta,
                    cantidad: venta.cantidad
                });
            }
        });

        // Calcular estadísticas finales
        const productos = Array.from(productosMap.values()).map(producto => {
            producto.precioPromedio = producto.totalVentas / producto.cantidadVendida;
            producto.porcentajeDelTotal = (producto.cantidadVendida / totalUnidadesVendidas) * 100;
            producto.tendencia.sort((a, b) => a.mes.localeCompare(b.mes));
            return producto;
        }).sort((a, b) => b.cantidadVendida - a.cantidadVendida);

        // Preparar resumen
        const resumen: ResumenVentas = {
            totalProductos: productos.length,
            totalUnidadesVendidas,
            promedioUnidadesPorProducto: totalUnidadesVendidas / productos.length,
            productosMasVendidos: {
                cantidad: productos.filter(p => p.porcentajeDelTotal > 5).length,
                porcentaje: (productos.filter(p => p.porcentajeDelTotal > 5).length / productos.length) * 100
            },
            productosPocaRotacion: {
                cantidad: productos.filter(p => p.porcentajeDelTotal < 1).length,
                porcentaje: (productos.filter(p => p.porcentajeDelTotal < 1).length / productos.length) * 100
            }
        };

        return NextResponse.json({
            data: productos,
            resumen,
            period: {
                startDate: startDateTime.toISOString(),
                endDate: new Date(endDateTime.getTime() - 1).toISOString()
            }
        });

    } catch (error) {
        console.error('Error en el reporte de ventas por producto:', error);
        return NextResponse.json(
            { error: 'Error al procesar el reporte de ventas por producto' },
            { status: 500 }
        );
    }
}
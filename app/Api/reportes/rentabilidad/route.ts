// app/Api/reportes/rentabilidad/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

interface RentabilidadProducto {
    productoID: number;
    nombre: string;
    precioVenta: number;
    cantidadComprada: number;
    cantidadVendida: number;
    costoTotal: number;
    ingresoTotal: number;
    gananciaOPerdida: number;
    rendimientoPorcentual: number;
    estado: 'GANANCIA' | 'PÉRDIDA' | 'SIN MOVIMIENTO';
    eficienciaVentas: number;
}

interface Resumen {
    productosDestacados: Array<{
        nombre: string;
        ganancia: number;
        rendimiento: number;
    }>;
    productosEnRiesgo: Array<{
        nombre: string;
        perdida: number;
        rendimiento: number;
    }>;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let startDate = searchParams.get('startDate');
        let endDate = searchParams.get('endDate');

        // Manejo de fechas mejorado
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

        console.log(`Analizando período: ${startDate} hasta ${endDate}`);

        // Consulta a la base de datos
        const productos = await prisma.producto.findMany({
            where: {
                estado: 1
            },
            select: {
                id: true,
                nombre: true,
                precioVenta: true,
                stock: true,
                DetalleCompras: {
                    where: {
                        Compras: {
                            fechaRegistro: {
                                gte: new Date(startDate),
                                lte: new Date(endDate)
                            }
                        }
                    },
                    select: {
                        id: true,
                        cantidadMayor: true,
                        unidadesPorMayor: true,
                        cantidadIndividual: true,
                        precioUnitario: true,
                        precioUnitarioMayor: true,
                        total: true,
                        Compras: {
                            select: {
                                fechaRegistro: true,
                                id: true
                            }
                        },
                        IngresoAlmacen: {
                            select: {
                                cantidadIngresada: true,
                                fechaIngreso: true
                            }
                        },
                        MovimientoAlmacen: {
                            select: {
                                cantidadTotal: true,
                                fechaRegistro: true,
                                tipo: true
                            }
                        }
                    }
                },
                DetalleVentas: {
                    where: {
                        Venta: {
                            fechaRegistro: {
                                gte: new Date(startDate),
                                lte: new Date(endDate)
                            }
                        }
                    },
                    select: {
                        cantidad: true,
                        precioUnitario: true,
                        total: true,
                        Venta: {
                            select: {
                                fechaRegistro: true,
                                id: true
                            }
                        }
                    }
                }
            }
        });

        // Procesamiento de datos
        const rentabilidadProductos: RentabilidadProducto[] = productos.map(producto => {
            console.log(`\nProcesando producto: ${producto.nombre} (ID: ${producto.id})`);

            // Procesar compras
            const detallesCompra = producto.DetalleCompras.map(detalle => {
                let cantidad = 0;
                if (detalle.cantidadMayor && detalle.unidadesPorMayor) {
                    cantidad = detalle.cantidadMayor * detalle.unidadesPorMayor;
                    console.log(`Compra por mayor: ${detalle.cantidadMayor} paquetes x ${detalle.unidadesPorMayor} unidades = ${cantidad}`);
                } else if (detalle.cantidadIndividual) {
                    cantidad = detalle.cantidadIndividual;
                    console.log(`Compra individual: ${cantidad} unidades`);
                }

                return {
                    cantidad,
                    costo: Number(detalle.total),
                    fechaCompra: detalle.Compras.fechaRegistro,
                    compraId: detalle.Compras.id
                };
            });

            const cantidadComprada = detallesCompra.reduce((sum, detalle) => sum + detalle.cantidad, 0);
            console.log(`Cantidad total comprada: ${cantidadComprada}`);

            const costoTotal = detallesCompra.reduce((sum, detalle) => sum + detalle.costo, 0);
            console.log(`Costo total: ${costoTotal}`);

            // Procesar ventas
            const detallesVenta = producto.DetalleVentas.map(detalle => ({
                cantidad: detalle.cantidad,
                ingreso: Number(detalle.total),
                fechaVenta: detalle.Venta.fechaRegistro,
                ventaId: detalle.Venta.id
            }));

            const cantidadVendida = detallesVenta.reduce((sum, detalle) => sum + detalle.cantidad, 0);
            console.log(`Cantidad total vendida: ${cantidadVendida}`);

            const ingresoTotal = detallesVenta.reduce((sum, detalle) => sum + detalle.ingreso, 0);
            console.log(`Ingreso total: ${ingresoTotal}`);

            // Cálculos de rentabilidad
            const gananciaOPerdida = ingresoTotal - costoTotal;
            const rendimientoPorcentual = costoTotal > 0 
                ? (gananciaOPerdida / costoTotal) * 100 
                : 0;
            const eficienciaVentas = cantidadComprada > 0 
                ? (cantidadVendida / cantidadComprada) * 100 
                : 0;

            // Determinar estado
            let estado: 'GANANCIA' | 'PÉRDIDA' | 'SIN MOVIMIENTO';
            if (cantidadComprada === 0 && cantidadVendida === 0) {
                estado = 'SIN MOVIMIENTO';
            } else if (gananciaOPerdida > 0) {
                estado = 'GANANCIA';
            } else {
                estado = 'PÉRDIDA';
            }

            console.log(`Resultados para ${producto.nombre}:`);
            console.log(`- Ganancia/Pérdida: ${gananciaOPerdida}`);
            console.log(`- Rendimiento: ${rendimientoPorcentual}%`);
            console.log(`- Eficiencia: ${eficienciaVentas}%`);
            console.log(`- Estado: ${estado}`);

            return {
                productoID: producto.id,
                nombre: producto.nombre,
                precioVenta: Number(producto.precioVenta),
                cantidadComprada,
                cantidadVendida,
                costoTotal,
                ingresoTotal,
                gananciaOPerdida,
                rendimientoPorcentual,
                estado,
                eficienciaVentas
            };
        }).filter(producto => 
            producto.cantidadComprada > 0 || producto.cantidadVendida > 0
        );

        // Ordenar productos
        rentabilidadProductos.sort((a, b) => {
            if (a.estado === 'GANANCIA' && b.estado !== 'GANANCIA') return -1;
            if (a.estado !== 'GANANCIA' && b.estado === 'GANANCIA') return 1;
            return b.gananciaOPerdida - a.gananciaOPerdida;
        });

        // Calcular totales
        const totales = rentabilidadProductos.reduce((acc, item) => ({
            inversionTotal: acc.inversionTotal + item.costoTotal,
            ventasTotal: acc.ventasTotal + item.ingresoTotal,
            gananciaTotal: acc.gananciaTotal + item.gananciaOPerdida,
            rendimientoGeneral: 0,
            productosConGanancia: acc.productosConGanancia + (item.estado === 'GANANCIA' ? 1 : 0),
            productosConPerdida: acc.productosConPerdida + (item.estado === 'PÉRDIDA' ? 1 : 0)
        }), {
            inversionTotal: 0,
            ventasTotal: 0,
            gananciaTotal: 0,
            rendimientoGeneral: 0,
            productosConGanancia: 0,
            productosConPerdida: 0
        });

        totales.rendimientoGeneral = totales.inversionTotal > 0
            ? (totales.gananciaTotal / totales.inversionTotal) * 100
            : 0;

        // Preparar resumen
        const resumen: Resumen = {
            productosDestacados: rentabilidadProductos
                .filter(p => p.estado === 'GANANCIA')
                .slice(0, 3)
                .map(p => ({
                    nombre: p.nombre,
                    ganancia: p.gananciaOPerdida,
                    rendimiento: p.rendimientoPorcentual
                })),
            productosEnRiesgo: rentabilidadProductos
                .filter(p => p.estado === 'PÉRDIDA')
                .slice(0, 3)
                .map(p => ({
                    nombre: p.nombre,
                    perdida: Math.abs(p.gananciaOPerdida),
                    rendimiento: p.rendimientoPorcentual
                }))
        };

        // Retornar respuesta
        return NextResponse.json({
            data: rentabilidadProductos,
            totales,
            resumen,
            period: {
                startDate: startDate.split('T')[0],
                endDate: endDate.split('T')[0]
            }
        });

    } catch (error) {
        console.error('Error en el análisis de rentabilidad:', error);
        return NextResponse.json(
            { error: 'Error al procesar el análisis de rentabilidad' },
            { status: 500 }
        );
    }
}
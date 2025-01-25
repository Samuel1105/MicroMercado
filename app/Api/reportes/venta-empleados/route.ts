// app/Api/reportes/venta-empleados/route.ts
export const dynamic = 'force-dynamic'
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export interface VentaEmpleado {
  usuarioId: number;
  nombreEmpleado: string;
  totalVentas: number;
  cantidadVentas: number;
  promedioVentaPorTransaccion: number;
  ventasPorDia: {
    fecha: string;
    total: number;
    cantidad: number;
  }[];
  productosMasVendidos: {
    productoId: number;
    nombreProducto: string;
    cantidad: number;
    total: number;
  }[];
  metricas: {
    ventaMaxima: number;
    ventaMinima: number;
    descuentosOtorgados: number;
    ticketPromedio: number;
  };
}

export interface ResumenGeneral {
  totalVentasGlobal: number;
  cantidadVentasGlobal: number;
  promedioVentaGlobal: number;
  mejorVendedor: {
    nombreEmpleado: string;
    totalVentas: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    // Si no hay fechas, calcular el rango del último mes
    const today = new Date();
    const currentDay = today.getDate();

    if (!startDate || !endDate) {
      const endDateTime = new Date();
      const startDateTime = new Date();
      
      // Retroceder al mes anterior y mantener el mismo día
      startDateTime.setMonth(startDateTime.getMonth() - 1);
      
      // Formatear fechas a YYYY-MM-DD
      startDate = startDateTime.toISOString().split('T')[0];
      endDate = endDateTime.toISOString().split('T')[0];
    }

    // Crear fechas con horarios inicio y fin de día
    const fechaInicio = new Date(startDate);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(endDate);
    fechaFin.setHours(23, 59, 59, 999);

    // Obtener ventas por empleado
    const ventasPorEmpleado = await prisma.venta.groupBy({
      by: ["usuarioIdRegistro"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
        descuento: true,
      },
      where: {
        fechaRegistro: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    });

    // Obtener nombres de empleados
    const empleadosIds = ventasPorEmpleado.map((v) => v.usuarioIdRegistro);
    const empleados = await prisma.persona.findMany({
      where: {
        id: {
          in: empleadosIds,
        },
        //rol: 2, // Rol de vendedor
      },
      select: {
        id: true,
        primerNombre: true,
        apellidoPaterno: true,
        rol:true
      },
    });

    // Procesar datos por empleado
    const resultados = await Promise.all(
      ventasPorEmpleado.map(async (venta) => {
        const empleado = empleados.find((e) => e.id === venta.usuarioIdRegistro);

        // Obtener ventas por día
        const ventasPorDia = await prisma.venta.groupBy({
          by: ["fechaRegistro"],
          _sum: {
            total: true,
          },
          _count: {
            id: true,
          },
          where: {
            usuarioIdRegistro: venta.usuarioIdRegistro,
            fechaRegistro: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
        });

        // Obtener productos más vendidos
        const productosMasVendidos = await prisma.detalleVentas.groupBy({
          by: ["productoID"],
          _sum: {
            cantidad: true,
            total: true,
          },
          where: {
            Venta: {
              usuarioIdRegistro: venta.usuarioIdRegistro,
              fechaRegistro: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
          },
          orderBy: {
            _sum: {
              cantidad: "desc",
            },
          },
          take: 5,
        });

        // Obtener nombres de productos
        const productosIds = productosMasVendidos.map((p) => p.productoID);
        const productos = await prisma.producto.findMany({
          where: {
            id: {
              in: productosIds,
            },
          },
          select: {
            id: true,
            nombre: true,
          },
        });

        // Obtener métricas adicionales
        const metricas = await prisma.venta.aggregate({
          _max: {
            total: true,
          },
          _min: {
            total: true,
          },
          _avg: {
            total: true,
          },
          where: {
            usuarioIdRegistro: venta.usuarioIdRegistro,
            fechaRegistro: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
        });

        return {
          usuarioId: venta.usuarioIdRegistro,
          nombreEmpleado: `${empleado?.primerNombre} ${empleado?.apellidoPaterno}`,
          totalVentas: Number(venta._sum.total) || 0,
          cantidadVentas: venta._count.id,
          promedioVentaPorTransaccion: Number(venta._sum.total) / venta._count.id || 0,
          ventasPorDia: ventasPorDia.map((vpd) => ({
            fecha: vpd.fechaRegistro?.toISOString().split('T')[0],
            total: Number(vpd._sum.total) || 0,
            cantidad: vpd._count.id,
          })),
          productosMasVendidos: productosMasVendidos.map((p) => ({
            productoId: p.productoID,
            nombreProducto: productos.find((prod) => prod.id === p.productoID)?.nombre || "",
            cantidad: p._sum.cantidad || 0,
            total: Number(p._sum.total) || 0,
          })),
          metricas: {
            ventaMaxima: Number(metricas._max.total) || 0,
            ventaMinima: Number(metricas._min.total) || 0,
            descuentosOtorgados: Number(venta._sum.descuento) || 0,
            ticketPromedio: Number(metricas._avg.total) || 0,
          },
        };
      })
    );

    // Calcular resumen general
    const resumenGeneral: ResumenGeneral = {
      totalVentasGlobal: resultados.reduce((sum, r) => sum + r.totalVentas, 0),
      cantidadVentasGlobal: resultados.reduce((sum, r) => sum + r.cantidadVentas, 0),
      promedioVentaGlobal:
        resultados.reduce((sum, r) => sum + r.totalVentas, 0) /
        resultados.reduce((sum, r) => sum + r.cantidadVentas, 0) || 0,
      mejorVendedor: resultados.reduce(
        (mejor, actual) =>
          actual.totalVentas > mejor.totalVentas
            ? {
                nombreEmpleado: actual.nombreEmpleado,
                totalVentas: actual.totalVentas,
              }
            : mejor,
        { nombreEmpleado: "", totalVentas: 0 }
      ),
    };

    return NextResponse.json({
      data: {
        vendedores: resultados,
        resumen: resumenGeneral,
        periodo: {
          inicio: fechaInicio.toISOString().split('T')[0],
          fin: fechaFin.toISOString().split('T')[0]
        }
      },
    });

  } catch (error) {
    console.error("Error en reporte de ventas por empleado:", error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}
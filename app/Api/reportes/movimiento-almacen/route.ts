// app/Api/reportes/movimiento-almacen/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') 
    ? new Date(searchParams.get('startDate')!) 
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = searchParams.get('endDate') 
    ? new Date(searchParams.get('endDate')!) 
    : new Date();

  try {
    const detallesCompras = await prisma.detalleCompras.findMany({
      where: {
        fechaRegistro: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Producto: {
          include: {
            UnidadMedida: true,
            Categoria: true
          }
        },
        IngresoAlmacen: true,
        MovimientoAlmacen: {
          include: {
            UnidadMedida: true,
            Lote: true // Incluimos información del lote
          },
          orderBy: {
            fechaRegistro: 'asc'
          }
        },
        Compras: true,
        // Incluimos los lotes asociados a esta compra
        Lote: {
          include: {
            MovimientoAlmacen: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });

    const movimientos = detallesCompras.map(detalle => {
      const cantidadTotal = detalle.cantidadMayor
        ? detalle.cantidadMayor * (detalle.unidadesPorMayor || 1)
        : detalle.cantidadIndividual || 0;

      const unidadesPorPaquete = detalle.unidadesPorMayor || 1;

      // Procesamos los lotes de ingreso
      const lotes = detalle.Lote.map(lote => {
        // Calculamos cuánto se ha usado de este lote
        const cantidadUsada = lote.MovimientoAlmacen.reduce((sum, mov) => 
          sum + mov.cantidadTotal, 0);

        return {
          id: lote.id,
          numeroLote: lote.numeroLote,
          fechaVencimiento: lote.fechaVencimiento,
          cantidadInicial: lote.cantidadInicial,
          cantidadUsada,
          cantidadRestante: lote.cantidadInicial - cantidadUsada,
          estado: lote.estado
        };
      });

      // Los ingresos ahora incluyen información de lotes
      const ingresos = {
        cantidadMayor: detalle.cantidadMayor || 0,
        cantidadIndividual: detalle.cantidadIndividual || 0,
        total: cantidadTotal,
        unidadMedidaMayorId: detalle.unidadMedidaMayorId,
        lotes
      };

      // Los egresos ahora incluyen de qué lote salieron
      const egresos = detalle.MovimientoAlmacen.map(movimiento => ({
        id: movimiento.id,
        fecha: movimiento.fechaRegistro,
        cantidadMayor: Math.floor(movimiento.cantidadTotal / unidadesPorPaquete),
        cantidadIndividual: movimiento.cantidadTotal % unidadesPorPaquete,
        total: movimiento.cantidadTotal,
        unidadMedidaMayorId: detalle.unidadMedidaMayorId,
        unidadMedida: movimiento.UnidadMedida.nombre,
        lote: movimiento.Lote ? {
          id: movimiento.Lote.id,
          numeroLote: movimiento.Lote.numeroLote,
          fechaVencimiento: movimiento.Lote.fechaVencimiento
        } : null
      }));

      // Calculamos los lotes con cantidad restante
      const lotesActivos = lotes.filter(lote => lote.cantidadRestante > 0);

      const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.total, 0);
      const cantidadRestante = cantidadTotal - totalEgresos;

      const cantidadRestanteFormateada = {
        cantidadMayor: Math.floor(cantidadRestante / unidadesPorPaquete),
        cantidadIndividual: cantidadRestante % unidadesPorPaquete,
        total: cantidadRestante,
        unidadMedidaMayorId: detalle.unidadMedidaMayorId,
        lotes: lotesActivos
      };

      return {
        id: detalle.id,
        fechaCompra: detalle.Compras.fechaRegistro,
        producto: {
          id: detalle.Producto.id,
          nombre: detalle.Producto.nombre,
          categoria: detalle.Producto.Categoria.nombre,
          unidadMedida: detalle.Producto.UnidadMedida.nombre,
          unidadMedidaMayorId: detalle.unidadMedidaMayorId,
          unidadesPorMayor: detalle.unidadesPorMayor
        },
        ingresos,
        egresos,
        cantidadRestante: cantidadRestanteFormateada,
      };
    });

    // Actualizamos el resumen para incluir información de lotes
    const resumen = {
      totalProductos: new Set(movimientos.map(m => m.producto.id)).size,
      totalMovimientos: movimientos.reduce((sum, m) => sum + m.egresos.length, 0),
      totalIngresos: movimientos.reduce((sum, m) => sum + m.ingresos.total, 0),
      totalEgresos: movimientos.reduce((sum, m) => 
        sum + m.egresos.reduce((s, e) => s + e.total, 0), 0),
      productosConMovimientos: movimientos.filter(m => m.egresos.length > 0).length,
      productosSinStock: movimientos.filter(m => m.cantidadRestante.total === 0).length,
      // Nuevas métricas de lotes
      lotesPorVencer: movimientos.reduce((sum, m) => 
        sum + m.cantidadRestante.lotes.filter(lote => {
          if (!lote.fechaVencimiento) return false;
          const diasParaVencer = Math.ceil(
            (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          return diasParaVencer <= 30 && diasParaVencer > 0;
        }).length, 0),
      lotesVencidos: movimientos.reduce((sum, m) => 
        sum + m.cantidadRestante.lotes.filter(lote => 
          lote.fechaVencimiento && new Date(lote.fechaVencimiento) < new Date()
        ).length, 0)
    };

    return NextResponse.json({
      data: {
        periodo: {
          inicio: startDate,
          fin: endDate
        },
        resumen,
        movimientos
      }
    });

  } catch (error) {
    console.error('Error al obtener el reporte de movimientos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
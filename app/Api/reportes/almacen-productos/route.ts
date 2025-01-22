import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener todos los productos con sus detalles y movimientos
    const productos = await prisma.producto.findMany({
      include: {
        DetalleCompras: {
          include: {
            MovimientoAlmacen: true,
            IngresoAlmacen: true
          }
        },
        DetallesProducto: true,
        UnidadMedida: true,
        Categoria: true
      }
    });

    // 2. Procesar cada producto para obtener su estado actual
    const reporteAlmacen = productos.map(producto => {
      // Calcular el total de ingresos
      const totalIngresos = producto.DetalleCompras.reduce((sum, detalle) => {
        const cantidadTotal = detalle.cantidadMayor
          ? detalle.cantidadMayor * (detalle.unidadesPorMayor || 1)
          : detalle.cantidadIndividual || 0;
        return sum + cantidadTotal;
      }, 0);

      // Calcular el total de egresos
      const totalEgresos = producto.DetalleCompras.reduce((sum, detalle) => {
        const egresosDetalle = detalle.MovimientoAlmacen.reduce(
          (eSum, movimiento) => eSum + movimiento.cantidadTotal,
          0
        );
        return sum + egresosDetalle;
      }, 0);

      // Calcular stock actual
      const stockActual = totalIngresos - totalEgresos;

      // Convertir el stock (Decimal) a número para comparación
      const nivelOptimoNum = producto.stock instanceof Decimal 
        ? producto.stock.toNumber() 
        : Number(producto.stock);
      
      // Determinar si está por debajo del nivel óptimo
      const bajoPuntoReorden = stockActual < nivelOptimoNum;

      // Verificar si tiene fecha de vencimiento próxima
      const productosProximosVencer = producto.DetallesProducto.filter(detalle => {
        if (detalle.fechaVencimiento) {
          const diasHastaVencimiento = Math.ceil(
            (new Date(detalle.fechaVencimiento).getTime() - new Date().getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return diasHastaVencimiento <= 30; // Productos que vencen en 30 días o menos
        }
        return false;
      });

      return {
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.Categoria.nombre,
        unidadMedida: producto.UnidadMedida.nombre,
        stockActual: stockActual,
        nivelOptimo: nivelOptimoNum,
        bajoPuntoReorden: bajoPuntoReorden,
        estado: producto.estado,
        estadoInventario: {
          totalIngresos,
          totalEgresos,
          stockActual,
        },
        alertas: {
          bajoPuntoReorden,
          cantidadFaltante: bajoPuntoReorden ? nivelOptimoNum - stockActual : 0,
          productosProximosVencer: productosProximosVencer.length,
          detalleProximosVencer: productosProximosVencer.map(detalle => ({
            id: detalle.id,
            fechaVencimiento: detalle.fechaVencimiento,
            cantidad: detalle.cantidad
          }))
        }
      };
    });

    // 3. Generar resumen general
    const resumenGeneral = {
      totalProductos: reporteAlmacen.length,
      productosBajoPuntoReorden: reporteAlmacen.filter(p => p.bajoPuntoReorden).length,
      productosConAlertaVencimiento: reporteAlmacen.filter(
        p => p.alertas.productosProximosVencer > 0
      ).length,
      productosSinStock: reporteAlmacen.filter(p => p.stockActual === 0).length
    };

    return NextResponse.json({
      data: reporteAlmacen,
      resumen: resumenGeneral
    });
  } catch (error) {
    console.error('Error al generar reporte de almacén:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
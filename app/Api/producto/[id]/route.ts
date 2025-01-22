// app/api/producto/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const producto = await prisma.producto.findFirst({
      where: {
        estado: 1,
        id: Number(params.id)
      },
      include: {
        Categoria: true,
        Proveedor: true
      }
    });
    
    if (!producto) {
      return NextResponse.json({ data: "El producto no se encontró" }, { status: 404 });
    }
    
    return NextResponse.json({ data: producto }, { status: 200 });
  } catch (error) {
    console.error('Error en GET:', error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { nombre, descripcion, categoriaID, proveedorID, usuarioId } = await request.json();
    const producto = await prisma.producto.updateMany({
      data: {
        nombre,
        descripcion,
        categoriaID,
        proveedorID,
        fechaActualizacion: new Date(),
        usuarioIdActualizacion: usuarioId
      },
      where: {
        id: Number(params.id)
      }
    });
    return NextResponse.json({ data: producto }, { status: 200 });
  } catch (error) {
    console.error('Error en PUT:', error);
    return NextResponse.json({ data: error }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Primero verificamos que el producto exista
    const producto = await prisma.producto.findUnique({
      where: { id }
    });

    if (!producto) {
      return NextResponse.json({ 
        message: "Producto no encontrado" 
      }, { status: 404 });
    }

    // Verificamos el tipo de operación en el stock
    if (body.stock?.increment !== undefined) {
      // Si es un incremento, usamos la operación increment
      const incrementAmount = Number(body.stock.increment);
      
      console.log('Stock actual:', producto.stock);
      console.log('Incremento:', incrementAmount);

      const updatedProducto = await prisma.producto.update({
        where: { id },
        data: {
          stock: {
            increment: incrementAmount
          }
        }
      });

      console.log('Nuevo stock:', updatedProducto.stock);

      return NextResponse.json({
        success: true,
        data: updatedProducto,
        stockAnterior: producto.stock,
        incremento: incrementAmount,
        stockNuevo: updatedProducto.stock
      }, { status: 200 });
    }
    
    // Si es una actualización directa del stock
    if (body.stock !== undefined) {
      const updatedProducto = await prisma.producto.update({
        where: { id },
        data: {
          stock: Number(body.stock)
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedProducto
      }, { status: 200 });
    }

    return NextResponse.json({ 
      message: "Operación de stock no válida" 
    }, { status: 400 });

  } catch (error) {
    console.error('Error al actualizar el stock:', error);
    return NextResponse.json({
      success: false,
      message: "Error al actualizar el stock",
      error: error
    }, { status: 500 });
  }
}
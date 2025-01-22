// app/api/producto/catalogo/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

const STOCK_MINIMO = 10;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');
    const search = searchParams.get('search') || '';
    const categoria = searchParams.get('categoria');
    const stockFilter = searchParams.get('stockFilter') || 'all';

    try {
        const where = {
            estado: 1,
            nombre: { contains: search },
            ...(categoria && categoria !== 'all' ? { 
                categoriaID: parseInt(categoria) 
            } : {}),
            ...(stockFilter === 'low' ? { 
                stock: { 
                    gt: new Decimal(0), 
                    lte: new Decimal(STOCK_MINIMO) 
                } 
            } : {}),
            ...(stockFilter === 'out' ? { 
                stock: new Decimal(0) 
            } : {})
        };

        const [total, productos] = await Promise.all([
            prisma.producto.count({ where }),
            prisma.producto.findMany({
                skip,
                take,
                where,
                include: {
                    Categoria: true,
                    Proveedor: true,
                    UnidadMedida: true,
                    DetalleCompras: {
                        where: { estado: 1 },
                        include: {
                            Lote: {
                                where: { estado: 1 }
                            }
                        }
                    }
                },
                orderBy: { nombre: 'asc' }
            })
        ]);

        const productosConAlertas = productos.map(producto => {
            const stockNum = Number(producto.stock);
            const lotesPorVencer = producto.DetalleCompras.reduce((count, dc) => {
                return count + dc.Lote.reduce((loteCount, lote) => {
                    if (!lote.fechaVencimiento) return loteCount;
                    
                    const diasParaVencer = Math.ceil(
                        (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / 
                        (1000 * 60 * 60 * 24)
                    );
                    
                    return loteCount + (diasParaVencer <= 30 && diasParaVencer > 0 ? 1 : 0);
                }, 0);
            }, 0);

            return {
                ...producto,
                stock: stockNum,
                alertas: {
                    sinStock: stockNum === 0,
                    stockBajo: stockNum > 0 && stockNum <= STOCK_MINIMO,
                    lotesPorVencer
                }
            };
        });

        return NextResponse.json({
            data: productosConAlertas,
            total,
            page: Math.floor(skip / take) + 1,
            totalPages: Math.ceil(total / take)
        });

    } catch (error) {
        console.error("Error en la API de productos:", error);
        return NextResponse.json({
            message: "Error al obtener los productos",
            error: error instanceof Error ? error.message : "Error desconocido"
        }, { status: 500 });
    }
}

export async function POST(request:Request) {
    try {
        const {nombre,descripcion,precio , categoria,proveedor,  unidad , usuario , serie} = await request.json();
        const producto = await prisma.producto.create({
            data:{
                nombre: nombre,
                descripcion: descripcion,
                precioVenta: parseFloat(precio),
                series: Number(serie),
                categoriaID: Number(categoria),
                proveedorID: Number(proveedor),
                unidadMedidaId: Number(unidad),
                usuarioIdRegistro: usuario
            }
        })
        return NextResponse.json({data: producto}, {status:200})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message:error} , {status:500})
    }
}
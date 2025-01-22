import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try {
        const proveedores = await prisma.proveedor.findMany();

        if (proveedores.length > 0) {
            return NextResponse.json({ data: proveedores }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No se encontró ningún proveedor" }, 
                { status: 404 });
        }

    } catch (error) {
        NextResponse.json(error)
    }
}


export async function POST(request: Request) {
    try {
        const {nombre , celular } = await request.json();
        
        const proveedor = await prisma.proveedor.create({
            data:{
                nombre: nombre,
                celular: celular
            }
        })

        return NextResponse.json({data: proveedor}, {status:200})

    } catch (error) {
        return NextResponse.json({data:error} , {status:500})
    }
}
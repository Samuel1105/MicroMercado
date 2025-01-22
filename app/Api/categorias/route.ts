import prisma from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categorias = await prisma.categoria.findMany();
        if(categorias.length > 0){
            return NextResponse.json({data:categorias} , {status:200})
        }else{
            return NextResponse.json({ message: "No se encontró ningúna categoria" }, 
                { status: 404 });
        }
    } catch (error) {
        NextResponse.json(error)
    }
}

export async function POST(request : Request) {
    try {
        const { nombre } = await request.json();
        const categoria = await prisma.categoria.create({
            data:{
                nombre: nombre
            }
        })

        return NextResponse.json({data: categoria} , {status:200})
    } catch (error) {
        NextResponse.json(error)
    }
}
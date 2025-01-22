import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ventaId, email } = body;

    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        Cliente: true,
        DetalleVentas: {
          include: {
            Producto: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    // Crear el PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Tamaño carta
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colores corporativos
    const colorPrimario = rgb(0.12, 0.47, 0.86);
    const colorSecundario = rgb(0.2, 0.2, 0.2);

    // Margen estándar
    const margin = 40;
    const tableMargin = margin - 5;
    const tableWidth = 532;

    // Encabezado con fondo azul
    page.drawRectangle({
      x: 0,
      y: 742,
      width: 612,
      height: 50,
      color: colorPrimario,
    });

    // Título principal centrado
    const titleText = 'PROFORMA - ANITA S.A.';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 24);
    page.drawText(titleText, {
      x: (612 - titleWidth) / 2,
      y: 760,
      size: 24,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    // Nombre del minimercado centrado
    const subtitleText = 'MINIMERCADO JR';
    const subtitleWidth = helveticaBold.widthOfTextAtSize(subtitleText, 28);
    page.drawText(subtitleText, {
      x: (612 - subtitleWidth) / 2,
      y: 700,
      size: 28,
      font: helveticaBold,
      color: colorPrimario
    });

    // Información de la empresa
    page.drawText('NIT: 1028627025', {
      x: margin,
      y: 670,
      size: 12,
      font: helveticaFont
    });

    page.drawText(`PROFORMA No. ${ventaId.toString().padStart(8, '0')}`, {
      x: margin,
      y: 650,
      size: 12,
      font: helveticaFont
    });

    // Fecha formateada
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const fechaActual = new Date().toLocaleDateString('es-ES', options);

    page.drawText(`FECHA: ${fechaActual}`, {
      x: margin,
      y: 630,
      size: 12,
      font: helveticaFont
    });

    // Información del cliente con recuadro
    if (venta.Cliente) {
      page.drawRectangle({
        x: tableMargin,
        y: 570,
        width: tableWidth,
        height: 45,
        borderColor: colorPrimario,
        borderWidth: 1
      });

      page.drawText('DATOS DEL CLIENTE:', {
        x: margin,
        y: 595,
        size: 12,
        font: helveticaBold,
        color: colorSecundario
      });

      page.drawText(`Nombre: ${venta.Cliente.nombre}`, {
        x: margin,
        y: 580,
        size: 12,
        font: helveticaFont
      });

      page.drawText(`CI/NIT: ${venta.Cliente.carnet}`, {
        x: 400,
        y: 580,
        size: 12,
        font: helveticaFont
      });
    }

    // Configuración de la tabla
    const columns = [
      { header: 'CANT.', width: 50, align: 'center' },
      { header: 'DETALLE', width: 200, align: 'left' },
      { header: 'PRECIO UNIT.', width: 80, align: 'right' },
      { header: 'DESCUENTO', width: 80, align: 'right' },
      { header: 'SUBTOTAL', width: 80, align: 'right' },
      { header: 'TOTAL', width: 42, align: 'right' }
    ];

    let yPos = 540;

    // Encabezado de la tabla
    page.drawRectangle({
      x: tableMargin,
      y: yPos - 5,
      width: tableWidth,
      height: 25,
      color: colorPrimario,
    });

    // Dibujar headers
    let xPos = tableMargin + 10;
    columns.forEach(col => {
      const text = col.header;
      const textWidth = helveticaBold.widthOfTextAtSize(text, 10);
      let xPosText = xPos;
      
      if (col.align === 'right') {
        xPosText = xPos + col.width - textWidth - 10;
      } else if (col.align === 'center') {
        xPosText = xPos + (col.width - textWidth) / 2;
      }

      page.drawText(text, {
        x: xPosText,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: rgb(1, 1, 1)
      });
      xPos += col.width;
    });

    yPos -= 25;

    // Detalles de la venta
    venta.DetalleVentas.forEach((detalle, index) => {
      if (index % 2 === 0) {
        page.drawRectangle({
          x: tableMargin,
          y: yPos - 5,
          width: tableWidth,
          height: 20,
          color: rgb(0.97, 0.97, 0.97),
        });
      }

      xPos = tableMargin + 10;

      // Cantidad (centrada)
      const cantText = detalle.cantidad.toString();
      const cantWidth = helveticaFont.widthOfTextAtSize(cantText, 10);
      page.drawText(cantText, {
        x: xPos + (columns[0].width - cantWidth) / 2 - 10,
        y: yPos,
        size: 10,
        font: helveticaFont
      });
      xPos += columns[0].width;

      // Nombre del producto
      page.drawText(detalle.Producto.nombre, {
        x: xPos,
        y: yPos,
        size: 10,
        font: helveticaFont
      });
      xPos += columns[1].width;

      // Precio unitario
      const precioText = `Bs ${detalle.precioUnitario.toFixed(2)}`;
      page.drawText(precioText, {
        x: xPos + columns[2].width - helveticaFont.widthOfTextAtSize(precioText, 10) - 10,
        y: yPos,
        size: 10,
        font: helveticaFont
      });
      xPos += columns[2].width;

      // Descuento
      const descuentoText = `Bs ${detalle.descuento.toFixed(2)}`;
      page.drawText(descuentoText, {
        x: xPos + columns[3].width - helveticaFont.widthOfTextAtSize(descuentoText, 10) - 10,
        y: yPos,
        size: 10,
        font: helveticaFont
      });
      xPos += columns[3].width;

      // Subtotal
      const subtotalText = `Bs ${detalle.subtotal.toFixed(2)}`;
      page.drawText(subtotalText, {
        x: xPos + columns[4].width - helveticaFont.widthOfTextAtSize(subtotalText, 10) - 10,
        y: yPos,
        size: 10,
        font: helveticaFont
      });
      xPos += columns[4].width;

      // Total
      const totalText = `Bs ${detalle.total.toFixed(2)}`;
      page.drawText(totalText, {
        x: xPos + columns[5].width - helveticaFont.widthOfTextAtSize(totalText, 10) - 10,
        y: yPos,
        size: 10,
        font: helveticaFont
      });

      yPos -= 20;
    });

    // Sección de totales
    yPos -= 10;
    
    // Recuadro para totales
    page.drawRectangle({
      x: tableMargin,
      y: yPos - 60,
      width: tableWidth,
      height: 60,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: colorPrimario,
      borderWidth: 1,
    });

    // Totales alineados a la derecha
    const xPosTotal = tableMargin + tableWidth - 200;

    // Subtotal
    const subtotalFinalText = `Subtotal: Bs ${venta.subtotal.toFixed(2)}`;
    page.drawText(subtotalFinalText, {
      x: xPosTotal,
      y: yPos - 20,
      size: 11,
      font: helveticaFont
    });

    // Descuento total
    const descuentoFinalText = `Descuento Total: Bs ${venta.descuento.toFixed(2)}`;
    page.drawText(descuentoFinalText, {
      x: xPosTotal,
      y: yPos - 35,
      size: 11,
      font: helveticaFont,
      color: rgb(0.8, 0.2, 0.2)
    });

    // Total final
    const totalFinalText = `TOTAL A PAGAR: Bs ${venta.total.toFixed(2)}`;
    page.drawText(totalFinalText, {
      x: xPosTotal,
      y: yPos - 50,
      size: 12,
      font: helveticaBold,
      color: colorPrimario
    });

    // Monto en letras
    const montoLetras = `SON: ${numeroALetras(venta.total)} Bolivianos`;
    page.drawText(montoLetras, {
      x: tableMargin,
      y: yPos - 80,
      size: 11,
      font: helveticaFont,
      color: colorSecundario
    });

    // Línea decorativa final
    page.drawLine({
      start: { x: tableMargin, y: 80 },
      end: { x: tableMargin + tableWidth, y: 80 },
      thickness: 2,
      color: colorPrimario,
    });

    // Mensaje de agradecimiento centrado
    const mensajeFinal = '¡Gracias por su preferencia!';
    const mensajeWidth = helveticaBold.widthOfTextAtSize(mensajeFinal, 14);
    page.drawText(mensajeFinal, {
      x: (612 - mensajeWidth) / 2,
      y: 50,
      size: 14,
      font: helveticaBold,
      color: colorPrimario
    });

    // Pie de página centrado
    const piePagina = 'MINIMERCADO JR - Siempre cerca de ti';
    const pieWidth = helveticaFont.widthOfTextAtSize(piePagina, 10);
    page.drawText(piePagina, {
      x: (612 - pieWidth) / 2,
      y: 30,
      size: 10,
      font: helveticaFont
    });

    // Generar PDF y enviar correo
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "samuelaraoz789@gmail.com",
        pass: "lldg wwpf uhio lsrw"
      }
    });

    await transporter.sendMail({
      from: '"MINIMERCADO JR" <samuelaraoz789@gmail.com>',
      to: email,
      subject: `Proforma de su compra - ${ventaId}`,
      text: "Adjunto encontrará su proforma.",
      attachments: [{
        filename: `proforma_${ventaId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    return NextResponse.json({ message: "Proforma enviada con éxito" });

  } catch (error) {
    console.error('Error al enviar la proforma:', error);
    return NextResponse.json(
      { 
        error: "Error al enviar la proforma",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Función para convertir números a letras
function numeroALetras(numero: Decimal | number): string {
  const valor = typeof numero === 'number' ? numero : numero.toNumber();
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  
  const convertirNumero = (num: number): string => {
    if (num === 0) return "cero";
    if (num >= 1 && num <= 9) return unidades[num];
    if (num >= 10 && num <= 99) return convertirDecenas(num);
    if (num >= 100 && num <= 999) return convertirCentenas(num);
    return "";
  };

  const convertirDecenas = (num: number): string => {
    const unidad = num % 10;
    const decena = Math.floor(num / 10);
    if (num === 10) return "diez";
    if (num === 11) return "once";
    if (num === 12) return "doce";
    if (num === 13) return "trece";
    if (num === 14) return "catorce";
    if (num === 15) return "quince";
    return decenas[decena] + (unidad ? ` y ${unidades[unidad]}` : "");
  };

  const convertirCentenas = (num: number): string => {
    const centena = Math.floor(num / 100);
    const resto = num % 100;
    if (centena === 1 && resto === 0) return "cien";
    return centenas[centena] + (resto ? ` ${convertirDecenas(resto)}` : "");
  };

  const [enteros, decimales] = valor.toFixed(2).split(".");
  const parteEntera = convertirNumero(parseInt(enteros));
  const parteDecimal = convertirNumero(parseInt(decimales));

  return parteEntera + " con " + parteDecimal + "/100";
}
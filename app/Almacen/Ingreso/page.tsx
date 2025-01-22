'use client'
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Checkbox, Select, SelectItem, Input, Button, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import Swal from 'sweetalert2';

interface Lote {
  id: number;
  numeroLote: string;
  fechaVencimiento: Date | null;
  cantidadInicial: number;
  estado: number | null;
  detalleCompraID: number;
}

interface DetalleCompras {
  id: number;
  cantidadMayor: number | null;
  unidadesPorMayor: number | null;
  cantidadIndividual: number | null;
  unidadMedidaMayorId: number | null;
  Producto: {
    id: number;
    nombre: string;
    tieneCodigoBarras: boolean;
  } | null;
  estado: number;
  Lote: Lote[]; // Ahora es un array de Lote
}

interface IngresoAlmacen {
  id: number;
  detalleCompraID: number;
  cantidadIngresada: number;
}

interface UnidadMedida {
  id: number;
  nombre: string;
}

interface DetalleProducto {
  codigoBarras: string;
}

export default function Page() {
  const [compras, setCompras] = useState<DetalleCompras[]>([]);
  const [ingresos, setIngresos] = useState<IngresoAlmacen[]>([]);
  const [selectedCompra, setSelectedCompra] = useState<DetalleCompras | null>(null);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [cantidad, setCantidad] = useState("");
  const [tipoIngreso, setTipoIngreso] = useState<"unidad" | "mayor">("unidad");
  const [isLoading, setIsLoading] = useState(false);
  const [tieneCodigoBarras, setTieneCodigoBarras] = useState(false);
  const [tieneFechaVencimiento, setTieneFechaVencimiento] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [barcodeDetails, setBarcodeDetails] = useState<DetalleProducto[]>([]);
  const [fechaVencimiento, setFechaVencimiento] = useState<string>("");
  const [currentBarcodeIndex, setCurrentBarcodeIndex] = useState(0);
  const barcodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchCompras();
    fetchIngresos();
    fetchUnidadesMedida();
  }, []);

  useEffect(() => {
    if (showModal && barcodeInputRefs.current[0]) {
      barcodeInputRefs.current[0].focus();
    }
  }, [showModal]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && showModal) {
        event.preventDefault();
        handleBarcodeInput(currentBarcodeIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, currentBarcodeIndex]);

  const fetchCompras = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/Api/detallescompras');
      setCompras(response.data.data);
    } catch (error) {
      console.error('Error fetching compras:', error);
      Swal.fire('', 'No hay compras', 'question');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIngresos = async () => {
    try {
      const response = await axios.get('/Api/almacen');
      setIngresos(response.data.data);
    } catch (error) {
      console.error('Error fetching ingresos:', error);
      Swal.fire('Error', 'No se pudieron cargar los ingresos', 'error');
    }
  };

  const fetchUnidadesMedida = async () => {
    try {
      const response = await axios.get('/Api/unidadmedidas');
      setUnidadesMedida(response.data.data);
    } catch (error) {
      console.error('Error fetching unidades de medida:', error);
      Swal.fire('Error', 'No se pudieron cargar las unidades de medida', 'error');
    }
  };

  const getUnidadMedidaNombre = (id: number | null) => {
    if (id === null) return 'Unidades';
    const unidad = unidadesMedida.find(u => u.id === id);
    return unidad ? unidad.nombre : 'Unidad desconocida';
  };

  const getUnidadMedida = (compra: DetalleCompras | null, tipo: "unidad" | "mayor") => {
    if (!compra) return 'Unidades';
    if (tipo === "mayor" && compra.unidadMedidaMayorId) {
      return getUnidadMedidaNombre(compra.unidadMedidaMayorId);
    }
    return 'Unidades';
  };

  const calculateTotal = (compra: DetalleCompras): number => {
    if (compra.cantidadMayor && compra.cantidadMayor > 0 && compra.unidadesPorMayor) {
      return compra.cantidadMayor * compra.unidadesPorMayor;
    } else {
      return compra.cantidadIndividual ?? 0;
    }
  };

  const calculateIngresado = (compraId: number): number => {
    return ingresos
      .filter(ingreso => ingreso.detalleCompraID === compraId)
      .reduce((sum, ingreso) => sum + ingreso.cantidadIngresada, 0);
  };

  const calculateRemaining = (compra: DetalleCompras): { paquetes: number, unidades: number, total: number, unidadesRestantes: number } => {
    const totalComprado = calculateTotal(compra);
    const totalIngresado = calculateIngresado(compra.id);
    const restante = totalComprado - totalIngresado;

    if (compra.unidadesPorMayor && compra.unidadesPorMayor > 0) {
      const paquetesRestantes = Math.floor(restante / compra.unidadesPorMayor);
      const unidadesRestantes = restante % compra.unidadesPorMayor;
      return {
        paquetes: paquetesRestantes,
        unidades: unidadesRestantes,
        total: restante,
        unidadesRestantes: restante
      };
    } else {
      return {
        paquetes: 0,
        unidades: restante,
        total: restante,
        unidadesRestantes: restante
      };
    }
  };

  const handleCompraSelection = (compra: DetalleCompras | null) => {
    setSelectedCompra(compra);
    if (compra) {
      const isPorMayor = !!compra.cantidadMayor && compra.unidadesPorMayor && compra.unidadesPorMayor > 0;
      setTipoIngreso(isPorMayor ? "mayor" : "unidad");
      setTieneCodigoBarras(compra.Producto?.tieneCodigoBarras || false);
      setTieneFechaVencimiento(false);
    } else {
      setTipoIngreso("unidad");
      setTieneCodigoBarras(false);
      setTieneFechaVencimiento(false);
    }
  };

  const handleIngresoProducto = async () => {
    if (!selectedCompra || !cantidad) {
      Swal.fire('Error', 'Por favor, seleccione un producto y especifique la cantidad', 'error');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    let cantidadTotal = 0;

    if (tipoIngreso === "mayor" && selectedCompra.unidadesPorMayor) {
      cantidadTotal = cantidadNum * selectedCompra.unidadesPorMayor;
    } else {
      cantidadTotal = cantidadNum;
    }

    const remaining = calculateRemaining(selectedCompra);

    if (tipoIngreso === "mayor" && cantidadNum > remaining.paquetes) {
      Swal.fire('Error', `No puede ingresar más de ${remaining.paquetes} paquetes`, 'error');
      return;
    }

    if (cantidadTotal > remaining.total) {
      Swal.fire('Error', `No puede ingresar más de ${remaining.total} unidades`, 'error');
      return;
    }

    if (tieneCodigoBarras || tieneFechaVencimiento) {
      setShowModal(true);
      if (tieneCodigoBarras) {
        setBarcodeDetails(Array(cantidadNum).fill({ codigoBarras: '' }));
      }
      setFechaVencimiento("");
      setCurrentBarcodeIndex(0);
    } else {
      await processIngreso(cantidadTotal);
    }
  };

  const processIngreso = async (cantidadTotal: number) => {
    setIsLoading(true);
    try {
      // Registrar ingreso en IngresoAlmacen
      const ingresoResponse = await axios.post('/Api/almacen', {
        detalleCompraID: selectedCompra!.id,
        cantidadIngresada: cantidadTotal,
        usuarioIngreso: 1
      });

      // Determinar la unidad de medida correcta
      const unidadMedidaID = tipoIngreso === "unidad" 
        ? 2 
        : selectedCompra!.unidadMedidaMayorId || 2;

      // Registrar movimiento en MovimientoAlmacen
      await axios.post('/Api/movimientoalmacen', {
        fechaRegistro: new Date(),
        cantidadPaquetes: tipoIngreso === "mayor" ? parseInt(cantidad) : 0,
        cantidadUnidades: tipoIngreso === "unidad" ? parseInt(cantidad) : 0,
        cantidadTotal,
        tipo: 1,
        productoID: selectedCompra!.Producto?.id,
        detalleComprasID: selectedCompra!.id,
        usuarioRegistro: 1,
        unidadMedidaID,
        loteID: selectedCompra!.Lote[0]?.id || null
      });

      // Insertar en DetallesProducto si tiene código de barras
      if (tieneCodigoBarras) {
        for (const detalle of barcodeDetails) {
          const cantidadPorCodigo = tipoIngreso === "mayor" 
            ? selectedCompra!.unidadesPorMayor || 1
            : 1;

          await axios.post('/Api/detallesproducto', {
            productoID: selectedCompra!.Producto?.id,
            codigoBarras: detalle.codigoBarras,
            fechaVencimiento: selectedCompra!.Lote[0]?.fechaVencimiento || null,
            cantidad: cantidadPorCodigo,
            loteID: selectedCompra!.Lote[0]?.id || null
          });
        }
      }

      // Actualizar el stock del producto - CORREGIDO
      await axios.patch(`/Api/producto/${selectedCompra!.Producto?.id}`, {
        stock: {
          increment: cantidadTotal // Ahora pasamos directamente la cantidad a incrementar
        }
      });

      // Actualizar el estado en DetalleCompras si es necesario
      const nuevoTotalIngresado = calculateIngresado(selectedCompra!.id) + cantidadTotal;
      const nuevoEstado = nuevoTotalIngresado >= calculateTotal(selectedCompra!) ? 1 : 0;

      if (nuevoEstado !== selectedCompra!.estado) {
        await axios.patch(`/Api/detallescompras/${selectedCompra!.id}`, {
          estado: nuevoEstado
        });
      }

      // Actualizar estados locales
      setIngresos([...ingresos, ingresoResponse.data.data]);
      await fetchCompras();

      // Limpiar formulario
      resetForm();
      
      Swal.fire('Éxito', 'Producto ingresado correctamente', 'success');
    } catch (error) {
      console.error('Error al ingresar producto:', error);
      Swal.fire('Error', 'Hubo un error al ingresar el producto', 'error');
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
};

  const resetForm = () => {
    setCantidad("");
    setSelectedCompra(null);
    setTieneCodigoBarras(false);
    setTieneFechaVencimiento(false);
    setBarcodeDetails([]);
    setFechaVencimiento("");
    setCurrentBarcodeIndex(0);
  };

  const handleModalSubmit = () => {
    if (tieneCodigoBarras && barcodeDetails.some(detail => !detail.codigoBarras)) {
      Swal.fire('Error', 'Por favor, ingrese todos los códigos de barras', 'error');
      return;
    }
    if (tieneFechaVencimiento && !fechaVencimiento) {
      Swal.fire('Error', 'Por favor, ingrese la fecha de vencimiento', 'error');
      return;
    }

    const cantidadTotal = parseInt(cantidad) *
      (tipoIngreso === "mayor" && selectedCompra?.unidadesPorMayor
        ? selectedCompra.unidadesPorMayor
        : 1);

    processIngreso(cantidadTotal);
  };

  const handleBarcodeInput = (index: number) => {
    if (index < barcodeDetails.length - 1) {
      setCurrentBarcodeIndex(index + 1);
      const nextInput = barcodeInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const renderBarcodeInput = (detail: DetalleProducto, index: number) => (
    <Input
      key={index}
      label={`Código de Barras ${index + 1}`}
      value={detail.codigoBarras}
      onChange={(e) => {
        const newDetails = [...barcodeDetails];
        newDetails[index] = { ...newDetails[index], codigoBarras: e.target.value };
        setBarcodeDetails(newDetails);
      }}
      ref={(el) => {
        if (el) {
          barcodeInputRefs.current[index] = el;
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleBarcodeInput(index);
        }
      }}
    />
  );

  return (
    <div className="p-4 flex flex-col">
      <div className="w-full mb-4">
        <h1 className="text-2xl font-bold mb-4">Lista de Compras</h1>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner label="Cargando..." />
          </div>
        ) : (
          <Table 
  aria-label="Tabla de Compras" 
  selectionMode="single" 
  onRowAction={(key) => {
    const compra = compras.find(c => c.id === Number(key));
    handleCompraSelection(compra ?? null);
  }}
>
  <TableHeader>
    <TableColumn>PRODUCTO</TableColumn>
    <TableColumn>LOTE</TableColumn>
    <TableColumn>FECHA VENC.</TableColumn>
    <TableColumn>CANTIDAD COMPRADA</TableColumn>
    <TableColumn>UNIDADES POR PAQUETE</TableColumn>
    <TableColumn>TOTAL UNIDADES</TableColumn>
    <TableColumn>CANTIDAD RESTANTE</TableColumn>
    <TableColumn>UNIDADES RESTANTES</TableColumn>
    <TableColumn>ESTADO</TableColumn>
  </TableHeader>
  <TableBody>
    {compras.map((compra) => {
      const remaining = calculateRemaining(compra);
      const unidadMedidaNombre = getUnidadMedidaNombre(compra.unidadMedidaMayorId);
      const lote = compra.Lote && compra.Lote.length > 0 ? compra.Lote[0] : null;
      
      return (
        <TableRow key={compra.id}>
          <TableCell>{compra.Producto?.nombre || 'Nombre no disponible'}</TableCell>
          <TableCell>{lote?.numeroLote || 'Sin lote'}</TableCell>
          <TableCell>
            {lote?.fechaVencimiento 
              ? new Date(lote.fechaVencimiento).toLocaleDateString()
              : 'N/A'}
          </TableCell>
          <TableCell>
            {compra.cantidadMayor && compra.cantidadMayor > 0
              ? `${compra.cantidadMayor} ${unidadMedidaNombre}`
              : `${compra.cantidadIndividual ?? 'No especificado'} unidades`}
          </TableCell>
          <TableCell>{compra.unidadesPorMayor || 'N/A'}</TableCell>
          <TableCell>{calculateTotal(compra)}</TableCell>
          <TableCell>
            {remaining.total === 0 ? '0 unidades' :
              remaining.paquetes > 0 
                ? `${remaining.paquetes} ${unidadMedidaNombre} y ${remaining.unidades} unidades` 
                : `${remaining.unidades} unidades`}
          </TableCell>
          <TableCell>{remaining.unidadesRestantes} unidades</TableCell>
          <TableCell>{compra.estado === 1 ? 'Ingresado' : 'Pendiente'}</TableCell>
        </TableRow>
      );
    })}
  </TableBody>
</Table>
        )}
      </div>

      <div className="w-full mt-4">
        <h2 className="text-xl font-bold mb-4">Detalles del Producto</h2>
        {selectedCompra ? (
          <>
            <Table aria-label="Detalles del Producto">
              <TableHeader>
                <TableColumn>ATRIBUTO</TableColumn>
                <TableColumn>VALOR</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>{selectedCompra.Producto?.nombre || 'No disponible'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tiene Código de Barras</TableCell>
                  <TableCell>
                    <Checkbox
                      isSelected={tieneCodigoBarras}
                      onValueChange={setTieneCodigoBarras}
                      aria-label="Tiene código de barras"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tipo de Ingreso</TableCell>
                  <TableCell>
                    <Select
                      label="Tipo de Ingreso"
                      value={tipoIngreso}
                      onChange={(e) => setTipoIngreso(e.target.value as "unidad" | "mayor")}
                      isDisabled={!selectedCompra.cantidadMayor || !selectedCompra.unidadesPorMayor}
                    >
                      {[
                      <SelectItem key="unidad" value="unidad">Por Unidad</SelectItem>,
                      selectedCompra.cantidadMayor && selectedCompra.unidadesPorMayor ? (
                        <SelectItem key="mayor" value="mayor">Por Mayor</SelectItem>
                      ) : <></>
                    ].filter(Boolean)}
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Unidad de Medida</TableCell>
                  <TableCell>
                    {getUnidadMedida(selectedCompra, tipoIngreso)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      label="Cantidad"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder={tipoIngreso === "mayor"
                        ? `Cantidad de ${getUnidadMedida(selectedCompra, "mayor")} (${selectedCompra.unidadesPorMayor} unidades c/u)`
                        : "Cantidad de unidades"}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button
              onClick={handleIngresoProducto}
              className="mt-4"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Ingresar Producto'}
            </Button>
          </>
        ) : (
          <p>Seleccione una compra para ver los detalles</p>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        scrollBehavior="inside"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {tieneCodigoBarras ? 'Ingresar Códigos de Barras y Fecha' : 'Ingresar Fecha de Vencimiento'}
          </ModalHeader>
          <ModalBody>
            <div className="max-h-[60vh] overflow-y-auto">
              {tieneFechaVencimiento && (
                <Input
                  type="date"
                  label="Fecha de Vencimiento"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="mb-4"
                />
              )}
              {tieneCodigoBarras && barcodeDetails.map((detail, index) => (
                <div key={index} className="mb-4">
                  {renderBarcodeInput(detail, index)}
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleModalSubmit}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
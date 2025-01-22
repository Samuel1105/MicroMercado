'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Card, Pagination, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';

// Definición de la interfaz Venta
interface Cliente {
  nombre: string;
  correo: string;
}

interface Producto {
  nombre: string;
}

interface DetalleVenta {
  id: number;
  Producto: Producto;
  precioUnitario: string;
  cantidad: number;
}

interface Venta {
  id: number;
  subtotal: string;
  descuento: string;
  total: string;
  montoRecibido: string;
  cambio: string;
  fechaRegistro: string;
  Cliente: Cliente;
  DetalleVentas: DetalleVenta[];
}

const ITEMS_PER_PAGE = 10; // Cantidad de elementos por página

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [totalItems, setTotalItems] = useState(0); // Total de elementos
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  useEffect(() => {
    fetchVentas();
  }, [fechaInicio, fechaFin, currentPage]); // Actualiza cuando cambian las fechas o la página

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/Api/venta/historial', {
        params: {
          fechaInicio,
          fechaFin,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        },
      });
      setVentas(response.data.items);
      setTotalItems(response.data.total); // Total de elementos
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE); // Calcular total de páginas

  const handleViewDetails = (venta: Venta) => {
    setSelectedVenta(venta);
    onOpen();
  };

  const closeModal = () => {
    onOpenChange();
    setSelectedVenta(null);
  };

  return (
    <Card>
     

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <Table aria-label="Historial de ventas">
            <TableHeader>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Cliente</TableColumn>
              <TableColumn>Subtotal</TableColumn>
              <TableColumn>Descuento</TableColumn>
              <TableColumn>Total</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell>
                    {new Date(venta.fechaRegistro).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {venta.Cliente.nombre}
                  </TableCell>
                  <TableCell>
                    {(Number(venta.subtotal) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {(Number(venta.descuento) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {(Number(venta.total) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button onPress={() => handleViewDetails(venta)}>Ver detalles</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Componente de paginación */}
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Detalles de la Venta</ModalHeader>
              <ModalBody>
                {selectedVenta && (
                  <div>
                    {selectedVenta.DetalleVentas.map((detalle) => (
                      <div key={detalle.id}>
                        <p>{detalle.Producto.nombre}</p>
                        <p>Precio: {detalle.precioUnitario}</p>
                        <p>Cantidad: {detalle.cantidad}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}

'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Pagination, DateRangePicker } from "@nextui-org/react";
import { parseDate, DateValue } from "@internationalized/date";

interface UnidadMedida {
  id: number;
  nombre: string;
}

interface Cantidad {
  cantidadMayor: number;
  cantidadIndividual: number;
  total: number;
  unidadMedidaMayorId: number | null;
}

interface Egreso extends Cantidad {
  id: number;
  fecha: string;
}

interface HistoricoItem {
  id: number;
  fechaCompra: string;
  producto: string;
  ingresos: Cantidad;
  egresos: Egreso[];
  cantidadRestante: Cantidad;
}

const ITEMS_PER_PAGE = 10;

export default function HistoricoAlmacen() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoItem[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start: DateValue | null; end: DateValue | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    fetchHistorico();
    fetchUnidadesMedida();
  }, []);

  useEffect(() => {
    filterHistorico();
  }, [dateRange, historico]);

  const fetchHistorico = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ data: HistoricoItem[] }>('/Api/historicoalmacen');
      setHistorico(response.data.data);
      setFilteredHistorico(response.data.data);
    } catch (error) {
      console.error('Error fetching histórico de almacén:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnidadesMedida = async () => {
    try {
      const response = await axios.get<{ data: UnidadMedida[] }>('/Api/unidadmedidas');
      setUnidadesMedida(response.data.data);
    } catch (error) {
      console.error('Error fetching unidades de medida:', error);
    }
  };

  const filterHistorico = () => {
    if (!dateRange.start || !dateRange.end) {
      setFilteredHistorico(historico);
      return;
    }

    const startDate = new Date(dateRange.start.year, dateRange.start.month - 1, dateRange.start.day);
    const endDate = new Date(dateRange.end.year, dateRange.end.month - 1, dateRange.end.day);

    const filtered = historico.filter(item => {
      const itemDate = new Date(item.fechaCompra);
      return itemDate >= startDate && itemDate <= endDate;
    });

    setFilteredHistorico(filtered);
    setCurrentPage(1);
  };

  const getUnidadMedidaNombre = (id: number | null) => {
    if (id === null) return 'unidades';
    const unidad = unidadesMedida.find(u => u.id === id);
    return unidad ? unidad.nombre.toLowerCase() : 'unidades';
  };

  const formatCantidad = (cantidad: Cantidad) => {
    const unidadMayor = getUnidadMedidaNombre(cantidad.unidadMedidaMayorId);
    if (cantidad.unidadMedidaMayorId === null || cantidad.cantidadMayor === 0) {
      return `${cantidad.total} unidades`;
    }
    if (cantidad.cantidadIndividual === 0) {
      return `${cantidad.cantidadMayor} ${unidadMayor}`;
    }
    return `${cantidad.cantidadMayor} ${unidadMayor} y ${cantidad.cantidadIndividual} unidades`;
  };

  const handleOpenModal = (item: HistoricoItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(filteredHistorico.length / ITEMS_PER_PAGE);
  const paginatedHistorico = filteredHistorico.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Histórico Detallado de Almacén</h1>
      
      <div className="mb-4">
        <DateRangePicker 
          label="Rango de fechas" 
          className="max-w-xs" 
          onChange={(range) => setDateRange({ start: range.start, end: range.end })}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner label="Cargando..." />
        </div>
      ) : (
        <>
          <Table aria-label="Tabla de Histórico Detallado de Almacén">
            <TableHeader>
              <TableColumn>REGISTRO</TableColumn>
              <TableColumn>PRODUCTO</TableColumn>
              <TableColumn>INGRESOS (COMPRA)</TableColumn>
              <TableColumn>CANTIDAD RESTANTE</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedHistorico.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.fechaCompra).toLocaleString()}</TableCell>
                  <TableCell>{item.producto}</TableCell>
                  <TableCell>{formatCantidad(item.ingresos)} (Total: {item.ingresos.total})</TableCell>
                  <TableCell>{formatCantidad(item.cantidadRestante)} (Total: {item.cantidadRestante.total})</TableCell>
                  <TableCell>
                    <Button onPress={() => handleOpenModal(item)}>Ver Egresos</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
            />
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>{selectedItem?.producto} - Egresos</ModalHeader>
          <ModalBody>
            {selectedItem?.egresos.map((egreso, index) => (
              <div key={egreso.id}>
                {formatCantidad(egreso)} (Total: {egreso.total})
                <br />
                Fecha: {new Date(egreso.fecha).toLocaleString()}
                {index < selectedItem.egresos.length - 1 && <hr />}
              </div>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button onPress={handleCloseModal}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react';
import React from 'react';
import RegistroProveedor from './RegistroProveedor';
import { Proveedor } from '@prisma/client';

interface RegisterProveedorProps {
    onNewProveedor: (newProveedor: Proveedor) => void;
}

export default function ModalRegistroP({ onNewProveedor }: RegisterProveedorProps) {
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

    const handleNewProveedor = (newProveedor: Proveedor) => {
        onNewProveedor(newProveedor);
        onClose();
    };

    return (
        <>
            <Button color='primary' onPress={onOpen}>Agregar Proveedor</Button>
            <Modal
                size='xl'
                isOpen={isOpen}
                onClose={onClose}
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Agregar Nuevo Proveedor</ModalHeader>
                            <ModalBody>
                                <RegistroProveedor onNewProveedor={handleNewProveedor} />
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
        </>
    );
}

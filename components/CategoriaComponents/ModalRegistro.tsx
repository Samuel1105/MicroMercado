import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react'
import React from 'react'
import { Categoria } from '@prisma/client';
import RegisterCategoria from './RegisterCategoria';

interface ModalRegistroProps {
    onNewCategoria: (newCategoria: Categoria) => void;
}

export default function ModalRegistro({ onNewCategoria }: ModalRegistroProps) {
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

    const handleNewCategoria = (newCategoria: Categoria) => {
        onNewCategoria(newCategoria);
        onClose();
    };

    return (
        <>
            <Button color='primary' onPress={onOpen}>Agregar Categoria</Button>
            <Modal 
                size='xl' 
                isOpen={isOpen} 
                onClose={onClose} 
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Agregar Nueva Categoría</ModalHeader>
                            <ModalBody>
                                <RegisterCategoria onNewCategoria={handleNewCategoria} />
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

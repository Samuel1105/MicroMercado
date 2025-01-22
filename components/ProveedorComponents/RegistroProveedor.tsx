import { Button, Input } from '@nextui-org/react';
import { Proveedor } from '@prisma/client';
import axios from 'axios';
import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface RegisterProveedorProps {
    onNewProveedor: (newProveedor: Proveedor) => void;
}

export default function RegistroProveedor({ onNewProveedor }: RegisterProveedorProps) {
    const [nombre, setNombre] = useState('');
    const [celular, setCelular] = useState('');

    const clickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from propagating

        try {
            const response = await axios.post('/Api/proveedores/', 
              { 
                nombre: nombre,
                celular: Number(celular)
              });
            if (response.data && response.data.data) {
                onNewProveedor(response.data.data);
                
                // Show success alert
                Swal.fire({
                    title: 'Proveedor registrado!',
                    text: `El proveedor "${nombre}" fue registrado exitosamente.`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                });

                // Reset the input fields after submission
                setNombre('');
                setCelular('');
            }
        } catch (error) {
            console.error("Error al crear el proveedor:", error);
            
            // Show error alert
            Swal.fire({
                title: 'Error',
                text: 'No se pudo registrar el proveedor. Inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    };

    return (
        <>
            <div>
                <form onSubmit={clickSubmit}>
                    <div className='mb-4'>
                        <Input
                            type='text'
                            id='nombre'
                            name='nombre'
                            variant='bordered'
                            label='Proveedor'
                            placeholder='Ingrese nombre del proveedor'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className='mb-4'>
                        <Input
                            type='number'
                            id='celular'
                            name='celular'
                            variant='bordered'
                            label='Celular'
                            placeholder='Ingrese numero del proveedor'
                            value={celular}
                            onChange={(e) => setCelular(e.target.value)}
                        />
                    </div>
                    <Button type='submit' color='primary'>
                        Registrar Proveedor
                    </Button>
                </form>
            </div>
        </>
    );
}

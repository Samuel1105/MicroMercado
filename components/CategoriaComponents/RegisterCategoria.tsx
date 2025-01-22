import { Button, Input } from '@nextui-org/react';
import React, { useState } from 'react';
import axios from 'axios';
import { Categoria } from '@prisma/client';
import Swal from 'sweetalert2';

interface RegisterCategoriaProps {
    onNewCategoria: (newCategoria: Categoria) => void;
}

export default function RegisterCategoria({ onNewCategoria }: RegisterCategoriaProps) {
    const [nombre, setNombre] = useState('');

    const clickSubmitCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from propagating to parent

        try {
            const response = await axios.post('/Api/categorias/', { 
                nombre: nombre 
            });
            if (response.data && response.data.data) {
                onNewCategoria(response.data.data);
                
                // Show success alert
                Swal.fire({
                    title: 'Categoría creada!',
                    text: `La categoría "${nombre}" fue creada exitosamente.`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                });

                // Reset the input field after submission
                setNombre('');
            }
        } catch (error) {
            console.error("Error al crear la categoría:", error);

            // Show error alert
            Swal.fire({
                title: 'Error',
                text: 'No se pudo crear la categoría. Inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    };

    return (
        <>
            <div>
                <form onSubmit={clickSubmitCategoria}>
                    <div className='mb-4'>
                        <Input
                            type='text'
                            id='nombre'
                            name='nombre'
                            label='Nombre de la categoria'
                            variant='bordered'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <Button color='primary' type='submit' className='mb-4'>
                        Crear
                    </Button>
                </form>
            </div>
        </>
    );
}

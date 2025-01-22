//Usuarios/Mostrar/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Spinner, Button } from "@nextui-org/react"
import { Usuario } from '@/type/types'
import { Edit, Trash } from 'lucide-react'  // Importamos los íconos desde Lucide
import { useRouter } from 'next/navigation'
import routes from '@/hooks/routes'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useAuth } from '@/app/context/AuthContext'


export default function Page() {

  const {user} = useAuth();

  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const rowsPerPage = 10
  const router = useRouter()


  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/Api/usuarios')
      if (!response.ok) {
        throw new Error('Error al obtener usuarios')
      }
      const data = await response.json()
      setUsers(data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const pages = Math.ceil(users.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage

    return users.slice(start, end)
  }, [page, users])

  // Funciones para editar y eliminar
  const handleEdit = (id: number) => {
    console.log('Edit user with ID:', id)
    router.push(routes.usuarios.editar + `${id}`)
    // Lógica de edición
  }

  const handleDelete = async (id: number, nombre: string) => {
    // Mostrar SweetAlert2 de confirmación
    const result = await Swal.fire({
      title: '¿Estás seguro de eliminar a ? '+ nombre ,
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    // Si el usuario confirma, proceder con la eliminación
    if (result.isConfirmed) {
      console.log('Delete user with ID:', id);
      try {
        const response = await axios.delete(`/Api/usuarios/${id}`, {
          data: { userid: user?.id }
        });
        if (response.status === 200) {
          fetchUsers();
          Swal.fire('Eliminado', 'El usuario ha sido eliminado exitosamente', 'success');
        } else {
          Swal.fire('Error', 'Hubo un problema al eliminar el usuario', 'error');
        }
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        Swal.fire('Error', 'Error en el servidor', 'error');
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire('Cancelado', 'La eliminación fue cancelada', 'info');
    }
  };

  const handleCreateUser = () => {
    router.push(routes.usuarios.crear)  // Redirige a la página de creación de usuarios
  }



  return (
    <div className="p-8">
      <div className="flex justify-end mb-4">
        <Button color="primary" onClick={handleCreateUser}>
          Crear Usuario
        </Button>
      </div>
      <Table
        aria-label="Tabla de usuarios"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
      >
        <TableHeader>
          {/* Quitamos la columna de ID */}
          <TableColumn>Nombre</TableColumn>
          <TableColumn>Apellidos</TableColumn>
          <TableColumn>Correo</TableColumn>
          <TableColumn>Celular</TableColumn>
          <TableColumn>Rol</TableColumn>
          {/* Añadimos columnas de Editar y Eliminar */}
          <TableColumn>Acciones</TableColumn>
        </TableHeader>
        <TableBody
          items={items}
          loadingContent={<Spinner />}
          loadingState={loading ? "loading" : "idle"}
        >
          {(item) => (
            <TableRow key={item.id}>
              {/* Quitamos la celda del ID */}
              <TableCell>{`${item.primerNombre} ${item.segundoNombre || ''}`}</TableCell>
              <TableCell>{`${item.apellidoPaterno} ${item.apellidoMaterno || ''}`}</TableCell>
              <TableCell>{item.correo}</TableCell>
              <TableCell>{item.celular}</TableCell>
              <TableCell>{item.rol}</TableCell>
              <TableCell>
                <div className="flex gap-4">
                  {/* Botón de editar */}
                  <button onClick={() => handleEdit(item.id)}>
                    <Edit className="text-blue-500" />
                  </button>
                  {/* Botón de eliminar */}
                  <button onClick={() => handleDelete(item.id , item.primerNombre)}>
                    <Trash className="text-red-500" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

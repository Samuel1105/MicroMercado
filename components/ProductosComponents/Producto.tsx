// ProductCard.tsx
import React from 'react';
import { Card, CardBody, CardFooter, Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { ProductCardProps } from "@/type/types";
import routes from "@/hooks/routes";
import { Edit } from "lucide-react";

const ProductCard: React.FC<ProductCardProps> = ({ id, nombre, descripcion, cantidad, proveedor, categoria }) => {
  const router = useRouter();
  
  const clickEditar = (id: Number) => {
    router.push(routes.products.edit + `${id}`);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardBody className="flex-grow p-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-bold text-xl">{nombre}</h2>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => clickEditar(id)}
            className="text-default-400 hover:text-default-900"
          >
            <Edit size={18} />
          </Button>
        </div>
        <p className="text-default-500 text-sm mb-2">Cantidad: {cantidad}</p>
        <p className="text-default-700 text-sm mb-3 line-clamp-2">{descripcion}</p>
        <div className="flex justify-between text-default-400 text-xs">
          <span>Categoria: {categoria}</span>
          <span>Proveedor: {proveedor}</span>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProductCard;
export interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
}

export const PRODUCTOS: Product[] = [
  { id: "A", nombre: "Producto A", precio: 100, descripcion: "Servicio básico" },
  { id: "B", nombre: "Producto B", precio: 200, descripcion: "Servicio estándar" },
  { id: "C", nombre: "Producto C", precio: 350, descripcion: "Servicio avanzado" },
  { id: "D", nombre: "Instalación", precio: 150, descripcion: "Servicio de instalación" },
  { id: "E", nombre: "Mantenimiento", precio: 80, descripcion: "Servicio de mantenimiento mensual" },
  { id: "F", nombre: "Consultoría", precio: 500, descripcion: "Asesoramiento técnico (hora)" },
  { id: "G", nombre: "Soporte Premium", precio: 250, descripcion: "Soporte técnico prioritario" },
];

export function buscarProducto(texto: string): Product | null {
  if (!texto) return null;
  const t = texto.toLowerCase().trim();
  return (
    PRODUCTOS.find(
      (p) =>
        p.nombre.toLowerCase() === t ||
        p.nombre.toLowerCase().includes(t) ||
        p.id.toLowerCase() === t
    ) || null
  );
}

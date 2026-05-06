import { useState, useCallback } from "react";
import { PRODUCTOS, Product } from "./products";

const STORAGE_KEY = "presupuestos_catalogo";

function newId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadCatalogo(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PRODUCTOS;
    const parsed: Product[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return PRODUCTOS;
    return parsed;
  } catch {
    return PRODUCTOS;
  }
}

function saveCatalogo(productos: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  } catch {
    // ignore
  }
}

export function useCatalogo() {
  const [productos, setProductos] = useState<Product[]>(loadCatalogo);

  const addProducto = useCallback((nombre: string, precio: number): Product => {
    const nuevo: Product = { id: newId(), nombre: nombre.trim(), precio };
    setProductos((prev) => {
      const next = [...prev, nuevo];
      saveCatalogo(next);
      return next;
    });
    return nuevo;
  }, []);

  const updateProducto = useCallback((id: string, changes: Partial<Pick<Product, "nombre" | "precio">>): Product | null => {
    let updated: Product | null = null;
    setProductos((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, ...changes };
        return updated;
      });
      saveCatalogo(next);
      return next;
    });
    return updated;
  }, []);

  const deleteProducto = useCallback((id: string) => {
    setProductos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCatalogo(next);
      return next;
    });
  }, []);

  const resetCatalogo = useCallback(() => {
    setProductos(PRODUCTOS);
    saveCatalogo(PRODUCTOS);
  }, []);

  return { productos, addProducto, updateProducto, deleteProducto, resetCatalogo };
}

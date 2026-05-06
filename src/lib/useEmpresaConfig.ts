import { useState, useCallback } from "react";

export interface EmpresaConfig {
  nombre: string;
  cif: string;
  domicilio: string;
  localidad: string;
  telefono: string;
}

const STORAGE_KEY = "presupuestos_empresa_config";

const EMPTY: EmpresaConfig = {
  nombre: "",
  cif: "",
  domicilio: "",
  localidad: "",
  telefono: "",
};

function load(): EmpresaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function save(config: EmpresaConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function useEmpresaConfig() {
  const [empresa, setEmpresaState] = useState<EmpresaConfig>(load);

  const setEmpresa = useCallback((config: EmpresaConfig) => {
    setEmpresaState(config);
    save(config);
  }, []);

  const clearEmpresa = useCallback(() => {
    setEmpresaState(EMPTY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const hasData = Object.values(empresa).some((v) => v.trim() !== "");

  return { empresa, setEmpresa, clearEmpresa, hasData };
}

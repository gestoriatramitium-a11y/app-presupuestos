import jsPDF from "jspdf";
import { EmpresaConfig } from "./useEmpresaConfig";

export interface LineaPDF {
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PresupuestoData {
  tipoDocumento: "presupuesto" | "factura";
  numeroPresupuesto: string;
  numeroFactura: string;
  fecha: string;
  nombreCliente: string;
  domicilio: string;
  nif: string;
  residencia: string;
  lineas: LineaPDF[];
  logoDataUrl?: string;
  empresa?: EmpresaConfig;
  formaPago?: string;
  fechaVencimiento?: string;
  estadoPago?: string;
}

export function generarPDF(data: PresupuestoData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;

  const azul = [30, 80, 180] as [number, number, number];
  const grisOscuro = [40, 40, 40] as [number, number, number];
  const grisClaro = [245, 247, 250] as [number, number, number];
  const blanco = [255, 255, 255] as [number, number, number];

  const esFactura = data.tipoDocumento === "factura";
  const tituloPDF = esFactura ? "FACTURA" : "PRESUPUESTO";
  const numeroDoc = esFactura ? data.numeroFactura : data.numeroPresupuesto;
  const etiquetaNumero = esFactura ? "N.º Factura" : "N.º";

  const emp = data.empresa;
  const hasEmpresa = emp && Object.values(emp).some((v) => v.trim() !== "");
  const headerH = hasEmpresa ? 68 : 45;

  // Blue header
  doc.setFillColor(...azul);
  doc.rect(0, 0, pageW, headerH, "F");

  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", margin, 8, 30, 28, undefined, "FAST");
    } catch {
      // ignore
    }
  }

  const textX = data.logoDataUrl ? margin + 38 : margin;

  doc.setTextColor(...blanco);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(tituloPDF, textX, 22);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${etiquetaNumero}: ${numeroDoc}`, textX, 32);

  doc.setFontSize(10);
  doc.text(`Fecha: ${data.fecha}`, pageW - margin, 22, { align: "right" });

  if (hasEmpresa && emp) {
    doc.setDrawColor(...blanco);
    doc.setLineWidth(0.2);
    doc.setGState(doc.GState({ opacity: 0.3 }));
    doc.line(margin, 42, pageW - margin, 42);
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setTextColor(...blanco);
    if (emp.nombre) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(emp.nombre, margin, 50);
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let lineY = emp.nombre ? 57 : 50;
    if (emp.domicilio) { doc.text(emp.domicilio, margin, lineY); lineY += 6; }
    if (emp.localidad) { doc.text(emp.localidad, margin, lineY); }

    let rightY = emp.nombre ? 57 : 50;
    if (emp.cif) {
      doc.setFont("helvetica", "normal");
      doc.text(`CIF/NIF: ${emp.cif}`, pageW - margin, rightY, { align: "right" });
      rightY += 6;
    }
    if (emp.telefono) {
      doc.setFont("helvetica", "bold");
      doc.text(`Tel: ${emp.telefono}`, pageW - margin, rightY, { align: "right" });
    }
  }

  let y = headerH + 12;

  // Client data box
  const clientBoxLabel = esFactura ? "DATOS FISCALES DEL CLIENTE" : "DATOS DEL CLIENTE";
  doc.setFillColor(...grisClaro);
  doc.roundedRect(margin, y, contentW, 50, 3, 3, "F");

  doc.setTextColor(...azul);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(clientBoxLabel, margin + 6, y + 10);

  doc.setTextColor(...grisOscuro);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const clientFields = [
    { label: "Nombre:", value: data.nombreCliente },
    { label: "NIF / CIF:", value: data.nif },
    { label: "Domicilio:", value: data.domicilio },
    { label: "Localidad:", value: data.residencia },
  ];

  const col1y = y + 18;
  clientFields.forEach((f, i) => {
    const cx = i % 2 === 0 ? margin + 6 : margin + contentW / 2 + 4;
    const cy = col1y + Math.floor(i / 2) * 12;
    doc.setFont("helvetica", "bold");
    doc.text(f.label, cx, cy);
    doc.setFont("helvetica", "normal");
    doc.text(f.value || "—", cx + 22, cy);
  });

  y += 60;

  // Products table header
  doc.setFillColor(...azul);
  doc.setTextColor(...blanco);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.rect(margin, y, contentW, 10, "F");
  doc.text("DESCRIPCIÓN", margin + 4, y + 7);
  doc.text("CANT.", margin + contentW - 80, y + 7, { align: "right" });
  doc.text("PRECIO UNIT.", margin + contentW - 45, y + 7, { align: "right" });
  doc.text("IMPORTE", margin + contentW - 2, y + 7, { align: "right" });

  y += 10;

  // Product rows
  const rowH = 12;
  let totalGeneral = 0;
  doc.setTextColor(...grisOscuro);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  data.lineas.forEach((linea, idx) => {
    if (y + rowH + 50 > pageH - 20) {
      doc.addPage();
      y = 25;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(247, 249, 253);
    }
    doc.setDrawColor(220, 226, 240);
    doc.rect(margin, y, contentW, rowH, "FD");

    const importe = linea.precioUnitario * linea.cantidad;
    totalGeneral += importe;

    doc.setTextColor(...grisOscuro);
    doc.setFont("helvetica", "normal");
    doc.text(linea.producto || "—", margin + 4, y + 8);
    doc.text(String(linea.cantidad), margin + contentW - 80, y + 8, { align: "right" });
    doc.text(`${linea.precioUnitario.toFixed(2)} €`, margin + contentW - 45, y + 8, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`${importe.toFixed(2)} €`, margin + contentW - 2, y + 8, { align: "right" });

    y += rowH;
  });

  y += 8;

  // Totals box
  const boxH = 38;
  if (y + boxH + 12 > pageH - 20) {
    doc.addPage();
    y = 25;
  }
  const baseImponible = totalGeneral;
  const iva = baseImponible * 0.21;
  const totalConIva = baseImponible + iva;

  const boxX = margin + contentW - 80;
  const boxW = 80;
  doc.setFillColor(...grisClaro);
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...grisOscuro);
  doc.text("Base imponible:", boxX + 4, y + 8);
  doc.text(`${baseImponible.toFixed(2)} €`, boxX + boxW - 2, y + 8, { align: "right" });

  doc.text("IVA 21 %:", boxX + 4, y + 16);
  doc.text(`${iva.toFixed(2)} €`, boxX + boxW - 2, y + 16, { align: "right" });

  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(boxX + 4, y + 20, boxX + boxW - 4, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...azul);
  doc.text("TOTAL:", boxX + 4, y + 31);
  doc.text(`${totalConIva.toFixed(2)} €`, boxX + boxW - 2, y + 31, { align: "right" });

  y += boxH + 8;

  // Payment info box (factura only)
  if (esFactura) {
    const payFields = [
      { label: "Forma de pago:", value: data.formaPago },
      { label: "Vencimiento:", value: data.fechaVencimiento },
      { label: "Estado:", value: data.estadoPago },
    ].filter((f) => f.value);

    if (payFields.length > 0) {
      const payBoxH = 10 + payFields.length * 10;
      if (y + payBoxH + 10 > pageH - 20) {
        doc.addPage();
        y = 25;
      }
      doc.setFillColor(...grisClaro);
      doc.roundedRect(margin, y, contentW / 2, payBoxH, 2, 2, "F");

      doc.setTextColor(...azul);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("INFORMACIÓN DE PAGO", margin + 4, y + 7);

      doc.setTextColor(...grisOscuro);
      doc.setFontSize(9);
      payFields.forEach((f, i) => {
        const fy = y + 14 + i * 10;
        doc.setFont("helvetica", "bold");
        doc.text(f.label, margin + 4, fy);
        doc.setFont("helvetica", "normal");
        doc.text(f.value || "", margin + 32, fy);
      });

      y += payBoxH + 8;
    }
  }

  // Footer text
  if (y + 20 < pageH - 20) {
    doc.setDrawColor(220, 226, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 140, 160);

    if (!esFactura) {
      doc.text(
        "Este presupuesto tiene una validez de 30 días desde la fecha de emisión.",
        pageW / 2, y, { align: "center" }
      );
      y += 6;
    }
    doc.text(
      "Para cualquier consulta, contacte con nosotros.",
      pageW / 2, y, { align: "center" }
    );
  }

  // Page footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...azul);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...blanco);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
  }

  const filePrefix = esFactura ? "factura" : "presupuesto";
  const fileName = `${filePrefix}-${numeroDoc}.pdf`;

  try {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
  } catch {
    doc.save(fileName);
  }
}

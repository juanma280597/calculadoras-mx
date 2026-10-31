"use strict";

const UMA = 117.31;
const UMA_MENSUAL = 3566.22;
const UMA_MENSUAL_2025 = 3439.46;
const SUBSIDIO_LIMITE = 11492.66;
const SALARIO_MINIMO = { general: 315.04, frontera: 440.87 };
const ISR_MENSUAL_2026 = [
  [0.01, 844.59, 0.00, 1.92],
  [844.60, 7168.51, 16.22, 6.40],
  [7168.52, 12598.02, 420.95, 10.88],
  [12598.03, 14644.64, 1011.68, 16.00],
  [14644.65, 17533.64, 1339.14, 17.92],
  [17533.65, 35362.83, 1856.84, 21.36],
  [35362.84, 55736.68, 5665.16, 23.52],
  [55736.69, 106410.50, 10457.09, 30.00],
  [106410.51, 141880.66, 25659.23, 32.00],
  [141880.67, 425641.99, 37009.69, 34.00],
  [425642.00, Infinity, 133488.54, 35.00]
];

const $ = (id) => typeof document === "undefined" ? null : document.getElementById(id);
const mx = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const money = (value) => mx.format(Number.isFinite(value) ? value : 0);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const ceil2 = (value) => Math.ceil((value - Number.EPSILON) * 100) / 100;

function num(id, fallback = 0) {
  const el = $(id);
  if (!el) return fallback;
  const value = Number.parseFloat(el.value);
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function isrMensual(ingreso) {
  if (!Number.isFinite(ingreso) || ingreso <= 0) return 0;
  const tramo = ISR_MENSUAL_2026.find((r) => ingreso >= r[0] && ingreso <= r[1]) || ISR_MENSUAL_2026[ISR_MENSUAL_2026.length - 1];
  return round2(tramo[2] + (ingreso - tramo[0]) * (tramo[3] / 100));
}

function subsidioDisponible(ingreso, periodo) {
  if (!Number.isFinite(ingreso) || ingreso <= 0 || ingreso > SUBSIDIO_LIMITE) return 0;
  const importe = periodo === "enero"
    ? UMA_MENSUAL_2025 * 0.1559
    : UMA_MENSUAL * 0.1502;
  return round2(importe);
}

function diasVacaciones(anioServicio) {
  const y = Math.max(1, Math.floor(anioServicio));
  if (y === 1) return 12;
  if (y <= 5) return 12 + (y - 1) * 2;
  if (y <= 10) return 22;
  if (y <= 15) return 24;
  if (y <= 20) return 26;
  if (y <= 25) return 28;
  if (y <= 30) return 30;
  return 32 + Math.floor((y - 31) / 5) * 2;
}

function factorIntegracion(aniosCumplidos, diasAguinaldo = 15, primaVacacional = 25) {
  const anioServicio = Math.max(1, Math.floor(aniosCumplidos) + 1);
  const vacaciones = diasVacaciones(anioServicio);
  return 1 + (diasAguinaldo / 365) + (vacaciones * (primaVacacional / 100) / 365);
}

function imssObrero(sueldoMensual, aniosCumplidos) {
  if (!Number.isFinite(sueldoMensual) || sueldoMensual <= 0) {
    return { cuota: 0, sdi: 0, factor: factorIntegracion(aniosCumplidos) };
  }
  const salarioDiario = sueldoMensual / 30;
  const factor = factorIntegracion(aniosCumplidos);
  const sdi = Math.min(salarioDiario * factor, 25 * UMA);
  const baseMensual = sdi * 30.4;
  let cuota = baseMensual * 0.02375;
  if (sdi > 3 * UMA) cuota += (sdi - 3 * UMA) * 30.4 * 0.004;
  return { cuota: round2(cuota), sdi, factor };
}

function netoDesdeBruto(bruto, periodo, aniosCumplidos) {
  const base = Math.max(0, Number(bruto) || 0);
  const isrCausado = isrMensual(base);
  const subsidio = subsidioDisponible(base, periodo);
  const subsidioAplicado = round2(Math.min(isrCausado, subsidio));
  const isrRetenido = round2(Math.max(0, isrCausado - subsidioAplicado));
  const imss = imssObrero(base, aniosCumplidos);
  return {
    bruto: round2(base),
    isrCausado,
    subsidio,
    subsidioAplicado,
    isrRetenido,
    imss: imss.cuota,
    sdi: imss.sdi,
    factor: imss.factor,
    neto: round2(Math.max(0, base - isrRetenido - imss.cuota))
  };
}

function buscarBrutoEnTramo(objetivo, lo, hi, periodo, aniosCumplidos) {
  const netLo = netoDesdeBruto(lo, periodo, aniosCumplidos).neto;
  const netHi = netoDesdeBruto(hi, periodo, aniosCumplidos).neto;
  if (netLo >= objetivo) return ceil2(lo);
  if (netHi < objetivo) return null;
  let a = lo;
  let b = hi;
  for (let i = 0; i < 90; i++) {
    const mid = (a + b) / 2;
    if (netoDesdeBruto(mid, periodo, aniosCumplidos).neto < objetivo) a = mid;
    else b = mid;
  }
  let bruto = ceil2(b);
  for (let i = 0; i < 5 && netoDesdeBruto(bruto, periodo, aniosCumplidos).neto < objetivo; i++) bruto = round2(bruto + 0.01);
  return bruto;
}

function brutoParaNeto(objetivo, periodo, aniosCumplidos) {
  const netoObjetivo = Math.max(0, Number(objetivo) || 0);
  if (netoObjetivo === 0) return 0;

  const candidatos = [];
  const antesDelCorte = buscarBrutoEnTramo(netoObjetivo, 0, SUBSIDIO_LIMITE, periodo, aniosCumplidos);
  if (antesDelCorte !== null) candidatos.push(antesDelCorte);

  const inicioSinSubsidio = round2(SUBSIDIO_LIMITE + 0.01);
  let hi = Math.max(inicioSinSubsidio + 1000, netoObjetivo * 1.7 + 5000);
  while (netoDesdeBruto(hi, periodo, aniosCumplidos).neto < netoObjetivo && hi < 100000000) hi *= 1.5;
  const despuesDelCorte = buscarBrutoEnTramo(netoObjetivo, inicioSinSubsidio, hi, periodo, aniosCumplidos);
  if (despuesDelCorte !== null) candidatos.push(despuesDelCorte);

  if (!candidatos.length) return ceil2(hi);
  return Math.min(...candidatos);
}

function rows(items) {
  return `<table class="breakdown">${items.map((r) =>
    `<tr${r[2] ? ' class="total"' : ""}><td>${r[0]}</td><td>${r[1]}</td></tr>`
  ).join("")}</table>`;
}

function sueldo() {
  const modo = $("s_modo").value;
  const periodo = $("s_periodo").value;
  const anios = num("s_ant");
  const valor = num("s_monto");
  const label = $("s_monto_label");
  if (label) label.textContent = modo === "bn" ? "Sueldo mensual bruto (MXN)" : "Sueldo neto mensual deseado (MXN)";

  const bruto = modo === "nb" ? brutoParaNeto(valor, periodo, anios) : valor;
  const r = netoDesdeBruto(bruto, periodo, anios);
  const title = modo === "bn" ? "Sueldo neto mensual estimado" : "Sueldo bruto mensual mínimo estimado";
  const big = modo === "bn" ? r.neto : r.bruto;

  $("s_res").innerHTML =
    `<div class="result-kicker">${title}</div><div class="big">${money(big)}</div>` +
    rows([
      ["Sueldo bruto", money(r.bruto)],
      ["ISR causado", `−${money(r.isrCausado)}`],
      ["Subsidio aplicado", `+${money(r.subsidioAplicado)}`],
      ["ISR retenido", `−${money(r.isrRetenido)}`],
      ["IMSS obrero estimado", `−${money(r.imss)}`],
      ["Sueldo neto", money(r.neto), true]
    ]) +
    `<p class="result-note">SDI estimado: ${money(r.sdi)} diarios · factor de integración ${r.factor.toFixed(4)}. El subsidio solo reduce el ISR hasta cero y puede generar un salto alrededor del límite mensual de ${money(SUBSIDIO_LIMITE)}.</p>`;
}

function parseDate(id) {
  const value = $(id)?.value;
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysInclusive(a, b) {
  return Math.floor((b - a) / 86400000) + 1;
}

function daysBetween(a, b) {
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function addYears(date, years) {
  const d = new Date(date.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

function fullYearsBetween(start, end) {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  if (addYears(start, years) > end) years--;
  return Math.max(0, years);
}

function daysInYear(year) {
  return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
}

function finiquito() {
  const sueldoMensual = num("f_sal");
  const diario = sueldoMensual / 30;
  const ingreso = parseDate("f_ing");
  const salida = parseDate("f_sali");
  const result = $("f_res");

  if (!ingreso || !salida || salida < ingreso) {
    result.innerHTML = `<div class="result-error">Elige fechas válidas de ingreso y salida.</div>`;
    return;
  }
  if (salida.getUTCFullYear() !== 2026) {
    result.innerHTML = `<div class="result-error">Esta versión usa parámetros oficiales de 2026; selecciona una fecha de salida de 2026.</div>`;
    return;
  }

  const tipo = $("f_tipo").value;
  const area = $("f_area").value;
  const incluir20 = Boolean($("f_20")?.checked);
  const agDias = clamp(num("f_ag", 15), 15, 365);
  const primaPct = clamp(num("f_pv", 25), 25, 100);
  const pendientes = diario * num("f_pen");
  const totalDias = daysInclusive(ingreso, salida);
  const aniosFraccion = totalDias / 365.2425;
  const aniosCumplidos = fullYearsBetween(ingreso, salida);

  const inicioAnio = new Date(Date.UTC(2026, 0, 1));
  const inicioAguinaldo = ingreso > inicioAnio ? ingreso : inicioAnio;
  const diasAguinaldoTrabajados = Math.max(0, daysInclusive(inicioAguinaldo, salida));
  const aguinaldo = diario * agDias * diasAguinaldoTrabajados / daysInYear(2026);

  const aniversario = addYears(ingreso, aniosCumplidos);
  const siguienteAniversario = addYears(aniversario, 1);
  const diasPeriodoServicio = aniosCumplidos === 0 ? daysInclusive(ingreso, salida) : daysBetween(aniversario, salida);
  const duracionPeriodo = Math.max(1, daysBetween(aniversario, siguienteAniversario));
  const vacAnuales = diasVacaciones(aniosCumplidos + 1);
  const vacDevengadas = vacAnuales * diasPeriodoServicio / duracionPeriodo;
  const vacActualesPendientes = Math.max(0, vacDevengadas - num("f_vd"));
  const vacAnterioresPendientes = num("f_vp");
  const vacPendientesDias = vacActualesPendientes + vacAnterioresPendientes;
  const vacaciones = vacPendientesDias * diario;
  const primaVacacional = vacaciones * (primaPct / 100);

  let total = pendientes + aguinaldo + vacaciones + primaVacacional;
  const detalle = [
    ["Sueldo pendiente", money(pendientes)],
    ["Aguinaldo proporcional", money(aguinaldo)],
    [`Vacaciones pendientes (${vacPendientesDias.toFixed(1)} días)`, money(vacaciones)],
    [`Prima vacacional (${primaPct.toFixed(0)}%)`, money(primaVacacional)]
  ];

  const factor = 1 + agDias / 365 + (vacAnuales * (primaPct / 100) / 365);
  const salarioIntegrado = diario * factor;
  const salarioMinimo = SALARIO_MINIMO[area] || SALARIO_MINIMO.general;
  const basePrimaAntiguedad = Math.min(diario, 2 * salarioMinimo);
  const primaAntiguedad = basePrimaAntiguedad * 12 * aniosFraccion;

  if (tipo === "d") {
    const tresMeses = salarioIntegrado * 90;
    total += tresMeses;
    detalle.push(["3 meses (salario integrado estimado)", money(tresMeses)]);

    if (incluir20) {
      const veinte = salarioIntegrado * 20 * aniosFraccion;
      total += veinte;
      detalle.push(["20 días por año (si aplican)", money(veinte)]);
    }

    total += primaAntiguedad;
    detalle.push(["Prima de antigüedad", money(primaAntiguedad)]);
  } else if (aniosCumplidos >= 15) {
    total += primaAntiguedad;
    detalle.push(["Prima de antigüedad", money(primaAntiguedad)]);
  }

  total = round2(total);
  detalle.push([tipo === "d" ? "Total finiquito + indemnización" : "Total finiquito", money(total), true]);

  result.innerHTML =
    `<div class="result-kicker">Total estimado bruto</div><div class="big">${money(total)}</div>` +
    rows(detalle) +
    `<p class="result-note">Antigüedad aproximada: ${aniosFraccion.toFixed(2)} años · salario diario integrado estimado: ${money(salarioIntegrado)}. Se supone que las vacaciones de periodos anteriores ya fueron disfrutadas, salvo los días que captures expresamente.</p>`;
}

function aguinaldo() {
  const sueldoMensual = num("a_sal");
  const diario = sueldoMensual / 30;
  const dias = clamp(num("a_dias"), 0, 365);
  const trabajados = clamp(num("a_trab"), 0, 365);
  const bruto = round2(diario * dias * trabajados / 365);
  const exento = round2(Math.min(bruto, 30 * UMA));
  const gravado = round2(Math.max(0, bruto - exento));
  let isr = 0;

  if (gravado > 0 && sueldoMensual > 0) {
    const promedioMensual = gravado / 365 * 30.4;
    if (promedioMensual > 0) {
      const diferencia = Math.max(0, isrMensual(sueldoMensual + promedioMensual) - isrMensual(sueldoMensual));
      const tasa = diferencia / promedioMensual;
      isr = round2(Math.min(gravado, Math.max(0, tasa * gravado)));
    }
  }

  const neto = round2(Math.max(0, bruto - isr));
  $("a_res").innerHTML =
    `<div class="result-kicker">Aguinaldo neto estimado</div><div class="big">${money(neto)}</div>` +
    rows([
      ["Aguinaldo bruto", money(bruto)],
      ["Parte exenta (30 UMA)", money(exento)],
      ["Parte gravada", money(gravado)],
      ["ISR estimado", `−${money(isr)}`],
      ["Aguinaldo neto", money(neto), true]
    ]) +
    `<p class="result-note">La retención se estima con el procedimiento opcional del artículo 174 del Reglamento de la Ley del ISR; la nómina real puede variar.</p>`;
}

function run() {
  if ($("s_res")) sueldo();
  if ($("f_res")) finiquito();
  if ($("a_res")) aguinaldo();
}

async function copyResult(button) {
  const id = button.getAttribute("data-copy-result");
  const target = $(id);
  if (!target) return;
  const text = target.innerText.trim();
  const original = button.textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    button.textContent = "Copiado ✓";
  } catch (_) {
    button.textContent = "No se pudo copiar";
  }
  window.setTimeout(() => { button.textContent = original; }, 1600);
}

const CMX_CORE = {
  UMA,
  UMA_MENSUAL,
  UMA_MENSUAL_2025,
  SUBSIDIO_LIMITE,
  SALARIO_MINIMO,
  ISR_MENSUAL_2026,
  round2,
  isrMensual,
  subsidioDisponible,
  diasVacaciones,
  factorIntegracion,
  imssObrero,
  netoDesdeBruto,
  brutoParaNeto
};

if (typeof module !== "undefined" && module.exports) module.exports = CMX_CORE;
if (typeof globalThis !== "undefined") globalThis.CMX_CORE = CMX_CORE;

if (typeof document !== "undefined") {
  document.addEventListener("input", run);
  document.addEventListener("change", run);
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-copy-result]");
    if (button) copyResult(button);
  });

  (function init() {
    if ($("f_sali") && !$("f_sali").value) {
      const today = new Date();
      const useToday = today.getFullYear() === 2026;
      const year = 2026;
      const month = useToday ? today.getMonth() + 1 : 12;
      const day = useToday ? today.getDate() : 31;
      $("f_sali").value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    run();
  })();
}

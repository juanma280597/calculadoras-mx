"use strict";

const $x = (id) => typeof document === "undefined" ? null : document.getElementById(id);
const mxExtra = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const moneyExtra = (value) => mxExtra.format(Number.isFinite(value) ? value : 0);
const roundExtra = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const numExtra = (id, fallback = 0) => {
  const el = $x(id);
  if (!el) return fallback;
  const value = Number.parseFloat(el.value);
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
};

function diasVacacionesLFT(anioServicio) {
  const y = Math.max(1, Math.floor(Number(anioServicio) || 1));
  if (y === 1) return 12;
  if (y <= 5) return 12 + (y - 1) * 2;
  if (y <= 10) return 22;
  if (y <= 15) return 24;
  if (y <= 20) return 26;
  if (y <= 25) return 28;
  if (y <= 30) return 30;
  return 32 + Math.floor((y - 31) / 5) * 2;
}

function calcularVacaciones(sueldoMensual, anioServicio, primaPct = 25) {
  const salarioDiario = Math.max(0, Number(sueldoMensual) || 0) / 30;
  const dias = diasVacacionesLFT(anioServicio);
  const prima = Math.max(25, Number(primaPct) || 25) / 100;
  const salarioPeriodo = salarioDiario * dias;
  const primaVacacional = salarioPeriodo * prima;
  return {
    salarioDiario: roundExtra(salarioDiario),
    dias,
    salarioPeriodo: roundExtra(salarioPeriodo),
    primaVacacional: roundExtra(primaVacacional),
    valorTotal: roundExtra(salarioPeriodo + primaVacacional)
  };
}

function calcularHorasExtra(sueldoMensual, jornadaHoras, horasExtra, diasConExtra = 1) {
  const diario = Math.max(0, Number(sueldoMensual) || 0) / 30;
  const jornada = Math.max(0.1, Number(jornadaHoras) || 8);
  const horas = Math.max(0, Number(horasExtra) || 0);
  const dias = Math.max(1, Number(diasConExtra) || 1);
  const horaNormal = diario / jornada;
  const horasDobles = Math.min(horas, 9);
  const horasTriples = Math.max(0, horas - 9);
  const pagoDoble = horasDobles * horaNormal * 2;
  const pagoTriple = horasTriples * horaNormal * 3;
  return {
    salarioDiario: roundExtra(diario),
    horaNormal: roundExtra(horaNormal),
    horasDobles: roundExtra(horasDobles),
    horasTriples: roundExtra(horasTriples),
    pagoDoble: roundExtra(pagoDoble),
    pagoTriple: roundExtra(pagoTriple),
    total: roundExtra(pagoDoble + pagoTriple),
    excedeLimiteDiario: horas / dias > 3,
    excedeDiasSemana: dias > 3,
    excedeNueveSemana: horas > 9
  };
}

function calcularPTU({
  montoBase,
  modo = "ptu",
  totalDias,
  totalSalarios,
  diasTrabajador,
  salarioAnualTrabajador,
  salarioMensualTrabajador,
  promedioTresAnios = 0
}) {
  const base = Math.max(0, Number(montoBase) || 0);
  const ptuTotal = modo === "renta" ? base * 0.10 : base;
  const diasEmpresa = Math.max(0, Number(totalDias) || 0);
  const salariosEmpresa = Math.max(0, Number(totalSalarios) || 0);
  const dias = Math.max(0, Number(diasTrabajador) || 0);
  const salarioAnual = Math.max(0, Number(salarioAnualTrabajador) || 0);
  const salarioMensual = Math.max(0, Number(salarioMensualTrabajador) || 0);
  const promedio3 = Math.max(0, Number(promedioTresAnios) || 0);

  if (!diasEmpresa || !salariosEmpresa) {
    return { error: "Captura los días y salarios totales de las personas trabajadoras con derecho a PTU." };
  }

  const mitad = ptuTotal / 2;
  const porDias = mitad * (dias / diasEmpresa);
  const porSalario = mitad * (salarioAnual / salariosEmpresa);
  const ptuTeorica = porDias + porSalario;
  const topeTresMeses = salarioMensual * 3;
  const topeAplicable = Math.max(topeTresMeses, promedio3);
  const ptuFinal = Math.min(ptuTeorica, topeAplicable || ptuTeorica);

  return {
    ptuTotal: roundExtra(ptuTotal),
    porDias: roundExtra(porDias),
    porSalario: roundExtra(porSalario),
    ptuTeorica: roundExtra(ptuTeorica),
    topeTresMeses: roundExtra(topeTresMeses),
    promedioTresAnios: roundExtra(promedio3),
    topeAplicable: roundExtra(topeAplicable),
    ptuFinal: roundExtra(ptuFinal)
  };
}

function tableExtra(rows) {
  return `<table class="breakdown">${rows.map((r) => `<tr${r[2] ? ' class="total"' : ""}><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`;
}

function renderVacaciones() {
  if (!$x("v_res")) return;
  const r = calcularVacaciones(numExtra("v_sal"), numExtra("v_anio", 1), numExtra("v_prima", 25));
  $x("v_res").innerHTML = `<div class="result-kicker">Prima vacacional mínima estimada</div><div class="big">${moneyExtra(r.primaVacacional)}</div>` + tableExtra([
    ["Salario diario", moneyExtra(r.salarioDiario)],
    ["Días de vacaciones", `${r.dias} días`],
    ["Valor salarial del periodo", moneyExtra(r.salarioPeriodo)],
    ["Prima vacacional", moneyExtra(r.primaVacacional)],
    ["Valor económico total del periodo", moneyExtra(r.valorTotal), true]
  ]) + `<p class="result-note">Si eres asalariado y disfrutas tus vacaciones normalmente, tu salario ordinario continúa pagándose; la prima vacacional es el monto adicional. El valor total también sirve como referencia económica del periodo.</p>`;
}

function renderHorasExtra() {
  if (!$x("h_res")) return;
  const r = calcularHorasExtra(numExtra("h_sal"), numExtra("h_jornada", 8), numExtra("h_horas"), numExtra("h_dias", 1));
  const alertas = [];
  if (r.excedeNueveSemana) alertas.push("Las horas que exceden de 9 en la semana se estiman al triple.");
  if (r.excedeLimiteDiario || r.excedeDiasSemana) alertas.push("La distribución capturada supera el límite ordinario de 3 horas extraordinarias por día y hasta 3 veces por semana.");
  $x("h_res").innerHTML = `<div class="result-kicker">Pago adicional estimado</div><div class="big">${moneyExtra(r.total)}</div>` + tableExtra([
    ["Valor de hora normal", moneyExtra(r.horaNormal)],
    [`Horas dobles (${r.horasDobles})`, moneyExtra(r.pagoDoble)],
    [`Horas triples (${r.horasTriples})`, moneyExtra(r.pagoTriple)],
    ["Total por horas extra", moneyExtra(r.total), true]
  ]) + (alertas.length ? `<p class="result-note"><strong>Atención:</strong> ${alertas.join(" ")}</p>` : `<p class="result-note">Dentro del límite semanal ordinario: hasta 9 horas extraordinarias se estiman al doble.</p>`);
}

function renderPTU() {
  if (!$x("p_res")) return;
  const r = calcularPTU({
    montoBase: numExtra("p_monto"),
    modo: $x("p_modo").value,
    totalDias: numExtra("p_dias_total"),
    totalSalarios: numExtra("p_salarios_total"),
    diasTrabajador: numExtra("p_dias"),
    salarioAnualTrabajador: numExtra("p_salario_anual"),
    salarioMensualTrabajador: numExtra("p_salario_mensual"),
    promedioTresAnios: numExtra("p_promedio3")
  });
  if (r.error) {
    $x("p_res").innerHTML = `<div class="result-error">${r.error}</div>`;
    return;
  }
  $x("p_res").innerHTML = `<div class="result-kicker">PTU individual estimada</div><div class="big">${moneyExtra(r.ptuFinal)}</div>` + tableExtra([
    ["PTU total a repartir", moneyExtra(r.ptuTotal)],
    ["Participación por días", moneyExtra(r.porDias)],
    ["Participación por salarios", moneyExtra(r.porSalario)],
    ["PTU teórica antes de tope", moneyExtra(r.ptuTeorica)],
    ["Tope de 3 meses", moneyExtra(r.topeTresMeses)],
    ["Promedio PTU últimos 3 años", moneyExtra(r.promedioTresAnios)],
    ["Tope más favorable", moneyExtra(r.topeAplicable)],
    ["PTU estimada a recibir", moneyExtra(r.ptuFinal), true]
  ]) + `<p class="result-note">Esta herramienta no determina por sí sola si la persona o el patrón están obligados o tienen derecho a PTU. Usa los datos del proyecto de reparto o de la comisión de la empresa.</p>`;
}

function runExtras() {
  renderVacaciones();
  renderHorasExtra();
  renderPTU();
}

const CMX_EXTRA = { diasVacacionesLFT, calcularVacaciones, calcularHorasExtra, calcularPTU };
if (typeof module !== "undefined" && module.exports) module.exports = CMX_EXTRA;
if (typeof globalThis !== "undefined") globalThis.CMX_EXTRA = CMX_EXTRA;

if (typeof document !== "undefined") {
  document.addEventListener("input", runExtras);
  document.addEventListener("change", runExtras);
  runExtras();
}

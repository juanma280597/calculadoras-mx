const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../calc.js');

test('tarifa ISR mensual 2026 respeta puntos de corte principales', () => {
  assert.equal(c.isrMensual(844.59), 16.22);
  assert.equal(c.isrMensual(844.60), 16.22);
  assert.equal(c.isrMensual(7168.51), 420.95);
  assert.equal(c.isrMensual(12598.02), 1011.68);
  assert.equal(c.isrMensual(20000), 2383.65);
});

test('subsidio 2026 aplica solo hasta el límite mensual', () => {
  assert.equal(c.subsidioDisponible(10000, 'enero'), 536.21);
  assert.equal(c.subsidioDisponible(10000, 'feb-dic'), 535.65);
  assert.equal(c.subsidioDisponible(11492.66, 'feb-dic'), 535.65);
  assert.equal(c.subsidioDisponible(11492.67, 'feb-dic'), 0);
});

test('vacaciones mínimas siguen la LFT vigente', () => {
  assert.equal(c.diasVacaciones(1), 12);
  assert.equal(c.diasVacaciones(2), 14);
  assert.equal(c.diasVacaciones(5), 20);
  assert.equal(c.diasVacaciones(6), 22);
  assert.equal(c.diasVacaciones(11), 24);
  assert.equal(c.diasVacaciones(31), 32);
  assert.equal(c.diasVacaciones(36), 34);
});

test('subsidio nunca convierte ISR en pago adicional al trabajador', () => {
  const r = c.netoDesdeBruto(6000, 'feb-dic', 0);
  assert.ok(r.subsidioAplicado <= r.isrCausado);
  assert.ok(r.isrRetenido >= 0);
  assert.ok(r.neto <= r.bruto);
});

test('neto a bruto encuentra el bruto mínimo antes del corte de subsidio', () => {
  const objetivo = 10750;
  const bruto = c.brutoParaNeto(objetivo, 'feb-dic', 0);
  const neto = c.netoDesdeBruto(bruto, 'feb-dic', 0).neto;
  const netoAnterior = c.netoDesdeBruto(Math.max(0, bruto - 0.01), 'feb-dic', 0).neto;
  assert.ok(bruto < c.SUBSIDIO_LIMITE);
  assert.ok(neto >= objetivo);
  assert.ok(netoAnterior < objetivo);
});

test('neto a bruto cruza correctamente el salto del subsidio cuando hace falta', () => {
  const objetivo = 10850;
  const bruto = c.brutoParaNeto(objetivo, 'feb-dic', 0);
  const neto = c.netoDesdeBruto(bruto, 'feb-dic', 0).neto;
  assert.ok(bruto > c.SUBSIDIO_LIMITE);
  assert.ok(neto >= objetivo);
});

test('factor de integración aumenta con la antigüedad por vacaciones', () => {
  assert.ok(c.factorIntegracion(5) > c.factorIntegracion(0));
});

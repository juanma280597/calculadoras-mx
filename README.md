# Calculadoras MX

Sitio estático de calculadoras laborales para México, publicado con GitHub Pages.

## Calculadoras actuales

- Sueldo neto ↔ bruto mensual (ISR 2026, subsidio al empleo e IMSS obrero estimado).
- Finiquito y liquidación estimada.
- Aguinaldo e ISR estimado.
- Vacaciones y prima vacacional.
- Horas extra dobles y triples.
- PTU / reparto individual de utilidades.

## Principios del producto

1. **Claridad antes que complejidad:** cada resultado muestra desglose y supuestos.
2. **Privacidad por diseño:** los datos de cálculo permanecen en el navegador.
3. **Fuentes oficiales:** SAT, DOF, INEGI, Ley Federal del Trabajo y Ley del Seguro Social.
4. **Sin dependencias de frontend:** HTML, CSS y JavaScript puro para mantener carga rápida.
5. **Estimación, no dictamen:** nóminas y conflictos laborales reales pueden depender de datos no capturados aquí.

## Desarrollo y pruebas

No hay dependencias externas de Node. Para ejecutar las pruebas:

```bash
npm test
```

GitHub Actions ejecuta las pruebas automáticamente en cada push y pull request.

## Motores de cálculo

- `calc.js`: sueldo, ISR, subsidio, IMSS estimado, finiquito y aguinaldo.
- `extras.js`: vacaciones/prima vacacional, horas extra y PTU.

## Checklist anual de actualización

Antes de cambiar el año visible del sitio:

- Actualizar tarifa ISR del Anexo 8 de la RMF.
- Revisar decreto de subsidio al empleo y su límite mensual.
- Actualizar UMA de INEGI.
- Actualizar salarios mínimos generales y ZLFN.
- Revisar reformas vigentes de LFT y LSS.
- Revisar reglas de PTU, vacaciones y jornada extraordinaria.
- Actualizar textos, metas SEO, sitemap y fecha de revisión.
- Ejecutar las pruebas y agregar casos nuevos para cualquier regla modificada.

## Limitaciones conocidas

- El IMSS es estimado y no reproduce todos los datos que puede manejar SUA (incidencias, ausencias, variables, prestaciones superiores, etc.).
- Si el trabajador percibe exactamente el salario mínimo diario, el artículo 36 de la LSS asigna al patrón el pago íntegro de la cuota obrera; el estimador no activa automáticamente ese caso especial.
- El salario diario integrado de una indemnización puede incluir prestaciones adicionales que el formulario no conoce.
- Los 20 días por año no proceden automáticamente en cualquier despido.
- PTU requiere datos globales del proyecto de reparto; la calculadora no determina por sí sola quién tiene derecho o si el patrón está obligado.
- Horas extra supone salario mensual ordinario convertido a salario diario entre 30 y divide el salario diario entre las horas de la jornada capturada.
- La calculadora de vacaciones muestra el valor económico del periodo y la prima vacacional; el salario ordinario normalmente continúa pagándose durante el descanso.

## Fuentes principales

- SAT: RMF 2026 y Anexo 8.
- DOF: decreto de subsidio al empleo 2026 y salarios mínimos 2026.
- INEGI: UMA 2026.
- Cámara de Diputados: Ley Federal del Trabajo y Ley del Seguro Social.

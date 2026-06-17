export interface EmailTemplateData {
  asunto: string;
  cuerpo: string;
  remitente: string;
  rolRemitente: string;
  nombreCurso: string;
}

export type TemplateId = 'clasico' | 'critico' | 'logro' | 'boletin' | 'citacion';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  render: (data: EmailTemplateData) => string;
}

const footerHTML = `
  <div style="margin-top: 30px; border-top: 1px solid #1f3028; padding-top: 15px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Este es un correo automático enviado desde el <strong>Portal Escolar Colegio Montahue</strong>.</p>
    <p>&copy; 2026 Colegio Montahue. Todos los derechos reservados.</p>
  </div>
`;

export const emailTemplates: Record<TemplateId, TemplateDefinition> = {
  clasico: {
    id: 'clasico',
    name: 'Institucional Clásico',
    description: 'Diseño formal y limpio ideal para comunicados estándar.',
    render: ({ asunto, cuerpo, remitente, rolRemitente, nombreCurso }) => `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #0c1510; color: #f0f4f1; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #1f3028; border-radius: 16px;">
        <div style="border-bottom: 2px solid #14b8a6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #4ade80; margin: 0; font-size: 20px; font-weight: bold;">Colegio Montahue</h2>
          <span style="font-size: 12px; color: #6b7280;">Comunicado Oficial · ${nombreCurso}</span>
        </div>
        <div style="font-size: 16px; line-height: 1.6; color: #d1d5db;">
          <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 15px;">${asunto}</h3>
          <p style="margin: 0 0 20px 0; white-space: pre-wrap;">${cuerpo}</p>
        </div>
        <div style="background-color: #111c16; border-left: 4px solid #14b8a6; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">Remite: ${remitente}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #9ca3af;">${rolRemitente}</p>
        </div>
        ${footerHTML}
      </div>
    `,
  },
  critico: {
    id: 'critico',
    name: 'Alerta / Urgente',
    description: 'Diseño de alto contraste para avisos de alta prioridad.',
    render: ({ asunto, cuerpo, remitente, rolRemitente, nombreCurso }) => `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #120909; color: #fcebeb; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #4a1515; border-radius: 16px;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">🚨</span>
          <div>
            <h2 style="color: #f87171; margin: 0; font-size: 20px; font-weight: bold;">AVISO CRÍTICO</h2>
            <span style="font-size: 12px; color: #fca5a5;">Colegio Montahue · ${nombreCurso}</span>
          </div>
        </div>
        <div style="font-size: 16px; line-height: 1.6; color: #f3f4f6;">
          <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px dashed #ef4444; padding-bottom: 8px;">${asunto}</h3>
          <p style="margin: 0 0 20px 0; white-space: pre-wrap; font-weight: 500;">${cuerpo}</p>
        </div>
        <div style="background-color: #2c1010; border-left: 4px solid #ef4444; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">Emitido por: ${remitente}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #fca5a5;">${rolRemitente}</p>
        </div>
        ${footerHTML}
      </div>
    `,
  },
  logro: {
    id: 'logro',
    name: 'Felicitación y Logros',
    description: 'Diseño festivo para comunicar reconocimientos y buenas noticias.',
    render: ({ asunto, cuerpo, remitente, rolRemitente, nombreCurso }) => `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #0b1418; color: #e0f2fe; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #1e3a8a; border-radius: 16px; position: relative;">
        <div style="border-bottom: 2px solid #fbbf24; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">🌟</span> Felicitaciones y Destacados
          </h2>
          <span style="font-size: 12px; color: #93c5fd;">Colegio Montahue · ${nombreCurso}</span>
        </div>
        <div style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 15px;">${asunto}</h3>
          <p style="margin: 0 0 20px 0; white-space: pre-wrap;">${cuerpo}</p>
        </div>
        <div style="background-color: #1e293b; border-left: 4px solid #fbbf24; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff;">Remite con orgullo: ${remitente}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">${rolRemitente}</p>
        </div>
        ${footerHTML}
      </div>
    `,
  },
  boletin: {
    id: 'boletin',
    name: 'Boletín Informativo',
    description: 'Estilo tipo newsletter moderno con tarjetas de contenido.',
    render: ({ asunto, cuerpo, remitente, rolRemitente, nombreCurso }) => `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #0b111e; color: #f1f5f9; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Boletín Informativo</h2>
          <span style="font-size: 12px; color: #e2e8f0; display: block; margin-top: 4px;">Colegio Montahue · ${nombreCurso}</span>
        </div>
        <div style="font-size: 15px; line-height: 1.6; color: #cbd5e1; background-color: #141b2d; border: 1px solid #1e293b; padding: 20px; border-radius: 12px;">
          <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px; font-weight: 700;">${asunto}</h3>
          <p style="margin: 0; white-space: pre-wrap;">${cuerpo}</p>
        </div>
        <div style="margin-top: 25px; text-align: right; font-size: 13px; color: #94a3b8;">
          <span>Por: <strong>${remitente}</strong> (${rolRemitente})</span>
        </div>
        ${footerHTML}
      </div>
    `,
  },
  citacion: {
    id: 'citacion',
    name: 'Citación o Reunión',
    description: 'Estructura específica para agendar y convocar a reuniones.',
    render: ({ asunto, cuerpo, remitente, rolRemitente, nombreCurso }) => `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #0b1311; color: #f0fdf4; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #115e59; border-radius: 16px;">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <h2 style="color: #2dd4bf; margin: 0; font-size: 20px; font-weight: bold;">Reunión & Citación</h2>
          <span style="background-color: #115e59; color: #2dd4bf; font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: bold;">Oficial · ${nombreCurso}</span>
        </div>
        <div style="font-size: 16px; line-height: 1.6; color: #ccfbf1;">
          <h3 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 15px;">${asunto}</h3>
          <div style="background-color: #111c18; border: 1px dashed #0d9488; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${cuerpo}</p>
          </div>
        </div>
        <div style="font-size: 13px; color: #94a3b8; border-top: 1px solid #1f3028; padding-top: 12px;">
          <span>Convocado por: <strong>${remitente}</strong> - ${rolRemitente}</span>
        </div>
        ${footerHTML}
      </div>
    `,
  },
};

/**
 * Logo de carga: monograma "CA" (Copiado Alfonzo) en letras negras
 * sobre fondo fucsia. Se usa mientras la aplicacion inicializa
 * (sembrado de datos, lectura de configuracion, etc.) antes de que
 * exista informacion suficiente para mostrar el logo real del negocio.
 */
export function LoadingLogo({ size = 88 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Copiado Alfonzo"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: 'linear-gradient(135deg, #FF1493, #FF4DB8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(255, 20, 147, 0.35)',
        animation: 'ca-pulse 1.6s ease-in-out infinite',
      }}
    >
      <span
        style={{
          fontFamily: "'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif",
          fontWeight: 900,
          fontSize: size * 0.42,
          color: '#0F0A12',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        CA
      </span>
      <style>{`
        @keyframes ca-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

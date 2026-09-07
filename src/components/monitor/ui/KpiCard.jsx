const colorMap = {
  blue:    { bar: 'var(--brand-primary)',        value: 'var(--brand-primary)'        },
  green:   { bar: 'var(--status-success-text)',  value: 'var(--status-success-text)'  },
  teal:    { bar: 'var(--brand-secondary)',      value: 'var(--brand-secondary)'      },
  purple:  { bar: 'var(--status-info-text)',     value: 'var(--status-info-text)'     },
  warn:    { bar: 'var(--brand-orange)',         value: 'var(--status-warning-text)'  },
  danger:  { bar: 'var(--status-danger-text)',   value: 'var(--status-danger-text)'   },
}

export default function KpiCard({ label, value, sub, color = 'blue', icon }) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Barra superior colorida */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '4px',
        background: c.bar,
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
      }} />

      {/* Label + ícone */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        marginTop: '4px',
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-family)',
          lineHeight: '16px',
        }}>
          {label}
        </p>
        {icon && (
          <span style={{ opacity: 0.7, flexShrink: 0 }}>
            {icon}
          </span>
        )}
      </div>

      {/* Valor */}
      <p style={{
        fontSize: '28px',
        fontWeight: 700,
        lineHeight: '32px',
        letterSpacing: '-0.02em',
        color: c.value,
        fontFamily: 'var(--font-family)',
        marginBottom: '6px',
      }}>
        {value}
      </p>

      {/* Sub */}
      {sub && (
        <p style={{
          fontSize: '13px',
          lineHeight: '18px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-family)',
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

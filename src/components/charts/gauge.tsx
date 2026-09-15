interface GaugeProps {
  percent: number;
  caption?: string;
}

export function Gauge({ percent, caption = "Concluídas" }: GaugeProps) {
  const r = 62;
  const sw = 22;
  const cx = 84;
  const cy = 78;
  const circumference = Math.PI * r;
  const done = (Math.max(0, Math.min(100, percent)) / 100) * circumference;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="relative m-[10px_0_2px] grid place-items-center">
      <svg width={168} height={96} viewBox="0 0 168 96">
        <defs>
          <pattern
            id="gauge-hatch"
            width={7}
            height={7}
            patternTransform="rotate(135)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={7}
              stroke="var(--border-strong)"
              strokeWidth={3.4}
            />
          </pattern>
        </defs>
        <path
          d={arc}
          fill="none"
          stroke="url(#gauge-hatch)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <path
          d={arc}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${done} ${circumference}`}
        />
      </svg>
      <div className="absolute bottom-0.5 text-center">
        <div className="font-head text-[38px] font-bold leading-none text-text-1">
          {Math.round(percent)}%
        </div>
        <div className="text-[11.5px] font-semibold text-text-3">{caption}</div>
      </div>
    </div>
  );
}

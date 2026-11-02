import React from 'react';

/**
 * StatCard
 *
 * Distinct theme variants with brand-safe accent colors:
 * - red: revenue-related (#C62828)
 * - dark: total/overview (#2C2C2A / near-black)
 * - amber: pending/warning (#BA7517 muted amber)
 * - warningRed: low stock alerts (#8E1B1B darker red)
 * - green: growth/positive (#639922 muted green)
 */
const THEMES = {
  red: {
    bg: 'bg-[#C62828] text-white',
    label: 'text-red-100',
    sublabel: 'text-red-200',
    iconBg: 'bg-white/15 text-white',
    badge: 'bg-white/20 text-white'
  },
  dark: {
    bg: 'bg-[#2C2C2A] text-white',
    label: 'text-gray-300',
    sublabel: 'text-gray-400',
    iconBg: 'bg-white/10 text-white',
    badge: 'bg-white/15 text-white'
  },
  amber: {
    bg: 'bg-[#BA7517] text-white',
    label: 'text-amber-100',
    sublabel: 'text-amber-200',
    iconBg: 'bg-white/15 text-white',
    badge: 'bg-white/20 text-white'
  },
  warningRed: {
    bg: 'bg-[#8E1B1B] text-white',
    label: 'text-red-200',
    sublabel: 'text-red-300',
    iconBg: 'bg-white/15 text-white',
    badge: 'bg-white/20 text-white'
  },
  green: {
    bg: 'bg-[#639922] text-white',
    label: 'text-emerald-100',
    sublabel: 'text-emerald-200',
    iconBg: 'bg-white/15 text-white',
    badge: 'bg-white/20 text-white'
  }
};

const StatCard = ({
  title,
  value,
  sublabel = 'This month',
  theme = 'red',
  icon = null,
  badgeText = null
}) => {
  const t = THEMES[theme] || THEMES.red;

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 duration-200 flex flex-col justify-between ${t.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${t.label}`}>
          {title}
        </span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black tracking-tight">{value}</p>
          {badgeText && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badge}`}>
              {badgeText}
            </span>
          )}
        </div>
        <p className={`text-[11px] font-medium mt-1 ${t.sublabel}`}>
          {sublabel}
        </p>
      </div>
    </div>
  );
};

export default StatCard;


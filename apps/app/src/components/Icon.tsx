/** Hand-drawn stroke icons, consistent with the direction A mockups. */
const PATHS = {
  body: (
    <>
      <circle cx="12" cy="4.8" r="2.3" />
      <path d="M5 10.5h14M12 8v8M12 16l-4 5.5M12 16l4 5.5" />
    </>
  ),
  moves: (
    <>
      <path d="M5 14.5l3-8 7.5-2 3.5 5.5-2 7.5-8 2z" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  injuries: <path d="M3 12h4.5l2.5-6 4 12 2.5-6H21" />,
  me: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  reset: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7" />,
  list: <path d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, small }: { name: IconName; small?: boolean }) {
  return (
    <svg className={small ? 'ico ico--sm' : 'ico'} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

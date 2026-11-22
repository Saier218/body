import { useT } from '../i18n';

export type Side = 'left' | 'right';

/** Two-position switch: knob on the left shows the left hand, on the right the right hand. */
export function SideSwitch({ side, onChange }: { side: Side; onChange: (side: Side) => void }) {
  const { t } = useT();
  const right = side === 'right';
  return (
    <button
      type="button"
      className="side"
      role="switch"
      aria-checked={right}
      aria-label={t('side_switch')}
      onClick={() => onChange(right ? 'left' : 'right')}
    >
      <span className="side__lbl" data-on={!right} aria-hidden="true">
        {t('side_left')}
      </span>
      <span className="side__track" aria-hidden="true">
        <span className="side__knob" />
      </span>
      <span className="side__lbl" data-on={right} aria-hidden="true">
        {t('side_right')}
      </span>
    </button>
  );
}

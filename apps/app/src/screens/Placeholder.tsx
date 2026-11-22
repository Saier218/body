import { useT, type TextKey } from '../i18n';

export function Placeholder({ title }: { title: TextKey }) {
  const { t } = useT();
  return (
    <section className="screen screen--doc">
      <header className="topbar">
        <h1 className="topbar__title">{t(title)}</h1>
      </header>
      <div className="empty">
        <p>{t('placeholder_body')}</p>
      </div>
    </section>
  );
}

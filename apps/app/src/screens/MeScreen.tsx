import { useT, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  setLang: (lang: Lang) => void;
  diag: string[];
  benchmarking: boolean;
  onBenchmark: () => void;
}

export function MeScreen({ lang, setLang, diag, benchmarking, onBenchmark }: Props) {
  const { t } = useT();
  return (
    <section className="screen screen--doc">
      <header className="topbar">
        <h1 className="topbar__title">{t('tab_me')}</h1>
      </header>
      <div className="doc">
        <section className="group">
          <h2 className="group__title">{t('me_language')}</h2>
          <div className="seg" role="radiogroup" aria-label={t('me_language')}>
            {(['zh', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                className="seg__opt"
                data-lang={l}
                onClick={() => setLang(l)}
              >
                {l === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </section>
        <section className="group">
          <h2 className="group__title">{t('me_about')}</h2>
          <p className="group__text">{t('me_disclaimer')}</p>
          <p className="group__text">{t('me_mirror')}</p>
          <p className="group__text">{t('me_pulleys')}</p>
          <p className="group__text group__text--small" id="credit">
            {t('me_credit')}
          </p>
        </section>
        <section className="group">
          <h2 className="group__title">{t('me_diag')}</h2>
          <p className="group__text group__text--small">{t('me_diag_hint')}</p>
          <button type="button" className="btn btn--line" id="bench" onClick={onBenchmark} disabled={benchmarking}>
            {t(benchmarking ? 'benchmarking' : 'bench_run')}
          </button>
          <pre className="diag" id="diag">
            {diag.join('\n')}
          </pre>
        </section>
      </div>
    </section>
  );
}

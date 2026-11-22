import { useCallback, useState } from 'react';
import { Icon, type IconName } from './components/Icon';
import { LangContext, t, type Lang, type TextKey } from './i18n';
import { BodyScreen } from './screens/BodyScreen';
import { MeScreen } from './screens/MeScreen';
import { Placeholder } from './screens/Placeholder';

type Tab = 'body' | 'moves' | 'injuries' | 'me';
const TABS: { id: Tab; icon: IconName; label: TextKey }[] = [
  { id: 'body', icon: 'body', label: 'tab_body' },
  { id: 'moves', icon: 'moves', label: 'tab_moves' },
  { id: 'injuries', icon: 'injuries', label: 'tab_injuries' },
  { id: 'me', icon: 'me', label: 'tab_me' },
];

export function App() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'));
  const [tab, setTab] = useState<Tab>('body');
  const [diag, setDiag] = useState<string[]>([]);
  const [benchRequest, setBenchRequest] = useState(0);
  const [benchmarking, setBenchmarking] = useState(false);

  const report = useCallback((line: string) => setDiag((d) => [...d, line]), []);
  const runBenchmark = () => {
    setTab('body');
    setBenchmarking(true);
    setBenchRequest((n) => n + 1);
  };
  const benchDone = useCallback(
    (line: string) => {
      report(line);
      setBenchmarking(false);
    },
    [report],
  );

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <div className="screens">
          {/* The body screen stays mounted so the 3D model is loaded once, not on every tab switch. */}
          <BodyScreen hidden={tab !== 'body'} report={report} benchRequest={benchRequest} onBenchDone={benchDone} />
          {tab === 'moves' && <Placeholder title="placeholder_moves" />}
          {tab === 'injuries' && <Placeholder title="placeholder_injuries" />}
          {tab === 'me' && <MeScreen lang={lang} setLang={setLang} diag={diag} benchmarking={benchmarking} onBenchmark={runBenchmark} />}
        </div>
        <nav className="tabbar" aria-label={t('nav_main', lang)}>
          {TABS.map((x) => (
            <button
              key={x.id}
              type="button"
              className="tab"
              data-tab={x.id}
              aria-current={tab === x.id ? 'page' : undefined}
              onClick={() => setTab(x.id)}
            >
              <Icon name={x.icon} />
              <span className="tab__label">{t(x.label, lang)}</span>
            </button>
          ))}
        </nav>
      </div>
    </LangContext.Provider>
  );
}

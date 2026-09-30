import { useRef, useState } from 'react';
import TEMPLATE from '../../../data/templates/facilities.csv?raw';

// Import a facilities CSV, or go back to the simulated data. The file is read in the browser and never uploaded.
export default function DataSourceControl({ imported, onImport, onUseSimulated }) {
  const input = useRef(null);
  const [msg, setMsg] = useState(null);

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const res = onImport({ mode: 'csv', text: await file.text(), fileName: file.name });
    setMsg(res.ok ? { ok: true, lines: res.notes } : { ok: false, lines: res.errors });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'facilities-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="ds-control">
      <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} />
      <button type="button" className="btn-line ds-btn" onClick={() => input.current.click()}>Import CSV</button>
      <button type="button" className="link-btn" onClick={download}>Template</button>
      {imported && <button type="button" className="link-btn" onClick={() => { setMsg(null); onUseSimulated(); }}>Use simulated data</button>}
    </div>
    {msg && (
      <div className={'ds-msg ' + (msg.ok ? 'ok' : 'bad')} role={msg.ok ? 'status' : 'alert'}>
        <span><strong>{msg.ok ? 'Imported.' : 'Not imported.'}</strong> {msg.lines.join(' ')}</span>
        <button type="button" className="link-btn" onClick={() => setMsg(null)}>Dismiss</button>
      </div>
    )}
    </>
  );
}

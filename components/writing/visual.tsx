"use client";

type Visual = { kind?: string; caption?: string; columns?: string[]; rows?: (string | number)[][]; steps?: string[]; maps?: { label: string; cells: string[] }[]; charts?: Visual[] };
const colours = ["#26735e", "#c26635", "#527bb4", "#a85587"];
export function WritingVisual({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return null;
  const data = value as Visual;
  if (data.kind === "mixed") return <div className="stack">{data.charts?.map((chart, i) => <WritingVisual key={i} value={chart}/>)}</div>;
  if (data.kind === "process") return <figure className="writing-visual"><figcaption>{data.caption}</figcaption><ol className="writing-process">{data.steps?.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol></figure>;
  if (data.kind === "map") return <figure className="writing-visual"><figcaption>{data.caption} · ↑ North</figcaption><div className="writing-maps">{data.maps?.map(map => <section key={map.label}><h3>{map.label}</h3><div className="writing-map">{map.cells.map((cell, i) => <div key={i}>{cell}</div>)}</div></section>)}</div></figure>;
  if (!data.columns || !data.rows) return null;
  const { columns, rows } = data;
  const series = columns.slice(1);
  const maximum = Math.max(1, ...rows.flatMap(row => row.slice(1).map(Number)));
  const chart = data.kind === "line" || data.kind === "bar";
  return <figure className="writing-visual"><figcaption>{data.caption}</figcaption>
    {chart && <><svg viewBox="0 0 600 280" role="img" aria-label={`${data.kind} chart: ${data.caption}. Exact values in the table below.`}>
      {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="50" y1={230 - tick * 50} x2="580" y2={230 - tick * 50} stroke="currentColor" opacity=".15"/><text x="42" y={235 - tick * 50} textAnchor="end" fill="currentColor" fontSize="12">{Math.round(maximum * tick / 4)}</text></g>)}
      {rows.map((row, i) => <text key={i} x={75 + i * 480 / Math.max(1, rows.length - 1)} y="258" textAnchor="middle" fill="currentColor" fontSize="12">{row[0]}</text>)}
      {series.map((name, s) => data.kind === "line" ? <g key={name}><polyline fill="none" stroke={colours[s % colours.length]} strokeWidth="3" points={rows.map((row, i) => `${75 + i * 480 / Math.max(1, rows.length - 1)},${230 - Number(row[s + 1]) / maximum * 200}`).join(" ")}/>{rows.map((row, i) => <circle key={i} cx={75 + i * 480 / Math.max(1, rows.length - 1)} cy={230 - Number(row[s + 1]) / maximum * 200} r="4" fill={colours[s % colours.length]}/>)}</g> : <g key={name}>{rows.map((row, i) => <rect key={i} x={75 + i * 480 / Math.max(1, rows.length - 1) + (s - series.length / 2) * 18} y={230 - Number(row[s + 1]) / maximum * 200} width="16" height={Number(row[s + 1]) / maximum * 200} fill={colours[s % colours.length]}/>)}</g>)}
    </svg><div className="writing-legend">{series.map((name, i) => <span key={name}><i style={{ background: colours[i % colours.length] }}/>{name}</span>)}</div></>}
    {data.kind === "pies" && <div className="writing-pies">{series.map((name, s) => {
      let offset = 0;
      const total = rows.reduce((sum, row) => sum + Number(row[s + 1]), 0);
      const segments = rows.map((row, i) => { const start = offset; offset += Number(row[s + 1]) / total * 100; return `${colours[i % colours.length]} ${start}% ${offset}%`; });
      return <div key={name}><h3>{name}</h3><div className="writing-pie" role="img" aria-label={`${name}: ${rows.map(row => `${row[0]} ${row[s + 1]}%`).join(", ")}`} style={{ background: `conic-gradient(${segments.join(",")})` }}/><div className="writing-legend">{rows.map((row, i) => <span key={i}><i style={{ background: colours[i % colours.length] }}/>{row[0]} · {row[s + 1]}%</span>)}</div></div>;
    })}</div>}
    <div className="table-wrap"><table><caption className="sr-only">{data.caption} — exact values</caption><thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
  </figure>;
}

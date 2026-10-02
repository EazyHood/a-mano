import { useId } from 'react';
import type { Item } from '../domain';

type Kind = 'adapter' | 'powerstrip' | 'allen' | 'measure' | 'bulb' | 'batteries' | 'umbrella' | 'sewing' | 'folder' | 'manual' | 'keys' | 'tools' | 'device' | 'box';

function kindOf(item: Item): Kind {
  const title = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/regleta|multitoma|extension electrica/.test(title)) return 'powerstrip';
  if (/bombilla|lampara|foco/.test(title)) return 'bulb';
  if (/pila|bateria/.test(title)) return 'batteries';
  if (/paraguas/.test(title)) return 'umbrella';
  if (/cinta|metro|flexometro/.test(title)) return 'measure';
  if (/allen|hexagonal/.test(title)) return 'allen';
  if (/hilo|costura|aguja|tijera/.test(title)) return 'sewing';
  if (/cable|adaptador|cargador|hdmi|usb/.test(title)) return 'adapter';
  if (/llave/.test(title)) return 'keys';
  if (/manual|instruccion/.test(title)) return 'manual';
  if (/pasaporte|garantia|document|papel|carpeta/.test(title) || item.category === 'documentos') return 'folder';
  if (item.category === 'herramientas') return 'tools';
  if (item.category === 'tecnologia') return 'device';
  return 'box';
}

/** Original material studies, not photographs. The written record is authoritative. */
export function ObjectArt({ item, hero = false }: { item: Item; hero?: boolean }) {
  const id = `object-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const fill = (name: string) => `url(#${id}-${name})`;
  const kind = kindOf(item);
  return <svg className={`object-art object-art-${kind}${hero ? ' object-art-large' : ''}`} viewBox="0 0 240 160" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".75"><stop stopColor="#adaba5"/><stop offset=".18" stopColor="#f0ede5"/><stop offset=".44" stopColor="#dad7d1"/><stop offset=".73" stopColor="#f7f4ec"/><stop offset="1" stopColor="#9b9994"/></linearGradient>
      <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#656460"/><stop offset=".3" stopColor="#cdcbc5"/><stop offset=".45" stopColor="#f6f3eb"/><stop offset=".62" stopColor="#acaaa5"/><stop offset="1" stopColor="#71706c"/></linearGradient>
      <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="1" y2=".8"><stop stopColor="#565552"/><stop offset=".35" stopColor="#373634"/><stop offset="1" stopColor="#20201f"/></linearGradient>
      <linearGradient id={`${id}-white`} x1="0" y1="0" x2=".75" y2="1"><stop stopColor="#fffef6"/><stop offset=".5" stopColor="#f3f0e8"/><stop offset="1" stopColor="#d5d2cb"/></linearGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffef6"/><stop offset=".7" stopColor="#f0ede5"/><stop offset="1" stopColor="#e0ddd6"/></linearGradient>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4965ed"/><stop offset=".45" stopColor="#2545db"/><stop offset="1" stopColor="#1933af"/></linearGradient>
      <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="200%" colorInterpolationFilters="sRGB"><feDropShadow dx="1" dy="5" stdDeviation="3" floodColor="#252423" floodOpacity=".13"/></filter>
      <filter id={`${id}-ground`} x="-40%" y="-160%" width="180%" height="420%"><feGaussianBlur stdDeviation="3.5"/></filter>
    </defs>
    <ellipse className="object-ground" cx="123" cy="136" rx={kind === 'powerstrip' ? 77 : 58} ry="4" fill="#2a2a29" opacity=".1" filter={fill('ground')}/>
    <g className="object-body" strokeLinejoin="round" strokeLinecap="round">
      {kind === 'adapter' && <g transform="translate(2 -3) rotate(-12 120 83)">
        <path d="M100 84H79c-28 0-43-11-43-30 0-18 13-27 31-27 20 0 35 14 35 32" stroke="#2a2928" strokeWidth="8"/>
        <path d="M100 82H79c-27 0-41-10-41-28 0-16 12-25 29-25 18 0 33 13 33 30" stroke="#7c7a76" strokeWidth="1.4" opacity=".65"/>
        <g filter={fill('shadow')}>
          <rect x="83" y="68" width="22" height="25" rx="6" fill={fill('dark')}/>
          <path d="M103 64h70c7 0 12 5 12 12v25c0 7-5 12-12 12h-70c-6 0-10-4-10-10V74c0-6 4-10 10-10Z" fill={fill('metal')} stroke="#a1a09a" strokeWidth=".7"/>
          <path d="M104 67h66c6 0 10 4 10 10v23c0 6-4 9-10 9h-66c-4 0-7-3-7-7V74c0-4 3-7 7-7Z" fill="#eeebe4" fillOpacity=".36"/>
          <path d="M177 70c4 1 6 4 6 8v22c0 4-2 7-6 9" stroke="#fdfaf2" strokeWidth="1.5"/>
          <path d="M158 80h19v17h-19l-4-4v-9Z" fill="#7d7c78" stroke="#f2efe7" strokeWidth="1"/>
          <path d="M161 83h13v11h-13l-3-3v-5Z" fill="#252524"/><path d="M161 86h10m-10 5h10" stroke="#aeaca6" strokeWidth=".8"/>
          <path d="M111 70v36" stroke="#fcf9f1" opacity=".6"/>
        </g>
        <g transform="rotate(-8 101 42)"><rect x="92" y="36" width="19" height="28" rx="5" fill={fill('dark')}/><path d="M93 36V24c0-3 3-5 8-5s9 2 9 5v12Z" fill={fill('metal')} stroke="#8f8e89" strokeWidth=".7"/><ellipse cx="101.5" cy="23" rx="6.5" ry="2.5" fill="#383735"/><path d="M97 23h9" stroke="#b8b6b0"/><path d="M97 41v16" stroke="#696864" strokeWidth="1.3"/></g>
      </g>}

      {kind === 'powerstrip' && <g transform="rotate(-18 124 80)">
        <path d="M53 72H35c-17 0-25-14-18-26s28-7 35-16" stroke="#cbc8c2" strokeWidth="7"/><path d="M53 70H35c-17 0-23-12-17-23s26-7 33-16" stroke="#fcf9f1" strokeWidth="2"/>
        <g filter={fill('shadow')}><rect x="51" y="58" width="157" height="53" rx="14" fill="#b9b7b1"/><rect x="50" y="52" width="158" height="53" rx="14" fill={fill('white')} stroke="#cecbc5" strokeWidth=".8"/><path d="M62 55h132c7 0 10 4 11 10" stroke="#fffef6" strokeWidth="1.4"/>
          {[78, 121, 164].map(x => <g key={x}><circle cx={x} cy="78" r="15.5" fill="#d2d0c9"/><circle cx={x} cy="77" r="14" fill="#f6f3eb" stroke="#c5c2bc" strokeWidth=".7"/><circle cx={x - 4.5} cy="77" r="2" fill="#494846"/><circle cx={x + 4.5} cy="77" r="2" fill="#494846"/><path d={`M${x - 2} 64h4m-4 26h4`} stroke="#b7b5af" strokeWidth="1.8"/></g>)}
          <rect x="188" y="69" width="11" height="18" rx="3" fill="#1931a3"/><rect x="189" y="69" width="9" height="15" rx="2" fill={fill('blue')}/><path d="M193.5 72v4" stroke="#ebe9e1"/>
        </g>
        <g transform="translate(48 20) rotate(15)"><rect width="18" height="19" rx="6" fill={fill('white')} stroke="#cccac3" strokeWidth=".8"/><path d="M4 0v-9m10 9v-9" stroke={fill('steel')} strokeWidth="3"/></g>
      </g>}

      {kind === 'allen' && <g transform="rotate(-12 120 83)" filter={fill('shadow')}>
        {[{ x: 53, y: 24, h: 102, w: 34, s: 9 }, { x: 78, y: 29, h: 87, w: 30, s: 8 }, { x: 102, y: 34, h: 73, w: 26, s: 7 }, { x: 125, y: 39, h: 59, w: 23, s: 6 }, { x: 147, y: 44, h: 46, w: 20, s: 5 }, { x: 167, y: 50, h: 33, w: 18, s: 4 }].map(({ x, y, h, w, s }) => <g key={x}><path d={`M${x} ${y}v${h}h${w}`} stroke="#2e2d2c" strokeWidth={s} strokeLinecap="butt"/><path d={`M${x - s / 4} ${y + 1}v${h - s / 4}h${w}`} stroke="#7b7a76" strokeWidth={s / 3} strokeLinecap="butt"/><path d={`M${x + s / 3} ${y + 1}v${h + s / 5}h${w - 1}`} stroke="#262625" strokeWidth=".6" strokeLinecap="butt"/><path d={`M${x - s / 2} ${y}h${s}`} stroke="#9b9994" strokeWidth="1"/></g>)}
        <path d="M43 63h134v18H43Z" fill={fill('blue')} stroke="#1932aa" strokeWidth=".7"/><path d="M45 65h129" stroke="#8097fb" strokeWidth=".8"/>
        {[53, 78, 102, 125, 147, 167].map((x, i) => <path key={x} d={`M${x} 65v14`} stroke="#183498" strokeWidth={9 - i} opacity=".7"/>)}<path d="M43 78h134v4H43z" fill="#1c34a6"/>
      </g>}

      {kind === 'measure' && <g transform="rotate(-8 122 82)">
        <path d="M149 101h60v15h-63" fill={fill('metal')} stroke="#a8a6a1" strokeWidth=".8"/>
        {[159, 166, 173, 180, 187, 194, 201].map((x, i) => <path key={x} d={`M${x} 102v${i % 2 ? 5 : 8}`} stroke="#555451" strokeWidth=".8"/>)}<path d="M209 98v21h5v-21" fill="#b6b4ae" stroke="#83817d" strokeWidth=".8"/>
        <path d="M70 97c-33 29-52 10-31-7l25-16" stroke="#353533" strokeWidth="4"/><path d="M70 95c-34 28-49 11-29-4" stroke="#72716d"/>
        <g filter={fill('shadow')}><path d="M71 45c22-21 67-18 82 7 8 13 8 40 4 56-3 13-14 20-28 20H83c-16 0-27-11-27-27V71c0-11 4-20 15-26Z" fill={fill('dark')} stroke="#42413f" strokeWidth=".8"/><path d="M80 44c25-12 60-8 70 14 7 14 5 35 3 48-1 9-10 15-21 15H86c-14 0-23-9-23-23V72c0-13 4-22 17-28Z" fill={fill('blue')}/><path d="M80 48c23-11 55-8 64 11" stroke="#8195fa" strokeWidth="1.3" opacity=".8"/>
          <path d="M89 34v-7h25v8" fill="#434240" stroke="#73716e"/><rect x="93" y="30" width="17" height="5" rx="1" fill="#2f2e2d"/>
          <circle cx="109" cy="81" r="26" fill="#1931a2"/><circle cx="108" cy="79" r="23" fill={fill('dark')} stroke="#8794c7" strokeWidth=".8"/><circle cx="108" cy="79" r="15" fill="#4c4b49" stroke="#72716e" strokeWidth=".8"/><path d="M102 79h12" stroke="#d2cfc9" strokeWidth="1.5"/><circle cx="143" cy="111" r="2.1" fill="#c3c0ba"/><path d="m142 110 2 2" stroke="#393837" strokeWidth=".8"/>
        </g>
      </g>}

      {kind === 'bulb' && <g transform="rotate(18 121 78)" filter={fill('shadow')}>
        <path d="M102 103c-2-11-6-17-14-27-7-9-11-19-11-29 0-25 19-37 42-37s42 12 42 37c0 10-4 20-11 29-8 10-12 16-14 27Z" fill={fill('white')} stroke="#d0cec7" strokeWidth=".8"/><path d="M105 99c-2-12-8-20-15-29-6-8-9-15-9-25 0-15 9-27 22-31" stroke="#fffef6" strokeWidth="3" opacity=".8"/><path d="M103 95h32l-3 16h-26Z" fill={fill('white')}/><path d="M106 107h26v25l-7 8h-12l-7-8Z" fill={fill('metal')} stroke="#a3a19c" strokeWidth=".8"/>
        {[112, 118, 124, 130].map(y => <g key={y}><path d={`m106 ${y} 26-4`} stroke="#908e89" strokeWidth="2.5"/><path d={`m107 ${y - 1} 24-4`} stroke="#f4f2ea" strokeWidth=".9"/></g>)}<path d="m112 137 13 1-3 5h-7Z" fill="#52514f"/><path d="M110 108h18" stroke="#fffdf5"/>
      </g>}

      {kind === 'batteries' && <g filter={fill('shadow')}>
        {[{ x: 77, y: 41, r: -12 }, { x: 135, y: 24, r: 11 }].map(({ x, y, r }, index) => <g key={x} transform={`rotate(${r} ${x + 16} ${y + 46})`}>
          <path d={`M${x + 9} ${y}v-5h14v5`} fill={fill('steel')} stroke="#a19f9a" strokeWidth=".8"/><rect x={x} y={y} width="32" height="91" rx="5" fill={fill('dark')} stroke="#3d3c3a" strokeWidth=".8"/>
          <path d={`M${x} ${y + 5}a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v26H${x}Z`} fill={fill(index ? 'metal' : 'blue')}/><path d={`M${x + 4} ${y + 8}v75`} stroke="#fffef6" strokeWidth="1.1" opacity=".18"/>
          <path d={`M${x + 11} ${y + 16}h10m-5-5v10`} stroke={index ? '#4d4c4a' : '#eeebe4'} strokeWidth="1.6"/><path d={`M${x + 8} ${y + 48}h16v22H${x + 8}Z`} stroke="#7d7c78" strokeWidth=".8"/><path d={`m${x + 19} ${y + 51}-8 11h7l-5 7 9-10h-7Z`} fill="#eae7e0" opacity=".8"/>
          <path d={`M${x} ${y + 86}h32v1a5 5 0 0 1-5 5H${x + 5}a5 5 0 0 1-5-5Z`} fill={fill('metal')}/><path d={`M${x + 4} ${y + 89}h24`} stroke="#fcf9f1" strokeWidth=".7"/>
        </g>)}
      </g>}

      {kind === 'umbrella' && <g transform="rotate(-37 119 79)" filter={fill('shadow')}>
        <path d="M49 73h17" stroke={fill('steel')} strokeWidth="4"/><path d="M62 73c17-13 73-16 109-8l8 8-8 9c-36 8-92 4-109-9Z" fill={fill('dark')} stroke="#31302f" strokeWidth=".8"/><path d="M66 73c23-6 67-9 105-4M67 75c27 2 66 5 104 2" stroke="#787773"/><path d="M69 70c27-9 66-11 94-6" stroke="#9b9994" strokeWidth=".7" opacity=".7"/>
        <path d="M126 61v26h10V61" fill={fill('blue')} stroke="#1c38b4" strokeWidth=".6"/><circle cx="132" cy="73" r="1.5" fill="#8096fb"/><path d="M177 73h9" stroke={fill('steel')} strokeWidth="5"/><path d="M186 73h13c17 0 20 27 3 29-10 2-15-5-14-12" stroke="#2e2e2c" strokeWidth="10"/><path d="M187 70h12c10 0 15 11 11 20" stroke="#84827e" strokeWidth="1.5" opacity=".8"/><path d="M193 81c-9 20-14 27-26 18" stroke="#3a3937" strokeWidth="2"/>
      </g>}

      {kind === 'sewing' && <g filter={fill('shadow')}>
        <g transform="rotate(-9 82 86)"><ellipse cx="80" cy="125" rx="23" ry="7" fill="#b1afa9"/><rect x="59" y="44" width="42" height="81" rx="5" fill={fill('white')}/><path d="M62 55h36v58H62Z" fill={fill('blue')}/>
          {Array.from({ length: 15 }, (_, i) => <path key={i} d={`m62 ${58 + i * 3.5} 36-2`} stroke={i % 3 === 0 ? '#7f92ee' : '#1c35aa'} strokeWidth="1" opacity=".65"/>)}
          <ellipse cx="80" cy="44" rx="23" ry="7" fill={fill('white')} stroke="#c5c2bc" strokeWidth=".8"/><ellipse cx="80" cy="43" rx="7" ry="3" fill="#afada7"/><ellipse cx="80" cy="43" rx="4" ry="1.8" fill="#454442"/><ellipse cx="80" cy="119" rx="23" ry="7" fill={fill('white')} stroke="#c8c6c0" strokeWidth=".8"/><path d="M62 90c-20 10-30 33-11 38 13 4 37 0 43 7" stroke="#2545db" strokeWidth="1.3"/>
        </g>
        <g transform="rotate(12 154 81)"><path d="m145 96-9-71c-1-5 1-9 3-10l17 78Zm10-3 19-67c1-5 4-8 7-8l-15 78Z" fill={fill('steel')} stroke="#8e8d88" strokeWidth=".7"/><path d="m142 26 11 63m23-60-16 61" stroke="#fcf9f1" strokeWidth=".9"/><path d="m149 94-4 16m17-15 4 15" stroke="#b6b4ae" strokeWidth="7"/><ellipse cx="137" cy="120" rx="13" ry="17" transform="rotate(26 137 120)" stroke="#42423f" strokeWidth="7"/><ellipse cx="177" cy="120" rx="13" ry="17" transform="rotate(-25 177 120)" stroke="#42423f" strokeWidth="7"/><path d="M129 109c-5 2-9 9-8 16m63-16c5 3 9 9 8 16" stroke="#9c9a95"/><circle cx="155" cy="91" r="5" fill={fill('metal')} stroke="#7d7b77" strokeWidth=".8"/><path d="m153 93 4-4" stroke="#72716d"/></g>
      </g>}

      {kind === 'folder' && <g transform="rotate(-9 122 82)" filter={fill('shadow')}>
        <path d="M57 29h44l9 10h73v99H57Z" fill="#c3c0ba" stroke="#a8a6a1" strokeWidth=".8"/><path d="M67 30h111v95H67Z" fill="#f5f2eb" stroke="#d8d5ce" strokeWidth=".8"/><path d="M73 26h104v96H73Z" fill={fill('paper')} stroke="#d8d5ce" strokeWidth=".8"/><path d="M62 45h121v89H62Z" fill="#dcdad3" stroke="#bdbbb5" strokeWidth=".8"/>
        <path d="M58 48h126v82c0 5-3 8-8 8H64c-4 0-7-3-7-7Z" fill={fill('white')} stroke="#c4c2bc" strokeWidth=".8"/><path d="M60 51h120" stroke="#fffef5" strokeWidth="1.2"/><path d="M67 53v80" stroke="#e3e0d9"/><path d="M144 29h26v19h-26Z" fill={fill('blue')}/><path d="M152 29h10" stroke="#96a5f5"/>
        <path d="M87 68v38c0 5 8 5 8 0V74c0-8-14-8-14 0v29" stroke="#b6b4ae" strokeWidth="2.8"/><path d="M86 68v38c0 5 8 5 8 0V74c0-8-14-8-14 0v29" stroke="#fdfaf2"/>
      </g>}

      {kind === 'manual' && <g transform="rotate(9 120 81)" filter={fill('shadow')}>
        <path d="M71 26h100v116H71Z" fill="#bebcb6"/><path d="M72 24h100v115H72Z" fill="#faf7ef" stroke="#c6c3bd" strokeWidth=".7"/><path d="M72 25h5v113h-5Z" fill={fill('blue')}/><path d="M78 22h92v113H78Z" fill={fill('paper')} stroke="#dddad3" strokeWidth=".7"/><path d="M81 25v106" stroke="#eae7e0"/><path d="M170 118H79m91 8H79m91 7H79" stroke="#cdcac4" strokeWidth=".7"/>
        <g transform="translate(124 78) rotate(-32)" stroke="#82817d" strokeWidth="1.2"><path d="M-8-35h16v9H-8Z" fill="#eeebe4"/><path d="M-3-26h6v39h-6Z" fill="#e8e5de"/>{[-18, -12, -6, 0, 6].map(y => <path key={y} d={`m-5 ${y} 10-3`}/>)}<path d="m-15 29 7-11H8l7 11-7 11H-8Z" fill="#e8e5de"/><circle cy="29" r="5" fill="#faf7ef"/><path d="M0 14v3" strokeDasharray="1 2"/></g><path d="M78 49h4m-4 60h4" stroke="#95938f" strokeWidth="1.4"/>
      </g>}

      {kind === 'keys' && <g transform="rotate(-14 120 80)" filter={fill('shadow')}>
        <circle cx="117" cy="55" r="29" stroke="#797774" strokeWidth="4"/><circle cx="116" cy="53" r="29" stroke={fill('steel')} strokeWidth="3"/>
        <g transform="rotate(27 132 71)"><path d="M132 61c-26 0-26 31-7 34v43h15v-9h-7v-7h7v-8h-7V95c19-3 19-34-1-34Z" fill={fill('metal')} stroke="#a19f9a" strokeWidth=".8"/><circle cx="132" cy="74" r="5" fill="#969490"/><path d="M128 97v37" stroke="#fffcf4"/></g>
        <g transform="rotate(-19 100 77)"><path d="M100 66c-24 0-24 31-7 34v40h15v-8h-6v-8h6v-8h-6v-16c18-3 18-34-2-34Z" fill={fill('steel')} stroke="#a7a59f" strokeWidth=".8"/><path d="M83 79c0-21 35-21 35 0v11H83Z" fill={fill('blue')}/><circle cx="100" cy="78" r="5" fill="#2137a7" stroke="#97a6ed"/><path d="M96 102v33" stroke="#fbf8f1"/></g><path d="M91 57c-1-23 30-32 43-16" stroke="#efece5" strokeWidth="1.3"/>
      </g>}

      {kind === 'tools' && <g filter={fill('shadow')}>
        <g transform="rotate(25 94 80)"><path d="M89 22h9v68h-9Z" fill={fill('steel')} stroke="#9b9994" strokeWidth=".6"/><path d="M89 22v-9h9v9" fill="#a5a39d"/><rect x="80" y="82" width="27" height="60" rx="10" fill={fill('dark')}/><path d="M81 96h25v31H81Z" fill={fill('blue')}/><path d="M87 88v45m13-45v45" stroke="#7b8adc"/></g>
        <g transform="rotate(-19 152 80)"><path d="M147 47c-20-8-19-27-6-37v20l13 8 13-8V10c14 10 15 29-6 37v64c16 8 13 26 1 30l-9-5-9 5c-12-5-13-23 3-30Z" fill={fill('steel')} stroke="#a4a29c" strokeWidth=".8"/><path d="M152 51v55" stroke="#faf7ef" strokeWidth="2"/><path d="m147 126 6-7 6 7-6 7Z" fill="#989692"/></g>
      </g>}

      {kind === 'device' && <g transform="rotate(-14 121 78)" filter={fill('shadow')}>
        <rect x="63" y="43" width="121" height="85" rx="9" fill="#898783"/><rect x="60" y="37" width="122" height="86" rx="9" fill={fill('metal')} stroke="#b2b0aa" strokeWidth=".8"/><path d="M69 39h103c4 0 7 3 7 7" stroke="#fcf9f1" strokeWidth="1.2"/><rect x="65" y="43" width="112" height="73" rx="5" fill={fill('dark')}/><path d="M72 49v60" stroke="#8b8a85" strokeWidth=".8"/><path d="M173 52v53" stroke="#302f2e"/><rect x="82" y="116" width="23" height="5" rx="2.5" fill="#383836"/><path d="M85 118h17" stroke="#91908b" strokeWidth=".6"/><circle cx="161" cy="106" r="2" fill="#4261ec"/>
      </g>}

      {kind === 'box' && <g transform="translate(0 -4)" filter={fill('shadow')}>
        <path d="m49 55 76-29 69 27-78 30Z" fill="#f3f0e9" stroke="#c5c3bd" strokeWidth=".8"/><path d="M49 55v66l67 27V83Z" fill="#e3e0d9" stroke="#c3c0ba" strokeWidth=".8"/><path d="m116 83 78-30v65l-78 30Z" fill={fill('white')} stroke="#c5c3bd" strokeWidth=".8"/><path d="m47 51 77-30 73 28-79 31Z" fill={fill('paper')} stroke="#cdcac4" strokeWidth=".8"/><path d="m47 51 71 29v8L47 59Zm71 29 79-31v8l-79 31Z" fill="#eeebe4" stroke="#cecbc5" strokeWidth=".8"/><path d="m99 31 73 28v29l-16 7V66L82 37Z" fill={fill('blue')}/><path d="m135 104 37-14v10l-37 14Z" fill="#999792"/><path d="m137 105 32-12v5l-32 12Z" fill="#646360"/><path d="M55 64v51m67-28v53" stroke="#fdfaf2" opacity=".7"/>
      </g>}
    </g>
  </svg>;
}

/** Physical index cards, not a mock app. Layer classes are reserved for CSS motion. */
export function ShelfArt() {
  const id = `archive-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <svg className="shelf-art archive-art" viewBox="0 0 380 310" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sheet`} x1="64" y1="30" x2="296" y2="261" gradientUnits="userSpaceOnUse"><stop stopColor="#fffef6"/><stop offset="1" stopColor="#eae7e0"/></linearGradient>
      <linearGradient id={`${id}-blue`} x1="97" y1="67" x2="282" y2="262" gradientUnits="userSpaceOnUse"><stop stopColor="#4a67e9"/><stop offset=".6" stopColor="#2545db"/><stop offset="1" stopColor="#1933ab"/></linearGradient>
      <linearGradient id={`${id}-steel`} x1="160" y1="126" x2="232" y2="201" gradientUnits="userSpaceOnUse"><stop stopColor="#aeaca6"/><stop offset=".35" stopColor="#f9f6ef"/><stop offset=".65" stopColor="#bfbdb7"/><stop offset="1" stopColor="#8b8985"/></linearGradient>
      <filter id={`${id}-shadow`} x="-35%" y="-30%" width="190%" height="190%" colorInterpolationFilters="sRGB"><feDropShadow dx="5" dy="12" stdDeviation="10" floodColor="#2b2a29" floodOpacity=".13"/></filter>
      <filter id={`${id}-ground`} x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="10"/></filter>
    </defs>
    <ellipse className="archive-ground" cx="206" cy="278" rx="117" ry="9" fill="#2d2d2b" opacity=".14" filter={`url(#${id}-ground)`}/>
    <g className="archive-card archive-card-back"><g transform="translate(3 2) rotate(-16 181 155)" filter={`url(#${id}-shadow)`}>
      <path d="M99 33h92l15 15h57v201c0 7-5 12-12 12H99c-7 0-12-5-12-12V45c0-7 5-12 12-12Z" fill="#dedbd4" stroke="#cac7c1"/><path d="M97 39h91l15 15h54" stroke="#f9f6ee" strokeWidth="1.5"/><circle cx="110" cy="68" r="4" fill="#b6b4ae"/>
    </g></g>
    <g className="archive-card archive-card-middle"><g transform="translate(13 6) rotate(8 190 162)" filter={`url(#${id}-shadow)`}>
      <path d="M103 45h144c7 0 12 5 12 12v192c0 7-5 12-12 12H103c-7 0-12-5-12-12V57c0-7 5-12 12-12Z" fill={`url(#${id}-sheet)`} stroke="#d3d0ca"/><path d="M219 45h27v33h-27Z" fill={`url(#${id}-blue)`}/><path d="M223 46h19" stroke="#96a5f4"/><circle cx="112" cy="67" r="4" fill="#d7d4cd"/><path d="M99 249h152" stroke="#d6d4cd"/>
    </g></g>
    <g className="archive-card archive-card-front"><g transform="translate(15 15) rotate(-5 194 172)" filter={`url(#${id}-shadow)`}>
      <path d="M110 64h142c7 0 12 5 12 12v183c0 7-5 12-12 12H110c-7 0-12-5-12-12V76c0-7 5-12 12-12Z" fill={`url(#${id}-blue)`} stroke="#203ab0"/><path d="M109 67h143c5 0 8 4 8 8" stroke="#899cf2" strokeWidth="1.1" opacity=".7"/><circle cx="117" cy="87" r="4" fill="#1d34a0"/><path d="M115 84c3-1 6 1 6 4" stroke="#7c92ec"/><path d="M105 257c0 5 3 8 8 8h137" stroke="#192fa0" strokeWidth="1.3" opacity=".7"/>
      <g className="archive-key" transform="rotate(-29 184 167)"><path d="M179 125c-27 0-27 34-8 39v58h18v-10h-8v-9h8v-10h-8v-29c19-5 19-39-2-39Z" fill={`url(#${id}-steel)`} stroke="#9c9a95" strokeWidth=".8"/><circle cx="178" cy="140" r="6" fill="#2545db" stroke="#898783" strokeWidth=".8"/><path d="M175 166v49" stroke="#fffcf4" strokeWidth="1.4"/><path d="M165 134c4-8 17-10 24-2" stroke="#fffdf5"/></g>
    </g></g>
    <g className="archive-clip" transform="rotate(9 161 55)"><path d="M158 24v48c0 12 19 12 19 0V36c0-18-30-18-30 0v33" stroke="#93928d" strokeWidth="4" strokeLinecap="round"/><path d="M157 23v48c0 12 19 12 19 0V35c0-18-30-18-30 0v33" stroke="#f9f6ee" strokeWidth="1.7" strokeLinecap="round"/></g>
  </svg>;
}

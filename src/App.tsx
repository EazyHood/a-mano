import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Box, Check, ChevronRight, CircleHelp, DoorOpen, FolderHeart, Grid2X2, Heart, Home, Laptop, MapPin, Pencil, Plus, Search, ShieldCheck, ScanLine, Tag, Trash2, Utensils, X, AlertCircle, LoaderCircle, PackageOpen, SlidersHorizontal } from 'lucide-react';
import { demoItems, rooms, categories, loadItems, saveItems, exportItems, importItems, lexicalSearch, makeItem } from './domain';
import type { Item, RoomId, Category } from './domain';
import { useSemanticSearch } from './useSemanticSearch';
import { mergeSearch } from './searchRanking';
import { ObjectArt, ShelfArt } from './components/ObjectArt';
import '@fontsource-variable/archivo';
import './styles.css';
import './catalogue.css';

type View = 'all' | 'favorites' | RoomId;
type Modal = { type: 'detail' | 'edit' | 'delete'; id: string } | { type: 'add' | 'info' | 'backup' | 'import' } | null;
const roomIcons = { entrada: DoorOpen, estudio: Laptop, cocina: Utensils, armario: FolderHeart, trastero: Box };
const dateLabel = (value: string) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación. Inténtalo otra vez.';
function initialCollection() { try { return { items: loadItems(), error: '' }; } catch (error) { return { items: null, error: messageOf(error) }; } }

export default function App() {
  const [initial] = useState(initialCollection);
  const [personal, setPersonal] = useState<Item[]>(initial.items ?? []);
  const [created, setCreated] = useState(initial.items !== null);
  const [demo, setDemo] = useState<Item[]>(demoItems);
  const [mode, setMode] = useState<'demo' | 'personal'>(initial.items === null ? 'demo' : 'personal');
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const [modal, setModal] = useState<Modal>(null);
  const [pendingImport, setPendingImport] = useState<Item[] | null>(null);
  const [importName, setImportName] = useState('');
  const [error, setError] = useState(initial.error);
  const [storageBlocked, setStorageBlocked] = useState(Boolean(initial.error));
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [fileBusy, setFileBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const cardPositions = useRef(new Map<string, { x: number; y: number }>());
  const closingDialog = useRef(false);
  const items = mode === 'demo' ? demo : personal;
  const semantic = useSemanticSearch(items, query);
  const isOpen = modal !== null;
  const selected = modal && 'id' in modal ? items.find(item => item.id === modal.id) : undefined;
  const semanticActive = semantic.status !== 'idle' && semantic.status !== 'error';
  const semanticResults = query.trim() && (semantic.status === 'ready' || semantic.status === 'searching') && semantic.results !== null;

  useEffect(() => { if (isOpen) { if (!dialog.current?.open) dialog.current?.showModal(); } else if (dialog.current?.open) dialog.current.close(); }, [isOpen]);
  useEffect(() => { setFormError(''); if (modal?.type === 'add' || modal?.type === 'edit') requestAnimationFrame(() => dialog.current?.querySelector<HTMLInputElement>('#object-title')?.focus()); }, [modal]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 5200); return () => clearTimeout(timeout); }, [notice]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !dialog.current?.open) { event.preventDefault(); searchInput.current?.focus(); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);

  const shown = useMemo(() => {
    const matches: { id: string; score: number }[] | null = query.trim() ? (semanticResults ? mergeSearch(items, query, semantic.results!) : lexicalSearch(items, query)) : null;
    const ranks = matches ? new Map(matches.map((match, index) => [match.id, index])) : null;
    return items.filter(item => (view === 'all' || (view === 'favorites' ? item.favorite : item.room === view)) && (category === 'all' || item.category === category) && (!ranks || ranks.has(item.id)))
      .sort((a, b) => ranks ? ranks.get(a.id)! - ranks.get(b.id)! : sort === 'name' ? a.title.localeCompare(b.title, 'es') : b.updatedAt.localeCompare(a.updatedAt));
  }, [items, query, semanticResults, semantic.results, view, category, sort]);
  const currentTitle = view === 'all' ? 'Tu colección' : view === 'favorites' ? 'Tus favoritos' : rooms.find(room => room.id === view)?.label ?? 'Tu colección';

  // Preserve the spatial relationship of cards when filters or sorting change.
  useLayoutEffect(() => {
    const cards = [...(grid.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [])];
    const positions = new Map<string, { x: number; y: number }>();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const card of cards) {
      const id = card.dataset.cardId!;
      card.getAnimations().forEach(animation => animation.cancel());
      const rect = card.getBoundingClientRect();
      const next = { x: rect.x + window.scrollX, y: rect.y + window.scrollY };
      const previous = cardPositions.current.get(id);
      positions.set(id, next);
      if (reduced) continue;
      if (previous && (Math.abs(previous.x - next.x) > 1 || Math.abs(previous.y - next.y) > 1)) {
        card.animate([{ transform: `translate(${previous.x - next.x}px, ${previous.y - next.y}px)` }, { transform: 'translate(0, 0)' }], { duration: 350, easing: 'cubic-bezier(.22,1,.36,1)' });
      } else if (!previous) {
        card.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    }
    cardPositions.current = positions;
  }, [shown]);

  function closeModal() {
    if (closingDialog.current) return;
    if (!dialog.current?.open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setModal(null); return; }
    closingDialog.current = true;
    const animation = dialog.current.animate([{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(10px) scale(.99)' }], { duration: 150, easing: 'cubic-bezier(.4,0,1,1)' });
    void animation.finished.catch(() => undefined).then(() => { closingDialog.current = false; setModal(null); });
  }

  function changeView(next: View) { setView(next); setCategory('all'); }
  function persist(next: Item[], success = 'Cambios guardados.') {
    try {
      if (mode === 'personal') { if (storageBlocked) throw new Error('No se ha reemplazado la colección que no pudimos leer. Restaura una copia válida antes de guardar.'); saveItems(next); setPersonal(next); setCreated(true); }
      else setDemo(next);
      setError(''); setNotice(mode === 'demo' ? 'Demo actualizada solo para esta sesión.' : success); return true;
    } catch (e) { const message = messageOf(e); setError(message); setFormError(message); return false; }
  }
  function usePersonal() {
    if (storageBlocked) { setModal({ type: 'backup' }); setNotice('Restaura una copia válida para recuperar Mis cosas. La colección anterior no se ha reemplazado.'); return; }
    try { if (!created) { saveItems(personal); setCreated(true); } setMode('personal'); setView('all'); setQuery(''); setCategory('all'); setError(''); }
    catch (e) { setError(messageOf(e)); }
  }
  function favorite(item: Item) { persist(items.map(candidate => candidate.id === item.id ? { ...candidate, favorite: !candidate.favorite, updatedAt: new Date().toISOString() } : candidate), item.favorite ? 'Objeto retirado de favoritos.' : 'Objeto guardado en favoritos.'); }
  function saveObject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const input = { title: String(data.get('title')).trim(), category: data.get('category') as Category, room: data.get('room') as RoomId, place: String(data.get('place')).trim(), description: String(data.get('description')).trim(), tags: String(data.get('tags')).split(',').map(tag => tag.trim()).filter(Boolean), favorite: selected?.favorite ?? false };
      if (!input.title || !input.place) { setFormError('Escribe un nombre y el lugar donde lo guardaste.'); return; }
      if (input.tags.length > 20) { setFormError('Usa hasta 20 palabras o frases, separadas por comas.'); return; }
      const item = makeItem(input);
      const next = selected && modal?.type === 'edit' ? items.map(candidate => candidate.id === selected.id ? { ...item, id: selected.id } : candidate) : [item, ...items];
      if (persist(next, selected ? 'La ficha ya está actualizada.' : 'Un objeto más, a mano.')) closeModal();
    } catch (e) { setFormError(messageOf(e)); }
  }
  function download() {
    try {
      const data = exportItems(items); const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `a-mano-${mode === 'demo' ? 'ejemplos-' : ''}${new Date().toISOString().slice(0, 10)}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Copia preparada para descargar. Guárdala en un lugar privado.');
    } catch (e) { setFormError(messageOf(e)); }
  }
  async function readImport(file: File | undefined) {
    if (!file) return; setFileBusy(true); setFormError('');
    try { if (file.size > 2 * 1024 * 1024) throw new Error('El archivo supera 2 MB. Elige una copia de A mano de menor tamaño.'); const incoming = importItems(await file.text()); setPendingImport(incoming); setImportName(file.name); setModal({ type: 'import' }); }
    catch (e) { setFormError(messageOf(e)); } finally { setFileBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  function confirmImport() {
    if (!pendingImport) return;
    try { saveItems(pendingImport); setStorageBlocked(false); setPersonal(pendingImport); setCreated(true); setMode('personal'); setView('all'); setCategory('all'); setQuery(''); setPendingImport(null); setError(''); setNotice('Copia restaurada en Mis cosas.'); closeModal(); }
    catch (e) { setFormError(messageOf(e)); }
  }
  const icon = (Component: typeof Home) => <Component size={19} strokeWidth={1.65} aria-hidden="true" />;

  return <div className="app-shell">
    <a className="skip-link" href="#main">Ir a mi colección</a>
    <aside className="sidebar" aria-label="Navegación principal">
      <a href="#main" className="brand" onClick={() => changeView('all')} aria-label="A mano, inicio"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 25V9a4 4 0 0 1 4-4h16v16a4 4 0 0 1-4 4H5Z"/><path d="M11 13h8M11 18h5"/></svg></span><span>a mano<span className="brand-dot">/</span></span></a>
      <p className="brand-note">El archivo de tus cosas.</p>
      <div className="collection-switch" aria-label="Elegir colección"><button className={mode === 'personal' ? 'active' : ''} onClick={usePersonal} aria-pressed={mode === 'personal'}>Mis cosas</button><button className={mode === 'demo' ? 'active' : ''} onClick={() => { setMode('demo'); changeView('all'); setQuery(''); }} aria-pressed={mode === 'demo'}>Explorar demo</button></div>
      <nav className="main-nav" aria-label="Filtrar colección">
        <button className={`nav-item ${view === 'all' ? 'selected' : ''}`} onClick={() => changeView('all')} aria-current={view === 'all' ? 'page' : undefined}>{icon(Grid2X2)}<span>Todos los objetos</span><span className="nav-count">{items.length}</span></button>
        <button className={`nav-item ${view === 'favorites' ? 'selected' : ''}`} onClick={() => changeView('favorites')} aria-current={view === 'favorites' ? 'page' : undefined}>{icon(Heart)}<span>Favoritos</span><span className="nav-count">{items.filter(item => item.favorite).length}</span></button>
        <p className="nav-caption">LOS ESPACIOS</p>
        <div className="room-nav">{rooms.map(room => { const Icon = roomIcons[room.id]; return <button className={`nav-item ${view === room.id ? 'selected' : ''}`} key={room.id} onClick={() => changeView(room.id)} aria-current={view === room.id ? 'page' : undefined}>{icon(Icon)}<span>{room.label}</span><span className="room-dot">{String(items.filter(item => item.room === room.id).length).padStart(2, '0')}</span></button>; })}</div>
      </nav>
      <div className="sidebar-bottom"><div className="local-note"><ShieldCheck size={20} strokeWidth={1.5} aria-hidden="true"/><div><strong>Tu casa. Tus datos.</strong><p>Tu colección se guarda en este navegador.</p></div></div><button className="nav-item utility" onClick={() => setModal({ type: 'backup' })}>{icon(ArrowDownToLine)}<span>Copias de seguridad</span></button><button className="nav-item utility" onClick={() => setModal({ type: 'info' })}>{icon(CircleHelp)}<span>Cómo funciona</span></button><span className="sidebar-signature"><span className="status-dot"/> Guardado en este dispositivo</span></div>
    </aside>

    <main id="main" className="main-content">
      <header className="topbar"><div className="breadcrumb"><Home size={15} aria-hidden="true"/><span>{mode === 'demo' ? 'Una casa de ejemplo' : 'Mi casa'}</span><ChevronRight size={13} aria-hidden="true"/><strong>{view === 'all' ? 'Todos los objetos' : view === 'favorites' ? 'Favoritos' : rooms.find(room => room.id === view)?.label}</strong></div><div className="toolbar-actions"><button className="top-backup icon-button" aria-label="Copias de seguridad" onClick={() => setModal({ type: 'backup' })}><ArrowDownToLine size={17}/></button><button className="primary-button top-add" onClick={() => setModal({ type: 'add' })}><Plus size={18} aria-hidden="true"/><span>Añadir objeto</span></button></div></header>
      {error && <div className="error-banner" role="alert"><AlertCircle size={19}/><span>{error} Tus cambios anteriores no se han reemplazado.</span><button aria-label="Cerrar aviso" onClick={() => setError('')}><X size={18}/></button></div>}
      <section className="welcome" aria-labelledby="welcome-title"><div className="welcome-copy"><span className="eyebrow"><span className="index-mark">AM / 01</span> MEMORIA PARA LO COTIDIANO</span><h1 id="welcome-title">¿Dónde lo<br/><span>guardé?<svg className="title-stroke" viewBox="0 0 350 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12C84 2 216 3 344 9"/></svg></span></h1><p>Anota dónde está. Encuéntralo cuando lo necesites.</p></div><div className="welcome-object"><ShelfArt/><span className="art-caption"><span>OBJETOS, NO OLVIDOS.</span><span>↓</span></span></div></section>
      <section className="search-section" aria-labelledby="search-label"><label id="search-label" htmlFor="object-search" className="search-label">¿Qué estás buscando?</label><div className="search-box"><Search size={23} strokeWidth={1.6} aria-hidden="true"/><input id="object-search" type="search" ref={searchInput} value={query} onChange={event => setQuery(event.target.value)} maxLength={240} placeholder="Un nombre, una pista o para qué lo usas…" autoComplete="off" spellCheck={false}/>{query ? <button className="search-clear" aria-label="Borrar búsqueda" onClick={() => { setQuery(''); searchInput.current?.focus(); }}><X size={19}/></button> : <kbd aria-hidden="true">Ctrl K</kbd>}</div>
        <div className="search-bottom"><p>{semanticActive ? <><ScanLine size={14} aria-hidden="true"/> Búsqueda por significado, en tu dispositivo</> : <><Search size={14} aria-hidden="true"/> Busca por palabras, lugares o etiquetas</>}</p><button className="text-button" onClick={() => setModal({ type: 'info' })}>¿Y si no recuerdo el nombre? <ArrowRight size={14}/></button></div>
        {mode === 'demo' && !query && <div className="search-examples"><span>Prueba con</span>{['cable', 'viaje', 'herramientas'].map(example => <button key={example} onClick={() => setQuery(example)}>{example}<ArrowRight size={13}/></button>)}</div>}
      </section>

      <section className={`semantic-panel ${semanticActive ? 'is-active' : ''}`} aria-label="Búsqueda por significado"><div className="semantic-icon" aria-hidden="true"><span/><span/><span/></div><div className="semantic-copy"><strong>{semantic.status === 'loading' ? 'Preparando la búsqueda por significado' : semantic.status === 'indexing' ? 'Leyendo las pistas de tus objetos' : semantic.status === 'searching' ? 'Buscando entre tus pistas…' : semantic.status === 'ready' ? 'También entiende cómo lo describes' : semantic.status === 'error' ? 'La búsqueda por significado no está disponible' : 'Encuentra por su uso, aunque olvides el nombre.'}</strong><p>{semantic.status === 'loading' ? 'Descarga inicial del modelo. Puedes seguir buscando por palabras.' : semantic.status === 'indexing' ? 'El modelo prepara el índice dentro de este dispositivo.' : semantic.status === 'ready' || semantic.status === 'searching' ? 'Te sugiere fichas guardadas. La ubicación siempre es la que anotaste.' : semantic.status === 'error' ? `${semantic.error ?? 'La descarga o preparación no pudo terminar.'} La búsqueda por palabras sigue funcionando.` : 'Modelo local opcional · descarga inicial de unos 160 MB · sin cuenta.'}</p>{(semantic.status === 'loading' || semantic.status === 'indexing') && <div className="progress-track" role="progressbar" aria-label="Preparación del modelo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={semantic.progress ?? undefined}><span className={semantic.progress === null ? 'indeterminate' : ''} style={{ width: semantic.progress === null ? '30%' : `${Math.max(0, Math.min(100, semantic.progress))}%` }}/></div>}</div>{semanticActive ? <button className="secondary-button compact" onClick={semantic.disable}>{semantic.status === 'loading' || semantic.status === 'indexing' ? 'Cancelar' : 'Desactivar'}</button> : <button className="secondary-button compact" onClick={semantic.enable}>{semantic.status === 'error' ? 'Reintentar' : 'Activar'}<ArrowRight size={15}/></button>}</section>

      <section className="collection-section" aria-labelledby="collection-title"><div className="collection-heading"><div><span className="eyebrow">{query.trim() ? 'LO QUE COINCIDE' : mode === 'demo' ? 'ARCHIVO DE EJEMPLO' : 'ARCHIVO PERSONAL'}</span><h2 id="collection-title">{query.trim() ? `Resultados de búsqueda` : currentTitle}<span className="count-badge">{shown.length}</span></h2></div><label className="sort-control"><span className="sr-only">Ordenar objetos</span><SlidersHorizontal size={15} aria-hidden="true"/><select value={sort} onChange={event => setSort(event.target.value as 'recent' | 'name')} disabled={Boolean(query.trim())}><option value="recent">Más recientes</option><option value="name">Nombre A–Z</option></select></label></div>
        <div className="category-filter" aria-label="Filtrar por categoría"><button className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todo</button>{categories.map(option => <button key={option.id} className={category === option.id ? 'active' : ''} aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}</div>
        {query.trim() && <p className="results-explanation" role="status">{semanticResults ? 'Coincidencias por palabras y sugerencias por significado. Abre una ficha para comprobar si es lo que buscas.' : semantic.status === 'loading' || semantic.status === 'indexing' || semantic.status === 'searching' ? 'Mostrando coincidencias por palabras mientras se prepara el modelo.' : `Coincidencias por palabras para «${query.trim()}».`}</p>}
        {shown.length ? <div className="object-grid" ref={grid}>{shown.map((item, index) => <article className={`object-card art-${item.category}`} key={item.id} data-card-id={item.id} style={{ '--card-delay': `${Math.min(index, 5) * 35}ms` } as CSSProperties}><div className="card-visual"><span className="card-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><button className="card-open-art" onClick={() => setModal({ type: 'detail', id: item.id })} aria-label={`Ver ${item.title}`}><ObjectArt item={item}/></button><span className="room-pill"><MapPin size={11} aria-hidden="true"/>{rooms.find(room => room.id === item.room)?.label}</span><button className={`favorite-button ${item.favorite ? 'is-favorite' : ''}`} onClick={() => favorite(item)} aria-label={`${item.favorite ? 'Quitar de' : 'Añadir a'} favoritos: ${item.title}`} aria-pressed={item.favorite}><Heart size={17} strokeWidth={1.7} fill={item.favorite ? 'currentColor' : 'none'}/></button></div><div className="card-body"><span className="card-category">{categories.find(option => option.id === item.category)?.label}</span><button className="card-title" onClick={() => setModal({ type: 'detail', id: item.id })}>{item.title}<ArrowRight size={17} aria-hidden="true"/></button><p className="card-place"><MapPin size={14} aria-hidden="true"/><span>{item.place}</span></p><div className="card-bottom"><span>{item.tags[0] ? `#${item.tags[0]}` : 'Una pista guardada'}</span><button aria-label={`Editar ${item.title}`} onClick={() => setModal({ type: 'edit', id: item.id })}><Pencil size={14}/></button></div></div></article>)}</div> : <div className="empty-state"><span className="empty-icon"><PackageOpen size={37} strokeWidth={1.3}/></span><h3>{query ? 'Aún no aparece por aquí.' : view === 'favorites' ? 'Tus favoritos tienen un lugar.' : 'Todo empieza con una pequeña cosa.'}</h3><p>{query ? 'Prueba otra palabra o mira en todos los espacios. Solo podemos encontrar objetos que hayas anotado.' : view === 'favorites' ? 'Toca el corazón de una ficha para tenerla más cerca.' : 'Guarda qué es, dónde lo dejaste y una pista para encontrarlo después.'}</p>{query || view !== 'all' || category !== 'all' ? <button className="secondary-button" onClick={() => { setQuery(''); changeView('all'); }}>Ver todos los objetos <ArrowRight size={16}/></button> : <button className="primary-button" onClick={() => setModal({ type: 'add' })}><Plus size={17}/>Guardar mi primer objeto</button>}</div>}
      </section>
      {mode === 'demo' && <section className="demo-banner"><div><span className="demo-badge">DEMO</span><p><strong>Una casa inventada, para que explores.</strong><span>Los objetos son ficticios. Tus cambios aquí duran esta sesión.</span></p></div><button className="text-button" onClick={usePersonal}>{created ? 'Volver a mis cosas' : 'Empezar mi colección'}<ArrowRight size={17}/></button></section>}
      <footer className="page-footer"><span><span className="footer-mark" aria-hidden="true">a/</span> Una cosa menos que recordar.</span><button onClick={() => setModal({ type: 'info' })}>Privacidad y límites <ArrowRight size={13}/></button></footer>
    </main>

    {notice && <div className="toast" role="status"><Check size={18} aria-hidden="true"/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Cerrar confirmación"><X size={16}/></button></div>}
    <dialog ref={dialog} className={`app-dialog ${modal?.type === 'detail' ? 'detail-dialog' : ''}`} onCancel={event => { event.preventDefault(); closeModal(); }} onClose={() => setModal(null)} aria-labelledby="dialog-title"><button className="dialog-close" aria-label="Cerrar diálogo" onClick={closeModal}><X size={21}/></button>
      {modal?.type === 'detail' && selected && <><div className={`detail-art art-${selected.category}`}><ObjectArt item={selected} hero/><span className="room-pill"><MapPin size={12}/>{rooms.find(room => room.id === selected.room)?.label}</span></div><div className="dialog-content"><span className="eyebrow">{categories.find(option => option.id === selected.category)?.label}</span><h2 id="dialog-title">{selected.title}</h2><div className="location-note"><MapPin size={22} strokeWidth={1.6}/><div><span>DÓNDE LO GUARDASTE</span><strong>{selected.place}</strong><p>{rooms.find(room => room.id === selected.room)?.label}</p></div></div>{selected.description && <div className="detail-description"><h3>Una pista para recordarlo</h3><p>{selected.description}</p></div>}{selected.tags.length > 0 && <div className="detail-tags">{selected.tags.map((tag, index) => <span key={`${tag}-${index}`}><Tag size={12}/>{tag}</span>)}</div>}<p className="detail-date">Anotado el {dateLabel(selected.updatedAt)}. La ubicación refleja esta ficha; no rastreamos el objeto.</p><div className="dialog-actions"><button className="primary-button" onClick={() => setModal({ type: 'edit', id: selected.id })}><Pencil size={16}/>Editar ficha</button><button className="secondary-button" onClick={() => favorite(selected)}><Heart size={16} fill={selected.favorite ? 'currentColor' : 'none'}/>{selected.favorite ? 'Favorito' : 'Guardar favorito'}</button><button className="icon-button danger-quiet" aria-label={`Eliminar ${selected.title}`} onClick={() => setModal({ type: 'delete', id: selected.id })}><Trash2 size={18}/></button></div></div></>}
      {(modal?.type === 'add' || modal?.type === 'edit') && <div className="dialog-content"><span className="eyebrow">{mode === 'demo' ? 'FICHA DE EJEMPLO · SOLO ESTA SESIÓN' : 'UN LUGAR DONDE VOLVER A BUSCAR'}</span><h2 id="dialog-title">{modal.type === 'edit' ? 'Que no se te pierda la pista.' : 'Una cosa más, a mano.'}</h2><p className="dialog-intro">Anota el lugar con tus palabras. Es la ubicación que verás cuando lo busques.</p><form onSubmit={saveObject} key={modal.type === 'edit' ? selected?.id : 'new'}><label className="field">¿Qué objeto es? <span className="required">(obligatorio)</span><input id="object-title" name="title" required maxLength={120} autoComplete="off" placeholder="Por ejemplo, adaptador de la pantalla" defaultValue={modal.type === 'edit' ? selected?.title : ''}/></label><div className="form-row"><label className="field">Espacio<select name="room" defaultValue={selected?.room ?? (rooms.some(room => room.id === view) ? view : 'estudio')}>{rooms.map(room => <option value={room.id} key={room.id}>{room.label}</option>)}</select></label><label className="field">Categoría<select name="category" defaultValue={selected?.category ?? 'hogar'}>{categories.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label></div><label className="field">¿Dónde lo guardaste? <span className="required">(obligatorio)</span><input name="place" required maxLength={160} autoComplete="off" placeholder="Cajón de arriba, dentro de la caja verde" defaultValue={selected?.place}/></label><label className="field">Una pista o para qué lo usas<textarea name="description" rows={3} maxLength={1200} placeholder="Conecta el portátil al televisor. Es pequeño y blanco." defaultValue={selected?.description}/><span className="field-hint">Una descripción concreta ayuda a encontrarlo sin recordar su nombre.</span></label><label className="field">Otras palabras para encontrarlo<input name="tags" maxLength={1240} autoComplete="off" placeholder="pantalla, portátil, viaje" defaultValue={selected?.tags.join(', ')}/><span className="field-hint">Opcional. Hasta 20 pistas separadas por comas.</span></label>{formError && <p className="form-error" role="alert"><AlertCircle size={17}/>{formError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" type="submit"><Check size={17}/>Guardar objeto</button></div></form></div>}
      {modal?.type === 'delete' && selected && <div className="dialog-content"><span className="dialog-feature-icon"><Trash2 size={25}/></span><h2 id="dialog-title">¿Borrar esta ficha?</h2><p className="dialog-intro">«{selected.title}» dejará de aparecer en {mode === 'demo' ? 'esta demo' : 'tu colección'}. Esta acción no se puede deshacer.</p>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={() => setModal({ type: 'detail', id: selected.id })}>Conservar</button><button className="danger-button" onClick={() => { if (persist(items.filter(item => item.id !== selected.id), 'Ficha eliminada.')) closeModal(); }}>Sí, borrar ficha</button></div></div>}
      {modal?.type === 'backup' && <div className="dialog-content"><span className="dialog-feature-icon"><ArrowDownToLine size={26}/></span><h2 id="dialog-title">Llévate tus pistas.</h2><p className="dialog-intro">Una copia guarda tus fichas en un archivo JSON. Puedes restaurarlo aquí o en otro navegador.</p><div className="backup-options"><button onClick={download}><ArrowDownToLine size={23}/><span><strong>Descargar {mode === 'demo' ? 'los ejemplos' : 'mi colección'}</strong><small>{items.length} fichas · archivo JSON</small></span><ArrowRight size={17}/></button><button onClick={() => fileInput.current?.click()} disabled={fileBusy}><ArrowUpFromLine size={23}/><span><strong>{fileBusy ? 'Leyendo archivo…' : 'Restaurar una copia'}</strong><small>Revisar antes de reemplazar Mis cosas</small></span>{fileBusy ? <LoaderCircle className="spinning" size={18}/> : <ArrowRight size={17}/>}</button></div><input ref={fileInput} className="sr-only" type="file" accept=".json,application/json" aria-label="Archivo de copia de seguridad" onChange={event => void readImport(event.target.files?.[0])}/><p className="privacy-footnote"><ShieldCheck size={17}/>La copia no está cifrada. Guárdala con cuidado: contiene las descripciones y ubicaciones que anotaste.</p>{formError && <p className="form-error" role="alert"><AlertCircle size={18}/>{formError}</p>}</div>}
      {modal?.type === 'import' && pendingImport && <div className="dialog-content"><span className="dialog-feature-icon"><ArrowUpFromLine size={25}/></span><h2 id="dialog-title">Tu copia está lista.</h2><p className="dialog-intro"><strong>{importName}</strong> contiene {pendingImport.length} fichas válidas. Al restaurarla, reemplazarás las {personal.length} fichas actuales de Mis cosas. La demo no cambia.</p><p className="import-warning">Si quieres conservar tu colección actual, vuelve y descarga una copia antes de continuar.</p>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={() => { setModal({ type: 'backup' }); setPendingImport(null); }}>Volver</button><button className="primary-button" onClick={confirmImport}>Reemplazar y restaurar</button></div></div>}
      {modal?.type === 'info' && <div className="dialog-content info-content"><span className="dialog-feature-icon"><ScanLine size={27}/></span><h2 id="dialog-title">Una buena pista cambia todo.</h2><p className="dialog-intro">A mano es una pequeña memoria de las cosas que guardas. Tú anotas dónde están; la búsqueda te ayuda a volver a esa ficha.</p><ol className="how-steps"><li><span>01</span><div><h3>Guarda algo concreto</h3><p>Su nombre, el lugar y una descripción que te resulte familiar.</p></div></li><li><span>02</span><div><h3>Busca como lo recuerdes</h3><p>Las palabras funcionan al instante. El modelo abierto opcional también relaciona descripciones parecidas.</p></div></li><li><span>03</span><div><h3>Vuelve al lugar que anotaste</h3><p>Revisa la ficha y actualízala cuando muevas el objeto. No usamos sensores ni inventamos ubicaciones.</p></div></li></ol><div className="info-privacy"><h3><ShieldCheck size={19}/>Qué se queda en tu dispositivo</h3><p>Las fichas de Mis cosas se guardan en este navegador. Borrar sus datos puede eliminarlas: descarga una copia. No hay cuenta ni sincronización entre dispositivos.</p><p>La búsqueda por significado descarga un modelo abierto al activarla (unos 160 MB). Los textos se procesan localmente; abrir la web y descargar sus archivos requiere conexión. El modelo puede sugerir fichas equivocadas y no garantiza resultados.</p><p>Las ilustraciones son decorativas, no fotografías de tus objetos. La demo contiene datos ficticios.</p></div><button className="primary-button" onClick={closeModal}>Entendido <Check size={17}/></button></div>}
    </dialog>
  </div>;
}

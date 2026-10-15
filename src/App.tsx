import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { birthdayConfig } from "./config/birthdayConfig";
import { useCountdown } from "./hooks/useCountdown";
import { validateBirthdayConfig } from "./lib/validateConfig";

type SceneId = "cinema" | "reveal" | "introduction" | "gallery" | "universe";
type GalleryPhoto = (typeof birthdayConfig.gallery.photos)[number];
type AlbumPage = (typeof birthdayConfig.scrapbook.pages)[number];
type SelectedPhoto = { src: string; alt: string; caption: string };
type RibbonPoint = { x: number; y: number; angle: number };
type SceneItem = { id: SceneId; label: string; enabled: boolean };

function isEmptyList(items: readonly unknown[]): boolean {
  return items.length === 0;
}

const sceneItems: SceneItem[] = [
  { id: "cinema", label: birthdayConfig.navigation.cinema, enabled: birthdayConfig.cinema.enabled },
  { id: "reveal", label: birthdayConfig.navigation.reveal, enabled: birthdayConfig.reveal.enabled },
  { id: "introduction", label: birthdayConfig.navigation.introduction, enabled: birthdayConfig.introduction.enabled },
  { id: "gallery", label: birthdayConfig.navigation.gallery, enabled: birthdayConfig.gallery.enabled },
  { id: "universe", label: birthdayConfig.navigation.universe, enabled: birthdayConfig.photoUniverse.enabled },
];

const validationWarnings = validateBirthdayConfig();
if (import.meta.env.DEV) validationWarnings.forEach((warning) => console.warn("Birthday template: " + warning));

function birthdayDateLabels() {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dateParts = birthdayConfig.recipient.birthdayDate.split("-").map(Number);
  const month = months[dateParts[1] - 1];
  const day = dateParts[2];
  if (!month || !Number.isFinite(day)) return { short: "DATE TBD", long: "DATE TBD" };
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  return { short: month + " " + day, long: month + " " + day + suffix };
}

function productionLabel() {
  return [birthdayConfig.cinema.productionLead, birthdayConfig.recipient.nickname, birthdayConfig.cinema.productionSuffix].filter(Boolean).join(" ");
}

function firstEnabledScene(): SceneId {
  return sceneItems.find((scene) => scene.enabled)?.id ?? "reveal";
}

function adjacentEnabledScene(current: SceneId, direction: 1 | -1 = 1): SceneId {
  const available = sceneItems.filter((item) => item.enabled);
  if (available.length === 0) return current;
  const currentIndex = available.findIndex((item) => item.id === current);
  const start = currentIndex < 0 ? 0 : currentIndex;
  return available[(start + direction + available.length) % available.length].id;
}

function PhotoMedia({ src, alt, variant = 0, className = "" }: { src: string; alt: string; variant?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const tone = Math.abs(variant) % 8;

  if (failed) {
    return (
      <div className={"photo-fallback photo-fallback--" + tone + " " + className} role="img" aria-label={alt}>
        <span className="photo-fallback__sun" aria-hidden="true" />
        <span className="photo-fallback__horizon" aria-hidden="true" />
        <span className="photo-fallback__label">{birthdayConfig.preferences.missingPhotoLabel}</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (import.meta.env.DEV) console.warn("Birthday template: photo not found at " + src + ". Add the file or update birthdayConfig.ts.");
        setFailed(true);
      }}
    />
  );
}

function SceneNavigation({ current, onChange }: { current: SceneId; onChange: (scene: SceneId) => void }) {
  const available = sceneItems.filter((scene) => scene.enabled);
  if (available.length < 2) return null;
  return (
    <nav className="scene-navigation" aria-label="Birthday experience scenes">
      <span className="scene-navigation__mark" aria-hidden="true">✦</span>
      {available.map((scene, index) => (
        <button
          key={scene.id}
          type="button"
          className={"scene-navigation__item" + (current === scene.id ? " is-current" : "")}
          aria-current={current === scene.id ? "page" : undefined}
          onClick={() => onChange(scene.id)}
        >
          <span className="scene-navigation__number">0{index + 1}</span>
          <span>{scene.label}</span>
        </button>
      ))}
    </nav>
  );
}

function CinemaScene({ countdown, onPreview }: { countdown: ReturnType<typeof useCountdown>; onPreview: () => void }) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    <section className="scene cinema-scene" aria-labelledby="cinema-heading">
      <div className="cinema-curtain" aria-hidden="true" />
      <div className="film-rail film-rail--left" aria-hidden="true" />
      <div className="film-rail film-rail--right" aria-hidden="true" />
      <div className="cinema-frame" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span><span>✦</span></div>
      <div className="cinema-banner" aria-hidden="true">
        <span>{birthdayConfig.cinema.topBannerText} · {birthdayDateLabels().short} · </span>
        <span>{birthdayConfig.cinema.topBannerText} · {birthdayDateLabels().short} · </span>
        <span>{birthdayConfig.cinema.topBannerText} · {birthdayDateLabels().short} · </span>
      </div>
      <div className="cinema-topline">
        <span className="cinema-topline__production">{productionLabel()}</span>
        <button className="preview-button" type="button" onClick={onPreview}>{birthdayConfig.cinema.previewButtonText}<span aria-hidden="true"> ↗</span></button>
      </div>

      <div className="cinema-content">
        <div className="cinema-kicker"><i aria-hidden="true">✦</i><span>THE BIRTHDAY PREMIERE</span><i aria-hidden="true">✦</i></div>
        <h1 id="cinema-heading" className="cinema-title">{birthdayConfig.cinema.mainHeading}</h1>
        <p className="cinema-subtitle">{productionLabel()}, {birthdayConfig.cinema.subtitleLead} {birthdayDateLabels().long}</p>

        <div className="countdown" aria-live="polite" aria-atomic="true">
          {countdown.valid ? (
            <>
                <div className="countdown-days" aria-label={countdown.days + " days"}>
                  {pad(countdown.days).split("").map((digit, index) => <div className="number-tile" key={index} style={{ "--digit-index": index } as CSSProperties}><span key={digit + "-" + countdown.days}>{digit}</span></div>)}
                </div>
              <p className="countdown-label">{countdown.complete ? "THE DAY IS HERE" : birthdayConfig.cinema.countdownLabel}</p>
              <div className="countdown-small" aria-label={pad(countdown.hours) + " hours, " + pad(countdown.minutes) + " minutes, " + pad(countdown.seconds) + " seconds"}>
                {[{ label: "HRS", value: countdown.hours }, { label: "MIN", value: countdown.minutes }, { label: "SEC", value: countdown.seconds }].map((unit, index) => (
                  <div className="countdown-unit" key={unit.label} style={{ "--unit-index": index } as CSSProperties}><strong key={unit.value}>{pad(unit.value)}</strong><span>{unit.label}</span></div>
                ))}
              </div>
            </>
          ) : (
            <div className="countdown-setup"><span>SET YOUR BIRTHDAY DATE</span><small>Update the recipient date and time in the configuration file.</small></div>
          )}
        </div>
        <p className="cinema-footer">{birthdayConfig.cinema.footerText}</p>
        <button type="button" className="cinema-enter" onClick={onPreview}>STEP INSIDE <span aria-hidden="true">↓</span></button>
      </div>
      <div className="cinema-bottom-note"><span>VOL. 01</span><span>{birthdayConfig.recipient.name.toUpperCase()} · A STORY IN SIX SCENES</span><span>EST. WITH LOVE</span></div>
    </section>
  );
}

function RevealScene({ onContinue }: { onContinue: () => void }) {
  const [heroFailed, setHeroFailed] = useState(false);
  const balloons = birthdayConfig.reveal.balloons;
  return (
    <section className="scene reveal-scene" aria-labelledby="reveal-heading">
      {!heroFailed && <img className="reveal-backdrop" src={birthdayConfig.reveal.backgroundImage} alt="" onError={() => {
        if (import.meta.env.DEV) console.warn("Birthday template: hero image not found at " + birthdayConfig.reveal.backgroundImage + ". Add the file or update birthdayConfig.ts.");
        setHeroFailed(true);
      }} />}
      <div className="reveal-backdrop-art" aria-hidden="true" />
      <div className="reveal-vignette" aria-hidden="true" style={{ opacity: birthdayConfig.reveal.backgroundOverlayOpacity }} />
      <div className="reveal-blackout" aria-hidden="true" />
      <div className="balloon-field" aria-hidden="true">
        {balloons.map((color, index) => (
          <span className="balloon" key={color + index} style={{ "--balloon-color": color, "--balloon-index": index } as CSSProperties} />
        ))}
      </div>
      <div className="reveal-copy">
        {birthdayConfig.reveal.displayAge && <div className="reveal-age" aria-hidden="true">{birthdayConfig.recipient.age}</div>}
        <p className="reveal-eyebrow">{productionLabel()} presents</p>
        <h1 id="reveal-heading" className="reveal-title"><span>{birthdayConfig.reveal.headlinePrefix}</span><strong>{birthdayConfig.recipient.name}</strong></h1>
        <p className="reveal-message">{birthdayConfig.reveal.message}</p>
        <button type="button" className="light-cta" onClick={onContinue}>A STORY OF YOU <span aria-hidden="true">↘</span></button>
      </div>
      <p className="reveal-side-note">AN EXTRAORDINARY PERSON<br />A VERY ORDINARY KIND OF MAGIC</p>
    </section>
  );
}

function PhotoRibbon({ onPhotoOpen }: { onPhotoOpen: (photo: SelectedPhoto) => void }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<RibbonPoint[]>([]);
  const photos = birthdayConfig.photoRibbon.photos;
  const path = "M 0 685 C 115 690 240 720 315 655 C 380 600 248 500 270 380 C 286 260 390 180 485 220 C 582 260 550 400 470 422 C 412 435 395 370 435 333 C 490 280 580 370 560 463 C 545 560 620 633 725 575 C 870 495 986 358 1200 260";

  useEffect(() => {
    const shape = pathRef.current;
    if (!shape || isEmptyList(photos)) return;
    const length = shape.getTotalLength();
    const nextPoints = photos.map((_, index) => {
      const distance = ((index + 0.45) / photos.length) * length;
      const point = shape.getPointAtLength(distance);
      const after = shape.getPointAtLength(Math.min(length, distance + 1.5));
      return {
        x: point.x / 12,
        y: point.y / 7.8,
        angle: Math.atan2(after.y - point.y, after.x - point.x) * (180 / Math.PI),
      };
    });
    setPoints(nextPoints);
  }, [photos.length]);

  if (!birthdayConfig.photoRibbon.enabled) return null;
  return (
    <div className={"photo-ribbon" + (birthdayConfig.photoRibbon.grayscale ? " photo-ribbon--mono" : "")} aria-label="A ribbon of favorite photographs">
      <svg className="photo-ribbon__path" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true">
        <path ref={pathRef} d={path} />
      </svg>
      {photos.map((photo, index) => {
        const point = points[index];
        if (!point) return null;
        return (
          <button
            className="ribbon-photo"
            type="button"
            disabled={!birthdayConfig.preferences.enablePhotoLightbox}
            key={photo.id}
            aria-label={"Open photograph: " + photo.alt}
            style={{ left: point.x + "%", top: point.y + "%", transform: "translate(-50%, -50%) rotate(" + point.angle + "deg)", "--ribbon-index": index } as CSSProperties}
            onClick={() => onPhotoOpen({ src: photo.src, alt: photo.alt, caption: photo.alt })}
          >
            <PhotoMedia src={photo.src} alt={photo.alt} variant={index} />
          </button>
        );
      })}
    </div>
  );
}

function IntroductionScene({ onContinue, onPhotoOpen }: { onContinue: () => void; onPhotoOpen: (photo: SelectedPhoto) => void }) {
  return (
    <section className="scene introduction-scene" aria-labelledby="intro-heading">
      <PhotoRibbon onPhotoOpen={onPhotoOpen} />
      <div className="intro-date">{birthdayConfig.introduction.dateLabel}<span> · A LITTLE CELEBRATION</span></div>
      <div className="intro-copy" style={{ "--intro-accent": birthdayConfig.introduction.accentColor } as CSSProperties}>
        <p className="intro-overline">A NOTE FOR {birthdayConfig.recipient.name.toUpperCase()}</p>
        <h1 id="intro-heading" className="intro-heading">
          <span>{birthdayConfig.introduction.headingLine1}</span>
          <strong>{birthdayConfig.introduction.headingLine2}</strong>
          <strong className="intro-heading__accent">{birthdayConfig.recipient.name}</strong>
        </h1>
        <div className="intro-rule" />
        <p className="intro-message">{birthdayConfig.introduction.message}</p>
        <p className="intro-signoff">{birthdayConfig.introduction.footerLabel}</p>
        <button type="button" className="intro-continue" onClick={onContinue}>{birthdayConfig.introduction.continueLabel}<span aria-hidden="true">↘</span></button>
      </div>
      <div className="intro-corner-note" aria-hidden="true">A GALLERY OF<br />FAVORITE THINGS</div>
    </section>
  );
}

function stickerMark(sticker: string): string {
  const marks: Record<string, string> = { heart: "♥", flower: "✿", butterfly: "❋", sparkle: "✦", star: "★" };
  return marks[sticker] ?? "✦";
}

function PolaroidCard({ photo, index, onOpen }: { photo: GalleryPhoto; index: number; onOpen: (photo: SelectedPhoto) => void }) {
  return (
    <button
      type="button"
      className={"polaroid polaroid--" + photo.size}
      disabled={!birthdayConfig.preferences.enablePhotoLightbox}
      style={{ "--photo-rotation": photo.rotation + "deg", "--card-index": index } as CSSProperties}
      onClick={() => onOpen({ src: photo.src, alt: photo.alt, caption: photo.caption })}
      aria-label={"Open " + photo.caption}
    >
      <span className="polaroid__image"><PhotoMedia src={photo.src} alt={photo.alt} variant={index} /></span>
      {photo.sticker && <span className={"polaroid__sticker polaroid__sticker--" + photo.sticker} aria-hidden="true">{stickerMark(photo.sticker)}</span>}
      {birthdayConfig.preferences.showCaptions && <span className="polaroid__caption">{photo.caption}</span>}
    </button>
  );
}

function GalleryScene({ onPhotoOpen, onOpenAlbum, onEnterUniverse }: {
  onPhotoOpen: (photo: SelectedPhoto) => void;
  onOpenAlbum: () => void;
  onEnterUniverse: () => void;
}) {
  return (
    <section className="scene gallery-scene" aria-labelledby="gallery-heading" style={{ "--gallery-paper": birthdayConfig.gallery.backgroundColor } as CSSProperties}>
      <div className="gallery-wash" aria-hidden="true" />
      <div className="gallery-header">
        <p className="gallery-eyebrow">{birthdayConfig.gallery.eyebrow}</p>
        <h1 id="gallery-heading">{birthdayConfig.gallery.title}</h1>
        <p className="gallery-intro">The tiny details, the loud laughs, the days I want to keep close.</p>
        <div className="gallery-actions">
          {birthdayConfig.scrapbook.enabled && <button type="button" className="paper-button" onClick={onOpenAlbum}><span aria-hidden="true">✦</span>{birthdayConfig.gallery.albumButtonText}</button>}
          {birthdayConfig.photoUniverse.enabled && <button type="button" className="paper-button paper-button--dark" onClick={onEnterUniverse}><span aria-hidden="true">↗</span>{birthdayConfig.gallery.universeButtonText}</button>}
        </div>
      </div>
      <div className={"polaroid-board" + (birthdayConfig.gallery.showGrid ? " polaroid-board--grid" : "")}>
        {birthdayConfig.gallery.photos.map((photo, index) => <PolaroidCard key={photo.id} photo={photo} index={index} onOpen={onPhotoOpen} />)}
        {isEmptyList(birthdayConfig.gallery.photos) && <p className="gallery-empty">Add photographs in the gallery section of birthdayConfig.ts.</p>}
      </div>
      <div className="gallery-bottom-note"><span>MEMORIES, COLLECTED WITH LOVE</span><span>{String(birthdayConfig.gallery.photos.length).padStart(2, "0")} PHOTOGRAPHS</span></div>
    </section>
  );
}

function AlbumPageView({ page, pageNumber, onPhotoOpen }: { page: AlbumPage; pageNumber: number; onPhotoOpen: (photo: SelectedPhoto) => void }) {
  return (
    <article className={"album-page album-page--composition-" + (((pageNumber - 1) % 4) + 1)} style={{ backgroundColor: page.paperColor }} aria-label={"Page " + pageNumber + ": " + page.title}>
      <div className="album-page__topline"><span>OUR LITTLE SCRAPBOOK</span><span>{String(pageNumber).padStart(2, "0")}</span></div>
      <h2>{page.title}</h2>
      <div className="album-page__collage">
        {page.photos.map((photo, index) => (
          <button
            className={"album-photo album-photo--" + (index % 2 + 1)}
            style={{ "--album-rotation": photo.rotation + "deg" } as CSSProperties}
            disabled={!birthdayConfig.preferences.enablePhotoLightbox}
            key={photo.src + index}
            type="button"
            onClick={() => onPhotoOpen({ src: photo.src, alt: photo.alt, caption: photo.caption })}
            aria-label={"Open scrapbook photograph: " + photo.caption}
          >
            <PhotoMedia src={photo.src} alt={photo.alt} variant={pageNumber + index} />
            {birthdayConfig.preferences.showCaptions && <span>{photo.caption}</span>}
          </button>
        ))}
      </div>
      <div className="album-page__notes">
        {page.notes.map((note, index) => <p className={index % 2 === 0 ? "album-note album-note--script" : "album-note"} key={note}>{note}</p>)}
      </div>
      <div className="album-page__stickers" aria-label="Page decorations">
        {page.stickers.map((sticker, index) => <span className="album-sticker" key={sticker + index} aria-hidden="true">{stickerMark(sticker)}</span>)}
      </div>
      <span className="tape tape--top" aria-hidden="true" />
      <span className="tape tape--side" aria-hidden="true" />
    </article>
  );
}

function ScrapbookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pages = birthdayConfig.scrapbook.pages;
  const startIndex = Math.min(Math.max(birthdayConfig.scrapbook.initialPage - 1, 0), Math.max(pages.length - 1, 0));
  const [pageIndex, setPageIndex] = useState(startIndex);
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);
  const rightPage = pages[pageIndex + 1];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open && pages.length > 0) setPageIndex(startIndex);
  }, [open, pages.length, startIndex]);

  if (!birthdayConfig.scrapbook.enabled) return null;
  return (
    <dialog
      className="scrapbook-dialog"
      ref={dialogRef}
      aria-label={birthdayConfig.scrapbook.title}
      onClose={() => { setSelected(null); onOpenChange(false); }}
      onClick={(event) => { if (event.target === dialogRef.current) onOpenChange(false); }}
    >
      <div className="scrapbook-shell">
        <div className="scrapbook-heading"><span className="scrapbook-heading__eyebrow">A FEW PAGES FROM OUR STORY</span><h1>{birthdayConfig.scrapbook.title}</h1></div>
        <button type="button" className="dialog-close" aria-label={birthdayConfig.scrapbook.closeLabel} onClick={() => onOpenChange(false)}>×</button>
        {isEmptyList(pages) ? <p className="album-empty">Add one or more pages to birthdayConfig.ts.</p> : (
          <>
            <div className="album-spread" aria-live="polite">
              <AlbumPageView key={pages[pageIndex].id} page={pages[pageIndex]} pageNumber={pageIndex + 1} onPhotoOpen={setSelected} />
              {rightPage ? <AlbumPageView key={rightPage.id} page={rightPage} pageNumber={pageIndex + 2} onPhotoOpen={setSelected} /> : <div key="blank-page" className="album-page album-page--blank" aria-hidden="true"><span>THE NEXT CHAPTER IS YOURS</span><i>✦</i></div>}
            </div>
            <div className="album-controls">
              <button type="button" className="album-nav-button" onClick={() => setPageIndex((index) => Math.max(0, index - 1))} disabled={pageIndex === 0}><span aria-hidden="true">‹</span> PREV</button>
              <span className="album-page-count">{pageIndex + 1} <i>/</i> {pages.length}</span>
              <button type="button" className="album-nav-button" onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))} disabled={pageIndex >= pages.length - 1}>NEXT <span aria-hidden="true">›</span></button>
            </div>
          </>
        )}
        {selected && (
          <div className="album-photo-viewer" role="dialog" aria-modal="true" aria-label={selected.caption}>
            <button type="button" className="dialog-close album-photo-viewer__close" aria-label="Close photograph" onClick={() => setSelected(null)}>×</button>
            <PhotoMedia src={selected.src} alt={selected.alt} variant={3} />
            <p>{selected.caption}</p>
          </div>
        )}
      </div>
    </dialog>
  );
}

function UniverseScene({ onPhotoOpen, onBack, onReplay }: {
  onPhotoOpen: (photo: SelectedPhoto) => void;
  onBack: () => void;
  onReplay: () => void;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [noteOpen, setNoteOpen] = useState(false);
  const photos = birthdayConfig.photoUniverse.photos;

  function moveCamera(event: PointerEvent<HTMLElement>) {
    if (!birthdayConfig.photoUniverse.movementEnabled || birthdayConfig.preferences.reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: x * 7, y: y * -6 });
  }

  return (
    <section className="scene universe-scene" aria-labelledby="universe-heading" onPointerMove={moveCamera} onPointerLeave={() => setTilt({ x: 0, y: 0 })} style={{ "--universe-bg": birthdayConfig.photoUniverse.backgroundColor } as CSSProperties}>
      {birthdayConfig.photoUniverse.showStars && <div className="universe-stars" aria-hidden="true" />}
      <div className="universe-vignette" aria-hidden="true" />
      <header className="universe-header"><p>THE LAST STOP</p><h1 id="universe-heading">{birthdayConfig.photoUniverse.title}</h1><span>DRIFT THROUGH A FEW FAVORITE MOMENTS</span></header>
      <div className="universe-world" style={{ transform: "perspective(1200px) rotateX(" + tilt.y + "deg) rotateY(" + tilt.x + "deg)" }}>
        {photos.map((photo, index) => (
          <button
            type="button"
            className={"universe-photo" + (birthdayConfig.photoUniverse.autoDrift ? " is-drifting" : "")}
            key={photo.id}
            disabled={!birthdayConfig.preferences.enablePhotoLightbox}
            style={{
              left: "calc(50% " + (photo.position.x < 0 ? "- " : "+ ") + Math.abs(photo.position.x) + "vw)",
              top: "calc(50% " + (photo.position.y < 0 ? "- " : "+ ") + Math.abs(photo.position.y) + "vh)",
              transform: "translate(-50%, -50%) translateZ(" + photo.position.z + "px) rotate(" + photo.rotation + "deg) scale(" + photo.scale + ")",
              "--universe-index": index,
              "--drift-x": (index % 2 === 0 ? -1 : 1) * (8 + (index % 3) * 4) + "px",
              "--drift-y": (index % 3 === 0 ? -1 : 1) * (7 + (index % 4) * 2) + "px",
              "--drift-rotation": (index % 2 === 0 ? -1 : 1) * (1 + (index % 3)) + "deg",
              zIndex: 10 + index,
            } as CSSProperties}
            onClick={() => onPhotoOpen({ src: photo.src, alt: photo.alt, caption: photo.caption })}
            aria-label={"Open memory: " + photo.caption}
          >
            <PhotoMedia src={photo.src} alt={photo.alt} variant={index + 3} />
            {birthdayConfig.preferences.showCaptions && <span>{photo.caption}</span>}
          </button>
        ))}
        {isEmptyList(photos) && <p className="universe-empty">Add photographs in the photoUniverse section of birthdayConfig.ts.</p>}
      </div>
      <div className="universe-controls">
        <button type="button" className="universe-back" onClick={onBack}>← {birthdayConfig.photoUniverse.returnLabel}</button>
        {birthdayConfig.closing.enabled && <button type="button" className="closing-trigger" onClick={() => setNoteOpen((isOpen) => !isOpen)}>{noteOpen ? "CLOSE NOTE ×" : birthdayConfig.closing.openButtonText}</button>}
      </div>
      {noteOpen && birthdayConfig.closing.enabled && (
        <aside className="closing-note" aria-label={birthdayConfig.closing.heading}>
          <button type="button" aria-label="Close note" onClick={() => setNoteOpen(false)}>×</button>
          <span>✦ A NOTE FOR {birthdayConfig.recipient.name.toUpperCase()}</span>
          <h2>{birthdayConfig.closing.heading}</h2>
          <p>{birthdayConfig.closing.message}</p>
          <em>{birthdayConfig.closing.signature}, {birthdayConfig.recipient.nickname}</em>
          <button type="button" className="closing-replay" onClick={onReplay}>{birthdayConfig.closing.buttonText} ↗</button>
        </aside>
      )}
    </section>
  );
}

function PhotoViewer({ photo, onClose }: { photo: SelectedPhoto | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);

  return (
    <dialog className="photo-viewer" ref={dialogRef} aria-label={photo?.caption ?? "Photograph"} onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <button className="dialog-close" type="button" aria-label="Close photograph" onClick={onClose}>×</button>
      {photo && <><PhotoMedia src={photo.src} alt={photo.alt} variant={5} /><p>{photo.caption}</p></>}
    </dialog>
  );
}

function AudioDock() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = birthdayConfig.audio.defaultVolume;
  }, []);
  if (!birthdayConfig.audio.enabled || !birthdayConfig.audio.showControls) return null;

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio || unavailable) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setUnavailable(true);
      setPlaying(false);
    }
  }

  return (
    <div className="audio-dock">
      <audio ref={audioRef} src={birthdayConfig.audio.src} loop onError={() => setUnavailable(true)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button type="button" onClick={toggleAudio} disabled={unavailable} aria-label={playing ? "Pause soundtrack" : "Play soundtrack"}>
            <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{unavailable ? "Audio file missing" : playing ? "PAUSE · " + birthdayConfig.audio.label : birthdayConfig.audio.label}
      </button>
      {!unavailable && <label><span className="sr-only">Music volume</span><input type="range" min="0" max="1" step="0.05" defaultValue={birthdayConfig.audio.defaultVolume} onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} /></label>}
    </div>
  );
}

export default function App() {
  const [scene, setScene] = useState<SceneId>(firstEnabledScene);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const countdown = useCountdown(birthdayConfig.recipient.birthdayDate, birthdayConfig.recipient.birthdayTime, birthdayConfig.recipient.timezone);
  const motionMode = birthdayConfig.preferences.animationsEnabled && !birthdayConfig.preferences.reducedMotion ? "on" : "off";
  const navLabel = useMemo(() => sceneItems.find((item) => item.id === scene)?.label ?? "Birthday story", [scene]);

  useEffect(() => {
    if (scene === "cinema" && countdown.complete) setScene(adjacentEnabledScene("cinema"));
  }, [countdown.complete, scene]);

  function changeScene(next: SceneId) {
    if (!sceneItems.find((item) => item.id === next)?.enabled) return;
    setScene(next);
    setSelectedPhoto(null);
  }

  const photoOpener = birthdayConfig.preferences.enablePhotoLightbox ? setSelectedPhoto : () => undefined;
  return (
    <main className="birthday-app" data-motion={motionMode} data-scene={scene} aria-label={navLabel}>
      <SceneNavigation current={scene} onChange={changeScene} />
      <div className="scene-stage" key={scene}>
        {scene === "cinema" && <CinemaScene countdown={countdown} onPreview={() => changeScene(adjacentEnabledScene("cinema"))} />}
        {scene === "reveal" && <RevealScene onContinue={() => changeScene(adjacentEnabledScene("reveal"))} />}
        {scene === "introduction" && <IntroductionScene onContinue={() => changeScene(adjacentEnabledScene("introduction"))} onPhotoOpen={photoOpener} />}
        {scene === "gallery" && <GalleryScene onPhotoOpen={photoOpener} onOpenAlbum={() => setAlbumOpen(true)} onEnterUniverse={() => changeScene(adjacentEnabledScene("gallery"))} />}
        {scene === "universe" && <UniverseScene onPhotoOpen={photoOpener} onBack={() => changeScene(adjacentEnabledScene("universe", -1))} onReplay={() => changeScene(firstEnabledScene())} />}
      </div>
      <PhotoViewer photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      <ScrapbookDialog open={albumOpen} onOpenChange={setAlbumOpen} />
      <AudioDock />
    </main>
  );
}


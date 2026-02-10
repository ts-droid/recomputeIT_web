import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Cpu,
  Leaf,
  Mail,
  MapPin,
  PhoneCall,
  Recycle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
  Clock,
} from 'lucide-react';

const services = [
  {
    title: 'Reparationer med garanti',
    description:
      'Felsökning, skärmbyten, batterier och komponenter med tydlig återkoppling genom hela processen.',
    icon: Wrench,
  },
  {
    title: 'Uppgraderingar som känns nya',
    description:
      'Ge din dator, konsol eller mobil längre liv med lagring, minne och smarta förbättringar.',
    icon: Sparkles,
  },
  {
    title: 'Trygg service och rådgivning',
    description:
      'Vi hjälper dig välja rätt väg: reparera, uppgradera eller återbruka.',
    icon: ShieldCheck,
  },
  {
    title: 'Cirkulär elektronik',
    description:
      'Vi jobbar med återbrukad teknik för att minska avfall och spara resurser.',
    icon: Recycle,
  },
];

const imageAssets = {
  heroRepair: '/images/marketing/hero-repair',
  heroPickup: '/images/marketing/hero-pickup',
  productConsoles: '/images/marketing/product-consoles',
  productHeadphones: '/images/marketing/product-headphones',
  productTv: '/images/marketing/product-tv',
  solderingMacro: '/images/marketing/soldering',
  motherboard: '/images/marketing/motherboard',
};
const traderaSymbolUrl = '/images/marketing/tradera-symbol-black.png';
const facebookPageUrl = 'https://www.facebook.com/recomputeitnordic';

const products = [
  'Spelkonsoler',
  'Musik & media',
  'Hörlurar',
  'Datorer & tillbehör',
  'Skivspelare',
  'TV & bild',
];

const steps = [
  {
    title: 'Inlämning eller bokning',
    description: 'Besök oss i ReTuna eller boka support online med ditt ärende.',
    icon: BadgeCheck,
  },
  {
    title: 'Diagnos & offert',
    description: 'Vi går igenom problemet och återkopplar snabbt med en tydlig plan.',
    icon: Cpu,
  },
  {
    title: 'Reparation eller uppgradering',
    description: 'Vårt team åtgärdar felet och använder återbrukade delar när det är möjligt.',
    icon: RefreshCcw,
  },
  {
    title: 'Upphämtning & fortsatt liv',
    description: 'Du får tillbaka en enhet som fungerar igen och minskar elektronikavfallet.',
    icon: Leaf,
  },
];

const SectionTitle = ({ eyebrow, title, description }) => (
  <div className="max-w-2xl">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
      {eyebrow}
    </p>
    <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
      {title}
    </h2>
    <p className="mt-4 text-base md:text-lg text-slate-600">
      {description}
    </p>
  </div>
);

const TraderaCard = ({ item }) => {
  const price = item.buyNow || item.nextBid || item.openingBid || '';
  return (
    <a
      href={item.itemLink || '#'}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-44 w-full bg-slate-100">
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f7c600]">
            <img src={traderaSymbolUrl} alt="Tradera" className="h-4.5 w-4.5" />
          </span>
          Tradera
        </div>
        {item.image || item.thumbnail ? (
          <img
            src={item.image || item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
          <span>{item.endDate ? new Date(item.endDate).toLocaleDateString('sv-SE') : ''}</span>
          {price ? <span className="font-semibold text-emerald-600">{price} kr</span> : null}
        </div>
      </div>
    </a>
  );
};

const ResponsiveImage = ({ base, alt, className, sizes }) => (
  <picture>
    <source srcSet={`${base}.avif`} type="image/avif" />
    <source srcSet={`${base}.webp`} type="image/webp" />
    <img src={`${base}.jpg`} alt={alt} className={className} loading="lazy" sizes={sizes} />
  </picture>
);

const normalizeText = (value) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const categoryMatchers = [
  { label: 'Spelkonsol', keywords: ['playstation', 'ps', 'xbox', 'switch', 'nintendo', 'konsol'] },
  { label: 'Ljud', keywords: ['hörlur', 'headphone', 'högtal', 'speaker', 'audio', 'music'] },
  { label: 'Dator', keywords: ['laptop', 'macbook', 'dator', 'pc', 'imac', 'desktop'] },
  { label: 'TV & Bild', keywords: ['tv', 'monitor', 'skärm', 'display', 'projektor'] },
  { label: 'Mobil', keywords: ['iphone', 'samsung', 'mobil', 'smartphone', 'telefon'] },
];

const getCategory = (title) => {
  const text = normalizeText(title);
  for (const category of categoryMatchers) {
    if (category.keywords.some((keyword) => text.includes(keyword))) {
      return category.label;
    }
  }
  return 'Övrigt';
};

const parsePrice = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

export default function MarketingHomePage() {
  const [traderaItems, setTraderaItems] = useState([]);
  const [traderaError, setTraderaError] = useState('');
  const [traderaFetchedAt, setTraderaFetchedAt] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    fetch('/data/tradera.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.error) {
          setTraderaError(data.error);
        }
        setTraderaItems(Array.isArray(data?.items) ? data.items : []);
        setTraderaFetchedAt(data?.fetchedAt || '');
      })
      .catch(() => {
        if (isMounted) setTraderaError('Kunde inte ladda Tradera-listningar.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    return traderaItems.filter((item) => {
      const title = item.title || '';
      const matchesSearch = !normalizedSearch || normalizeText(title).includes(normalizedSearch);
      const category = getCategory(title);
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

      const priceValue = parsePrice(item.buyNow || item.nextBid || item.openingBid);
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'under-1000' && priceValue !== null && priceValue < 1000) ||
        (priceFilter === '1000-3000' && priceValue !== null && priceValue >= 1000 && priceValue <= 3000) ||
        (priceFilter === 'over-3000' && priceValue !== null && priceValue > 3000);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [traderaItems, searchTerm, categoryFilter, priceFilter]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
  const canLoadMore = visibleCount < filteredItems.length;

  return (
    <div className="bg-slate-950">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white">
        <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/5">
          <div className="container flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://horizons-cdn.hostinger.com/66ce8f1a-1805-4a09-9f17-041a9f68d79f/f39487d84caba3a65608a9652e97d727.jpg"
                alt="re:Compute-IT"
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold">re:Compute-IT</p>
                <p className="text-xs text-white/60">Reparation & återbruk</p>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm text-white/70">
              <a className="hover:text-white transition" href="#services">
                Tjänster
              </a>
              <a className="hover:text-white transition" href="#products">
                Sortiment
              </a>
              <a className="hover:text-white transition" href="#webshop">
                Webshop
              </a>
              <a className="hover:text-white transition" href="#facebook">
                Facebook
              </a>
              <a className="hover:text-white transition" href="#process">
                Process
              </a>
              <a className="hover:text-white transition" href="#about">
                Om oss
              </a>
              <a className="hover:text-white transition" href="#contact">
                Kontakt
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/boka-support"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                Boka support
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-[120px]" />

          <div className="container relative z-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] py-16 lg:py-24">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                Cirkulär elektronik från ReTuna
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                Ge din teknik nytt liv med reparation, uppgradering och återbruk.
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-xl">
                Vi hjälper dig att ta hand om elektronik på ett smartare sätt. Snabb service,
                ärlig rådgivning och hållbara lösningar i hjärtat av Eskilstuna.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
                >
                  Kontakta oss
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/60 transition"
                >
                  Se öppettider
                  <ArrowRight size={16} />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold text-white">Reparation & uppgradering</p>
                  <p className="mt-2">Vi hjälper dig hela vägen från felsökning till färdig lösning.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold text-white">Återbrukat sortiment</p>
                  <p className="mt-2">Sälj, byt eller hitta förnyad teknik i butik.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10">
                    <ResponsiveImage
                      base={imageAssets.heroRepair}
                      alt="Reparation av elektronik"
                      className="h-52 w-full object-cover sm:h-60"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                      Snabb service i butik
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <ResponsiveImage
                        base={imageAssets.solderingMacro}
                        alt="Detalj av kretskort"
                        className="h-28 w-full object-cover sm:h-32"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <ResponsiveImage
                        base={imageAssets.heroPickup}
                        alt="Inlämning av teknik"
                        className="h-28 w-full object-cover sm:h-32"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white/80">Serviceöversikt</p>
                      <span className="text-xs text-white/50">ReTuna Eskilstuna</span>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-slate-900/70 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Reparation</p>
                        <p className="mt-2 text-lg font-semibold">Skärm, batteri, diagnos</p>
                        <p className="mt-2 text-sm text-white/60">
                          Transparent offert, snabb återkoppling och garanti.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Uppgradering</p>
                        <p className="mt-2 text-lg font-semibold">Nytt liv i äldre enheter</p>
                        <p className="mt-2 text-sm text-white/60">
                          Vi matchar rätt delar med smart återbruk.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Återbruk</p>
                        <p className="mt-2 text-lg font-semibold">Köp & sälj elektronik</p>
                        <p className="mt-2 text-sm text-white/60">
                          Teknik som fungerar igen istället för att kasseras.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
                      <div className="rounded-xl border border-white/10 px-3 py-2">Diagnos inom 48h</div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">Dela återbrukad</div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">Hållbar service</div>
                      <div className="rounded-xl border border-white/10 px-3 py-2">Support i butik</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-emerald-400/40 blur-2xl" />
            </div>
          </div>
        </section>
      </div>

      <main className="bg-slate-50 text-slate-900">
        <section id="services" className="py-16 md:py-24">
          <div className="container space-y-10">
            <SectionTitle
              eyebrow="Tjänster"
              title="Service som förlänger livet på din teknik"
              description="Vi reparerar, uppgraderar och återbrukar elektronik med fokus på hållbarhet och tydlighet."
            />
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <ResponsiveImage
                  base={imageAssets.motherboard}
                  alt="Närbild av kretskort"
                  className="h-64 w-full object-cover md:h-72"
                  sizes="(max-width: 768px) 100vw, 55vw"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <ResponsiveImage
                    base={imageAssets.heroPickup}
                    alt="Återbrukad teknik redo för nästa ägare"
                    className="h-32 w-full object-cover sm:h-36 md:h-full"
                    sizes="(max-width: 768px) 50vw, 22vw"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <ResponsiveImage
                    base={imageAssets.solderingMacro}
                    alt="Precision i servicearbetet"
                    className="h-32 w-full object-cover sm:h-36 md:h-full"
                    sizes="(max-width: 768px) 50vw, 22vw"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="products" className="py-16 md:py-24 bg-white">
          <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <SectionTitle
              eyebrow="Sortiment"
              title="Återbrukade produkter för varje vardag"
              description="Vi ger elektronik en andra chans. Utforska noga utvalda produkter i butik."
            />
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <div className="grid grid-cols-3 gap-3">
                <ResponsiveImage
                  base={imageAssets.productConsoles}
                  alt="Spelkonsoler i butik"
                  className="h-20 w-full rounded-2xl object-cover sm:h-24"
                  sizes="(max-width: 640px) 33vw, 12vw"
                />
                <ResponsiveImage
                  base={imageAssets.productHeadphones}
                  alt="Hörlurar och tillbehör"
                  className="h-20 w-full rounded-2xl object-cover sm:h-24"
                  sizes="(max-width: 640px) 33vw, 12vw"
                />
                <ResponsiveImage
                  base={imageAssets.productTv}
                  alt="TV och bildskärmar"
                  className="h-20 w-full rounded-2xl object-cover sm:h-24"
                  sizes="(max-width: 640px) 33vw, 12vw"
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {products.map((product) => (
                  <div
                    key={product}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium"
                  >
                    {product}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                <span>Alla produkter testas och kvalitetssäkras.</span>
                <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold">
                  Fråga i butik
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="webshop" className="py-16 md:py-24">
          <div className="container space-y-10">
            <SectionTitle
              eyebrow="Webshop"
              title="Våra aktuella annonser på Tradera"
              description="Vi visar allt vi har ute just nu. Klicka på en annons för att se detaljer och köpa."
            />
            <p className="text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f7c600]">
                  <img src={traderaSymbolUrl} alt="Tradera" className="h-4.5 w-4.5" />
                </span>
                Köp via Tradera
              </span>
              <span className="ml-3">
                Alla köp sker via{' '}
                <a
                  href="https://www.tradera.com/profile/items/4863360/recomputeitnordic"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Tradera
                </a>
                .
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Tradera‑symbolen används med tillstånd för mediabruk.{' '}
              <a
                href="https://www.mynewsdesk.com/se/tradera/images/tradera-symbol-vit-2879639"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-500"
              >
                Källa
              </a>
            </p>
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-center">
              <input
                type="text"
                placeholder="Sök i annonser"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setVisibleCount(12);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setVisibleCount(12);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Alla kategorier</option>
                {categoryMatchers.map((category) => (
                  <option key={category.label} value={category.label}>
                    {category.label}
                  </option>
                ))}
                <option value="Övrigt">Övrigt</option>
              </select>
              <select
                value={priceFilter}
                onChange={(event) => {
                  setPriceFilter(event.target.value);
                  setVisibleCount(12);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Alla priser</option>
                <option value="under-1000">Under 1 000 kr</option>
                <option value="1000-3000">1 000 – 3 000 kr</option>
                <option value="over-3000">Över 3 000 kr</option>
              </select>
              <div className="text-xs text-slate-500 md:text-right">
                {traderaFetchedAt
                  ? `Uppdaterad ${new Date(traderaFetchedAt).toLocaleString('sv-SE')}`
                  : 'Uppdatering saknas'}
              </div>
            </div>
            {traderaItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
                {traderaError || 'Inga annonser kunde laddas just nu.'}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleItems.map((item) => (
                    <TraderaCard key={item.id} item={item} />
                  ))}
                </div>
                {filteredItems.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Inga annonser matchar din filtrering.
                  </div>
                ) : null}
                {canLoadMore ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 12)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900 transition"
                  >
                    Ladda fler
                    <ArrowRight size={14} />
                  </button>
                ) : null}
              </>
            )}
          </div>
        </section>

        <section id="facebook" className="py-16 md:py-24 bg-white">
          <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <SectionTitle
              eyebrow="Facebook"
              title="Senaste uppdateringarna"
              description="Följ oss på Facebook för nyheter, kampanjer och aktuella uppdateringar."
            />
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="relative w-full overflow-hidden rounded-2xl bg-white">
                <iframe
                  title="re:Compute-IT Facebook"
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
                    facebookPageUrl
                  )}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                  className="h-[600px] w-full border-0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="py-16 md:py-24">
          <div className="container space-y-10">
            <SectionTitle
              eyebrow="Process"
              title="En enkel resa från fel till fungerande"
              description="Vi håller dig uppdaterad hela vägen och använder återbrukade delar när det passar."
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Icon size={20} />
                      </div>
                      <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <div className="space-y-6">
              <SectionTitle
                eyebrow="Om re:Compute-IT"
                title="Vi gör återbruk till standard"
                description="Vi finns i ReTuna Återbruksgalleria och hjälper människor och företag att minska elektronikavfall genom reparationer och smart återbruk."
              />
              <div className="grid gap-4 text-sm text-white/70">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-1" size={18} />
                  <span>Certifierad service med fokus på hållbarhet och transparens.</span>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-1" size={18} />
                  <span>Vi tar hand om teknik som annars hade blivit elektronikskrot.</span>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-1" size={18} />
                  <span>Personlig hjälp på plats i Eskilstuna.</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                <ResponsiveImage
                  base={imageAssets.motherboard}
                  alt="Detalj av elektronik"
                  className="h-44 w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.3em] text-emerald-300">Därför oss</p>
              <h3 className="mt-4 text-2xl font-semibold">Cirkulär ekonomi på riktigt</h3>
              <p className="mt-4 text-sm text-white/70">
                Genom att reparera och återbruka elektronik sparar vi resurser, minskar klimatpåverkan
                och gör teknik tillgänglig för fler.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-lg font-semibold">ReTuna</p>
                  <p className="mt-2 text-white/70">Världens första återbruksgalleria.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-lg font-semibold">Eskilstuna</p>
                  <p className="mt-2 text-white/70">Lokalt team med globalt fokus.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 md:py-24 bg-white">
          <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionTitle
              eyebrow="Kontakt"
              title="Hör av dig eller kom förbi"
              description="Vi finns i ReTuna Återbruksgalleria i Eskilstuna. Vi hjälper dig gärna på plats eller via telefon och mail."
            />
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 space-y-5 text-sm text-slate-700">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ResponsiveImage
                  base={imageAssets.heroRepair}
                  alt="Butik och service"
                  className="h-36 w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 35vw"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <iframe
                  title="re:Compute-IT karta"
                  className="h-52 w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  src="https://www.google.com/maps?q=ReTuna%20%C3%85terbruksgalleria%2C%20Folkestaleden%205%2C%20635%2010%20Eskilstuna&output=embed"
                />
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 text-emerald-600" />
                <div>
                  <p className="font-semibold">Besök oss</p>
                  <p>ReTuna Återbruksgalleria</p>
                  <p>Folkestaleden 5, 635 10 Eskilstuna</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall size={18} className="mt-1 text-emerald-600" />
                <div>
                  <p className="font-semibold">Ring oss</p>
                  <p>016-541 67 00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-1 text-emerald-600" />
                <div>
                  <p className="font-semibold">Maila oss</p>
                  <p>kontakt@recompute.it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="mt-1 text-emerald-600" />
                <div>
                  <p className="font-semibold">Öppettider</p>
                  <p>
                    Se gallerians öppettider:{' '}
                    <a
                      href="https://www.retuna.se/oppettider"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      retuna.se/oppettider
                    </a>
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="/boka-support"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Boka support
                  <ArrowRight size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.Tawk_API && window.Tawk_API.maximize) {
                      window.Tawk_API.maximize();
                    }
                  }}
                  className="ml-3 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900 transition"
                >
                  Chatta med oss
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white/70">
        <div className="container py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">re:Compute-IT</p>
            <p className="text-xs text-white/50">ReTuna Återbruksgalleria, Eskilstuna</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <a href="#services" className="hover:text-white transition">
              Tjänster
            </a>
            <a href="#products" className="hover:text-white transition">
              Sortiment
            </a>
            <a href="#webshop" className="hover:text-white transition">
              Webshop
            </a>
            <a href="#facebook" className="hover:text-white transition">
              Facebook
            </a>
            <a href="#about" className="hover:text-white transition">
              Om oss
            </a>
            <Link to="/login" className="hover:text-white transition">
              Personal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

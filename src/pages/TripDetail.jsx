import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../lib/compressImage';
import { useLongPress } from '../lib/useLongPress';
import { ChevronLeftIcon, PlusIcon, CloseIcon } from '../components/Icons';

export default function TripDetail() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [openImage, setOpenImage] = useState(null);
  const fileInputRef = useRef(null);

  async function loadAll() {
    const [{ data: t }, { data: imgs }] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('trip_images').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })
    ]);
    setTrip(t);
    setImages(imgs || []);
  }

  useEffect(() => { loadAll(); }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const path = `${tripId}/${Date.now()}-${compressed.name}`;
        const { error: upErr } = await supabase.storage.from('trips').upload(path, compressed);
        if (upErr) continue;
        const { data: pub } = supabase.storage.from('trips').getPublicUrl(path);
        await supabase.from('trip_images').insert({ trip_id: tripId, image_url: pub.publicUrl });
      }
      await loadAll();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteImage(img) {
    if (!window.confirm('Apagar esta foto?')) return;
    const marker = '/storage/v1/object/public/trips/';
    const idx = img.image_url.indexOf(marker);
    if (idx !== -1) {
      await supabase.storage.from('trips').remove([img.image_url.slice(idx + marker.length)]);
    }
    await supabase.from('trip_images').delete().eq('id', img.id);
    loadAll();
  }

  if (!trip) {
    return <div className="screen" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20 }}><p style={{ color: 'var(--muted)' }}>Carregando…</p></div>;
  }

  return (
    <div className="screen">
      <div
        style={{
          height: 220,
          backgroundImage: trip.cover_image_url ? `url(${trip.cover_image_url})` : 'linear-gradient(135deg,#2A2A5C,#1F1F45)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,20,43,0.35) 0%, rgba(20,20,43,0.95) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 20 }}>
          <Link to="/viagens" style={{ position: 'absolute', top: 18, left: 18, background: 'rgba(20,20,43,0.6)', borderRadius: 999, padding: 8, display: 'flex' }}>
            <ChevronLeftIcon width={18} height={18} />
          </Link>
          <p className="eyebrow" style={{ color: 'var(--gold)' }}>{formatDate(trip.trip_date)}</p>
          <h1 style={{ fontSize: 26 }}>{trip.title}</h1>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {trip.description && <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 14.5 }}>{trip.description}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px' }}>
          <p className="eyebrow">galeria</p>
          <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 12 }}>
            <PlusIcon width={14} height={14} /> {uploading ? 'Enviando…' : 'Adicionar fotos'}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {images.map((img) => (
            <GalleryPhoto
              key={img.id}
              img={img}
              onOpen={() => setOpenImage(img.image_url)}
              onDelete={() => deleteImage(img)}
            />
          ))}
        </div>
        {images.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Nenhuma foto ainda. Adicione as primeiras lembranças dessa viagem.</p>}
      </div>

      {openImage && (
        <div
          onClick={() => setOpenImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(10,10,25,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <button
            onClick={() => setOpenImage(null)}
            style={{ position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', right: 18, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: 8, display: 'flex' }}
          >
            <CloseIcon width={20} height={20} style={{ color: 'var(--cream)' }} />
          </button>
          <img src={openImage} alt="" style={{ maxWidth: '92vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function GalleryPhoto({ img, onOpen, onDelete }) {
  const { handlers, wasLongPress } = useLongPress(onDelete);
  return (
    <div
      {...handlers}
      onClick={() => { if (!wasLongPress()) onOpen(); }}
      role="img"
      aria-label="Foto da viagem"
      style={{
        ...handlers.style,
        cursor: 'pointer',
        width: '100%',
        aspectRatio: '1/1',
        borderRadius: 14,
        backgroundImage: `url(${img.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
}

function formatDate(d) {
  if (!d) return 'sem data';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

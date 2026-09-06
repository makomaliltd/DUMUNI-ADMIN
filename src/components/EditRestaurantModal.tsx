import { useState, useEffect } from 'react';
import { useRestaurant, useUpdateRestaurant } from '@/hooks/useRestaurants';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Store } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
}

// Centre par défaut : Bamako (Mali)
const BAMAKO: [number, number] = [12.6392, -8.0029];

const pickIcon = L.divIcon({
  className: 'location-pick-marker',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: #f97316; border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    color: white;
  ">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 15, { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : BAMAKO;
  return (
    <div className="relative rounded-lg overflow-hidden border" style={{ height: 220 }}>
      <MapContainer center={center} zoom={lat != null ? 15 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatcher onPick={onChange} />
        <Recenter lat={lat} lng={lng} />
        {lat != null && lng != null ? <Marker position={[lat, lng]} icon={pickIcon} /> : null}
      </MapContainer>
    </div>
  );
}

export default function EditRestaurantModal({ open, onOpenChange, restaurantId }: Props) {
  const { t } = useLanguage();
  const { data: restaurantRes, isLoading } = useRestaurant(restaurantId);
  const updateRestaurant = useUpdateRestaurant();
  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', hours: '',
    cuisine_type: '', delivery_fee: '', min_order: '',
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (restaurantRes?.data) {
      const r = restaurantRes.data;
      setForm({
        name: r.name || '',
        description: r.description || '',
        address: r.address || '',
        phone: r.phone || '',
        hours: r.hours || '',
        cuisine_type: r.cuisine_type || '',
        delivery_fee: r.delivery_fee || '',
        min_order: r.min_order || '',
      });
      const rLat = r.latitude != null ? Number(r.latitude) : null;
      const rLng = r.longitude != null ? Number(r.longitude) : null;
      setLat(rLat);
      setLng(rLng);
    }
  }, [restaurantRes?.data]);

  const handleSubmit = async () => {
    const payload = { ...form, latitude: lat, longitude: lng };
    await updateRestaurant.mutateAsync({ id: restaurantId, data: payload });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('restaurantDetail.editRestaurant')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.restaurantName')}</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.description')}</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.address')}</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.phone')}</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.hours')}</label>
                <Input value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.cuisine')}</label>
                <Input value={form.cuisine_type} onChange={e => setForm(f => ({ ...f, cuisine_type: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.deliveryFee')}</label>
                <Input value={form.delivery_fee} onChange={e => setForm(f => ({ ...f, delivery_fee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('restaurantDetail.minOrder')}</label>
                <Input value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))} />
              </div>
            </div>

            {/* Position sur la carte */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {t('restaurantDetail.setLocation')}
              </label>
              <LocationPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(Number(newLat.toFixed(6)));
                  setLng(Number(newLng.toFixed(6)));
                }}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Store className="w-3 h-3 text-orange-500" />
                {t('restaurantDetail.clickOnMap')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('restaurantDetail.coordinates')}:{' '}
                {lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '—'}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={updateRestaurant.isPending}>
            {updateRestaurant.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

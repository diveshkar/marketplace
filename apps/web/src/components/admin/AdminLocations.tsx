import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Toast = (msg: string) => void;

type City = { slug: string; name: string };
type District = { slug: string; name: string; cities: City[] };

type Location = {
  slug: string;
  name: string;
  districts: District[];
  sortOrder: number;
};

const EMPTY: Location = { slug: '', name: '', districts: [], sortOrder: 0 };

export function AdminLocations({ toast }: { toast: Toast }) {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [editing, setEditing] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);

  // District form
  const [dSlug, setDSlug] = useState('');
  const [dName, setDName] = useState('');

  // City form (per district index)
  const [cityTarget, setCityTarget] = useState<number | null>(null);
  const [cSlug, setCSlug] = useState('');
  const [cName, setCName] = useState('');

  const load = async () => {
    const res = await apiFetch('/admin/locations');
    if (res.ok) setLocations(await res.json());
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing || !editing.slug.trim() || !editing.name.trim()) {
      toast('Slug and name are required');
      return;
    }
    setBusy(true);
    const res = await apiFetch('/admin/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setBusy(false);
    if (res.ok) {
      toast('Location saved');
      setEditing(null);
      load();
    } else {
      const err = await res.json().catch(() => null);
      toast(err?.error ?? 'Failed to save');
    }
  };

  const remove = async (slug: string) => {
    if (!confirm(`Delete location "${slug}"?`)) return;
    setBusy(true);
    const res = await apiFetch(`/admin/locations/${slug}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      toast('Location deleted');
      load();
    } else {
      toast('Failed to delete');
    }
  };

  const addDistrict = () => {
    if (!editing || !dSlug.trim() || !dName.trim()) return;
    setEditing({
      ...editing,
      districts: [...editing.districts, { slug: dSlug.trim(), name: dName.trim(), cities: [] }],
    });
    setDSlug('');
    setDName('');
  };

  const removeDistrict = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, districts: editing.districts.filter((_, i) => i !== idx) });
  };

  const addCity = (districtIdx: number) => {
    if (!editing || !cSlug.trim() || !cName.trim()) return;
    const districts = editing.districts.map((d, i) =>
      i === districtIdx ? { ...d, cities: [...d.cities, { slug: cSlug.trim(), name: cName.trim() }] } : d
    );
    setEditing({ ...editing, districts });
    setCSlug('');
    setCName('');
    setCityTarget(null);
  };

  const removeCity = (districtIdx: number, cityIdx: number) => {
    if (!editing) return;
    const districts = editing.districts.map((d, i) =>
      i === districtIdx ? { ...d, cities: d.cities.filter((_, ci) => ci !== cityIdx) } : d
    );
    setEditing({ ...editing, districts });
  };

  // Edit/create form
  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-4 text-sm text-teal-600 hover:underline">
          &larr; Back
        </button>
        <h2 className="text-lg font-bold text-gray-900">{editing.slug ? 'Edit Location' : 'New Location'}</h2>

        <div className="mt-4 max-w-2xl space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_5rem]">
            <div>
              <label className="block text-xs font-medium text-gray-600">Slug</label>
              <input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="western"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Name</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Western Province"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Order</label>
              <input
                type="number"
                value={editing.sortOrder}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Districts */}
          <div>
            <label className="block text-xs font-medium text-gray-600">Districts</label>
            {editing.districts.map((d, di) => (
              <div key={di} className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{d.name}</span>
                  <span className="text-xs text-gray-400">{d.slug}</span>
                  <span className="text-xs text-gray-400">{d.cities.length} cities</span>
                  <button onClick={() => removeDistrict(di)} className="ml-auto text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>

                {/* Cities in district */}
                {d.cities.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.cities.map((c, ci) => (
                      <span key={ci} className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-xs text-gray-600">
                        {c.name}
                        <button onClick={() => removeCity(di, ci)} className="text-red-400 hover:text-red-600">&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add city */}
                {cityTarget === di ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input placeholder="city-slug" value={cSlug}
                      onChange={(e) => setCSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none" />
                    <input placeholder="City Name" value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none" />
                    <button onClick={() => addCity(di)}
                      className="rounded bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-200">Add</button>
                    <button onClick={() => setCityTarget(null)}
                      className="text-xs text-gray-400 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setCityTarget(di); setCSlug(''); setCName(''); }}
                    className="mt-1 text-xs text-teal-600 hover:underline">+ Add City</button>
                )}
              </div>
            ))}

            {/* Add district */}
            <div className="mt-2 flex flex-wrap gap-2">
              <input placeholder="district-slug" value={dSlug}
                onChange={(e) => setDSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none" />
              <input placeholder="District Name" value={dName}
                onChange={(e) => setDName(e.target.value)}
                className="w-40 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none" />
              <button onClick={addDistrict}
                className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">Add District</button>
            </div>
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Save Location
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage provinces, districts, and cities</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + New Location
        </button>
      </div>

      {locations === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No locations yet. Seed or create one.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {locations.map((loc) => {
            const cityCount = loc.districts.reduce((sum, d) => sum + d.cities.length, 0);
            return (
              <div key={loc.slug} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-gray-900">{loc.name}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{loc.slug}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {loc.districts.length} districts &middot; {cityCount} cities &middot; Order: {loc.sortOrder}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => { setEditing({ ...loc, districts: loc.districts.map((d) => ({ ...d, cities: [...d.cities] })) }); }}
                      className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(loc.slug)}
                      disabled={busy}
                      className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

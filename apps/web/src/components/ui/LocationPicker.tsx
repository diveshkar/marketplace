import { PROVINCES } from '@marketplace/shared-utils';

type LocationPickerProps = {
  province: string;
  district: string;
  city: string;
  onProvinceChange: (slug: string) => void;
  onDistrictChange: (slug: string) => void;
  onCityChange: (slug: string) => void;
};

export function LocationPicker({
  province,
  district,
  city,
  onProvinceChange,
  onDistrictChange,
  onCityChange,
}: LocationPickerProps) {
  const selectedProvince = PROVINCES.find((p) => p.slug === province);
  const selectedDistrict = selectedProvince?.districts.find((d) => d.slug === district);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Province</span>
        <select
          value={province}
          onChange={(e) => {
            onProvinceChange(e.target.value);
            onDistrictChange('');
            onCityChange('');
          }}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">Select province</option>
          {PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">District</span>
        <select
          value={district}
          onChange={(e) => {
            onDistrictChange(e.target.value);
            onCityChange('');
          }}
          disabled={!selectedProvince}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Select district</option>
          {selectedProvince?.districts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">City</span>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={!selectedDistrict}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Select city</option>
          {selectedDistrict?.cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

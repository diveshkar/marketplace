import { CATEGORIES } from '@marketplace/shared-utils';

type CategoryPickerProps = {
  category: string;
  subcategory: string;
  onCategoryChange: (slug: string) => void;
  onSubcategoryChange: (slug: string) => void;
};

export function CategoryPicker({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
}: CategoryPickerProps) {
  const selected = CATEGORIES.find((c) => c.slug === category);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Category</span>
        <select
          value={category}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onSubcategoryChange('');
          }}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Subcategory</span>
        <select
          value={subcategory}
          onChange={(e) => onSubcategoryChange(e.target.value)}
          disabled={!selected}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Select subcategory</option>
          {selected?.subcategories.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

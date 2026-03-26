import { categoryRepository, type CategoryRecord } from '../repositories/category.repository.js';
import { locationRepository, type LocationRecord } from '../repositories/location.repository.js';

// ── Categories ───────────────────────────────────────────────────

async function listCategories(): Promise<CategoryRecord[]> {
  return categoryRepository.scanAll();
}

async function getCategory(slug: string): Promise<CategoryRecord | null> {
  return categoryRepository.getBySlug(slug);
}

async function upsertCategory(input: {
  slug: string;
  name: string;
  icon: string;
  subcategories: { slug: string; name: string }[];
  sortOrder: number;
}): Promise<CategoryRecord> {
  const existing = await categoryRepository.getBySlug(input.slug);
  const now = new Date().toISOString();
  const record: CategoryRecord = {
    slug: input.slug,
    name: input.name,
    icon: input.icon,
    subcategories: input.subcategories,
    sortOrder: input.sortOrder,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await categoryRepository.put(record);
  return record;
}

async function deleteCategory(slug: string): Promise<void> {
  await categoryRepository.delete(slug);
}

// ── Locations ────────────────────────────────────────────────────

async function listLocations(): Promise<LocationRecord[]> {
  return locationRepository.scanAll();
}

async function getLocation(slug: string): Promise<LocationRecord | null> {
  return locationRepository.getBySlug(slug);
}

async function upsertLocation(input: {
  slug: string;
  name: string;
  districts: { slug: string; name: string; cities: { slug: string; name: string }[] }[];
  sortOrder: number;
}): Promise<LocationRecord> {
  const existing = await locationRepository.getBySlug(input.slug);
  const now = new Date().toISOString();
  const record: LocationRecord = {
    slug: input.slug,
    name: input.name,
    districts: input.districts,
    sortOrder: input.sortOrder,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await locationRepository.put(record);
  return record;
}

async function deleteLocation(slug: string): Promise<void> {
  await locationRepository.delete(slug);
}

export const taxonomyService = {
  listCategories,
  getCategory,
  upsertCategory,
  deleteCategory,
  listLocations,
  getLocation,
  upsertLocation,
  deleteLocation,
};

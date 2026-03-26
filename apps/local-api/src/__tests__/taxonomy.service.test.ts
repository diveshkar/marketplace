import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock repositories ────────────────────────────────────────────

const mockCategoryRepo = {
  scanAll: vi.fn(),
  getBySlug: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockLocationRepo = {
  scanAll: vi.fn(),
  getBySlug: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../repositories/category.repository.js', () => ({
  categoryRepository: mockCategoryRepo,
}));
vi.mock('../repositories/location.repository.js', () => ({
  locationRepository: mockLocationRepo,
}));

const { taxonomyService } = await import('../services/taxonomy.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Category tests ───────────────────────────────────────────────

describe('taxonomyService — categories', () => {
  const catElectronics = {
    slug: 'electronics',
    name: 'Electronics',
    icon: '📱',
    subcategories: [{ slug: 'phones', name: 'Phones' }],
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('listCategories returns all categories from repo', async () => {
    mockCategoryRepo.scanAll.mockResolvedValue([catElectronics]);
    const result = await taxonomyService.listCategories();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('electronics');
  });

  it('getCategory returns a single category', async () => {
    mockCategoryRepo.getBySlug.mockResolvedValue(catElectronics);
    const result = await taxonomyService.getCategory('electronics');
    expect(result?.name).toBe('Electronics');
  });

  it('getCategory returns null for non-existent slug', async () => {
    mockCategoryRepo.getBySlug.mockResolvedValue(null);
    const result = await taxonomyService.getCategory('nope');
    expect(result).toBeNull();
  });

  it('upsertCategory creates new category with current timestamp', async () => {
    mockCategoryRepo.getBySlug.mockResolvedValue(null);
    mockCategoryRepo.put.mockResolvedValue(undefined);

    const result = await taxonomyService.upsertCategory({
      slug: 'vehicles',
      name: 'Vehicles',
      icon: '🚗',
      subcategories: [],
      sortOrder: 1,
    });

    expect(result.slug).toBe('vehicles');
    expect(result.name).toBe('Vehicles');
    expect(result.createdAt).toBeTruthy();
    expect(mockCategoryRepo.put).toHaveBeenCalledOnce();
  });

  it('upsertCategory preserves createdAt when updating existing', async () => {
    mockCategoryRepo.getBySlug.mockResolvedValue(catElectronics);
    mockCategoryRepo.put.mockResolvedValue(undefined);

    const result = await taxonomyService.upsertCategory({
      slug: 'electronics',
      name: 'Electronics & Gadgets',
      icon: '📱',
      subcategories: [],
      sortOrder: 0,
    });

    expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(result.name).toBe('Electronics & Gadgets');
  });

  it('deleteCategory calls repo delete', async () => {
    mockCategoryRepo.delete.mockResolvedValue(undefined);
    await taxonomyService.deleteCategory('electronics');
    expect(mockCategoryRepo.delete).toHaveBeenCalledWith('electronics');
  });
});

// ── Location tests ───────────────────────────────────────────────

describe('taxonomyService — locations', () => {
  const western = {
    slug: 'western',
    name: 'Western Province',
    districts: [
      {
        slug: 'colombo',
        name: 'Colombo',
        cities: [{ slug: 'colombo-city', name: 'Colombo City' }],
      },
    ],
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('listLocations returns all locations from repo', async () => {
    mockLocationRepo.scanAll.mockResolvedValue([western]);
    const result = await taxonomyService.listLocations();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('western');
  });

  it('getLocation returns a single location', async () => {
    mockLocationRepo.getBySlug.mockResolvedValue(western);
    const result = await taxonomyService.getLocation('western');
    expect(result?.name).toBe('Western Province');
    expect(result?.districts).toHaveLength(1);
    expect(result?.districts[0].cities).toHaveLength(1);
  });

  it('getLocation returns null for non-existent slug', async () => {
    mockLocationRepo.getBySlug.mockResolvedValue(null);
    const result = await taxonomyService.getLocation('nope');
    expect(result).toBeNull();
  });

  it('upsertLocation creates new location', async () => {
    mockLocationRepo.getBySlug.mockResolvedValue(null);
    mockLocationRepo.put.mockResolvedValue(undefined);

    const result = await taxonomyService.upsertLocation({
      slug: 'central',
      name: 'Central Province',
      districts: [{ slug: 'kandy', name: 'Kandy', cities: [] }],
      sortOrder: 1,
    });

    expect(result.slug).toBe('central');
    expect(result.districts).toHaveLength(1);
    expect(mockLocationRepo.put).toHaveBeenCalledOnce();
  });

  it('upsertLocation preserves createdAt when updating existing', async () => {
    mockLocationRepo.getBySlug.mockResolvedValue(western);
    mockLocationRepo.put.mockResolvedValue(undefined);

    const result = await taxonomyService.upsertLocation({
      slug: 'western',
      name: 'Western',
      districts: [],
      sortOrder: 0,
    });

    expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('deleteLocation calls repo delete', async () => {
    mockLocationRepo.delete.mockResolvedValue(undefined);
    await taxonomyService.deleteLocation('western');
    expect(mockLocationRepo.delete).toHaveBeenCalledWith('western');
  });
});

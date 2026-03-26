export type Category = {
  slug: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
};

export type Subcategory = {
  slug: string;
  name: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    icon: '💻',
    subcategories: [
      { slug: 'mobile-phones', name: 'Mobile Phones' },
      { slug: 'mobile-phone-accessories', name: 'Mobile Phone Accessories' },
      { slug: 'computers-tablets', name: 'Computers & Tablets' },
      { slug: 'tvs', name: 'TVs' },
      { slug: 'cameras', name: 'Cameras' },
      { slug: 'audio-mp3', name: 'Audio & MP3' },
      { slug: 'video-games-consoles', name: 'Video Games & Consoles' },
      { slug: 'networking-equipment', name: 'Networking & Equipment' },
      { slug: 'other-electronics', name: 'Other Electronics' },
    ],
  },
  {
    slug: 'vehicles',
    name: 'Vehicles',
    icon: '🚗',
    subcategories: [
      { slug: 'cars', name: 'Cars' },
      { slug: 'motorbikes', name: 'Motorbikes & Scooters' },
      { slug: 'three-wheelers', name: 'Three Wheelers' },
      { slug: 'vans', name: 'Vans' },
      { slug: 'buses', name: 'Buses' },
      { slug: 'lorries-trucks', name: 'Lorries & Trucks' },
      { slug: 'bicycles', name: 'Bicycles' },
      { slug: 'vehicle-parts', name: 'Vehicle Parts & Accessories' },
      { slug: 'other-vehicles', name: 'Other Vehicles' },
    ],
  },
  {
    slug: 'property',
    name: 'Property',
    icon: '🏠',
    subcategories: [
      { slug: 'houses', name: 'Houses' },
      { slug: 'apartments', name: 'Apartments' },
      { slug: 'rooms', name: 'Rooms' },
      { slug: 'land', name: 'Land' },
      { slug: 'commercial-property', name: 'Commercial Property' },
      { slug: 'other-property', name: 'Other Property' },
    ],
  },
  {
    slug: 'home-garden',
    name: 'Home & Garden',
    icon: '🪴',
    subcategories: [
      { slug: 'furniture', name: 'Furniture' },
      { slug: 'garden-items', name: 'Garden Items' },
      { slug: 'appliances', name: 'Home Appliances' },
      { slug: 'kitchen-items', name: 'Kitchen Items' },
      { slug: 'bathroom', name: 'Bathroom' },
      { slug: 'lighting-fans', name: 'Lighting & Fans' },
      { slug: 'other-home', name: 'Other Home & Garden' },
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    icon: '👕',
    subcategories: [
      { slug: 'mens-clothing', name: "Men's Clothing" },
      { slug: 'womens-clothing', name: "Women's Clothing" },
      { slug: 'kids-clothing', name: "Kids' Clothing" },
      { slug: 'shoes', name: 'Shoes' },
      { slug: 'watches', name: 'Watches' },
      { slug: 'jewelry', name: 'Jewelry' },
      { slug: 'bags', name: 'Bags & Luggage' },
      { slug: 'other-fashion', name: 'Other Fashion' },
    ],
  },
  {
    slug: 'services',
    name: 'Services',
    icon: '🔧',
    subcategories: [
      { slug: 'construction', name: 'Construction & Repair' },
      { slug: 'education-classes', name: 'Education & Classes' },
      { slug: 'beauty-health', name: 'Beauty & Health' },
      { slug: 'event-services', name: 'Event Services' },
      { slug: 'transport-movers', name: 'Transport & Movers' },
      { slug: 'cleaning', name: 'Cleaning' },
      { slug: 'it-services', name: 'IT Services' },
      { slug: 'other-services', name: 'Other Services' },
    ],
  },
  {
    slug: 'jobs',
    name: 'Jobs',
    icon: '💼',
    subcategories: [
      { slug: 'it-jobs', name: 'IT & Software' },
      { slug: 'accounting-finance', name: 'Accounting & Finance' },
      { slug: 'marketing-sales', name: 'Marketing & Sales' },
      { slug: 'teaching', name: 'Teaching & Education' },
      { slug: 'healthcare', name: 'Healthcare' },
      { slug: 'hospitality', name: 'Hospitality & Tourism' },
      { slug: 'driving', name: 'Driving' },
      { slug: 'part-time', name: 'Part-time' },
      { slug: 'other-jobs', name: 'Other Jobs' },
    ],
  },
  {
    slug: 'animals',
    name: 'Animals',
    icon: '🐾',
    subcategories: [
      { slug: 'dogs', name: 'Dogs' },
      { slug: 'cats', name: 'Cats' },
      { slug: 'fish', name: 'Fish' },
      { slug: 'birds', name: 'Birds' },
      { slug: 'pet-accessories', name: 'Pet Accessories' },
      { slug: 'other-animals', name: 'Other Animals' },
    ],
  },
  {
    slug: 'sports',
    name: 'Sports & Fitness',
    icon: '⚽',
    subcategories: [
      { slug: 'gym-equipment', name: 'Gym & Fitness Equipment' },
      { slug: 'cricket', name: 'Cricket' },
      { slug: 'football', name: 'Football' },
      { slug: 'badminton-tennis', name: 'Badminton & Tennis' },
      { slug: 'cycling', name: 'Cycling' },
      { slug: 'water-sports', name: 'Water Sports' },
      { slug: 'other-sports', name: 'Other Sports' },
    ],
  },
  {
    slug: 'education',
    name: 'Education',
    icon: '📚',
    subcategories: [
      { slug: 'books', name: 'Books' },
      { slug: 'courses-tuition', name: 'Courses & Tuition' },
      { slug: 'stationery', name: 'Stationery' },
      { slug: 'musical-instruments', name: 'Musical Instruments' },
      { slug: 'other-education', name: 'Other Education' },
    ],
  },
  {
    slug: 'business-industry',
    name: 'Business & Industry',
    icon: '🏭',
    subcategories: [
      { slug: 'industrial-machinery', name: 'Industrial Machinery' },
      { slug: 'office-supplies', name: 'Office Supplies' },
      { slug: 'raw-materials', name: 'Raw Materials' },
      { slug: 'agriculture', name: 'Agriculture' },
      { slug: 'other-business', name: 'Other Business' },
    ],
  },
  {
    slug: 'other',
    name: 'Other',
    icon: '📦',
    subcategories: [
      { slug: 'other-items', name: 'Other Items' },
    ],
  },
];

/** Lookup helpers */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(
  categorySlug: string,
  subcategorySlug: string
): Subcategory | undefined {
  const cat = getCategoryBySlug(categorySlug);
  return cat?.subcategories.find((s) => s.slug === subcategorySlug);
}

export function getCategoryName(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? slug;
}

export function getSubcategoryName(
  categorySlug: string,
  subcategorySlug: string
): string {
  return getSubcategoryBySlug(categorySlug, subcategorySlug)?.name ?? subcategorySlug;
}

export function isValidCategory(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}

export function isValidSubcategory(
  categorySlug: string,
  subcategorySlug: string
): boolean {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return false;
  return cat.subcategories.some((s) => s.slug === subcategorySlug);
}

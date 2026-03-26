export type Province = {
  slug: string;
  name: string;
  districts: District[];
};

export type District = {
  slug: string;
  name: string;
  cities: City[];
};

export type City = {
  slug: string;
  name: string;
};

export const PROVINCES: Province[] = [
  {
    slug: 'western',
    name: 'Western Province',
    districts: [
      {
        slug: 'colombo',
        name: 'Colombo',
        cities: [
          { slug: 'colombo', name: 'Colombo' },
          { slug: 'dehiwala', name: 'Dehiwala-Mount Lavinia' },
          { slug: 'moratuwa', name: 'Moratuwa' },
          { slug: 'kotte', name: 'Sri Jayawardenepura Kotte' },
          { slug: 'kolonnawa', name: 'Kolonnawa' },
          { slug: 'kaduwela', name: 'Kaduwela' },
          { slug: 'maharagama', name: 'Maharagama' },
          { slug: 'piliyandala', name: 'Piliyandala' },
          { slug: 'nugegoda', name: 'Nugegoda' },
          { slug: 'boralesgamuwa', name: 'Boralesgamuwa' },
        ],
      },
      {
        slug: 'gampaha',
        name: 'Gampaha',
        cities: [
          { slug: 'gampaha', name: 'Gampaha' },
          { slug: 'negombo', name: 'Negombo' },
          { slug: 'wattala', name: 'Wattala' },
          { slug: 'ja-ela', name: 'Ja-Ela' },
          { slug: 'kadawatha', name: 'Kadawatha' },
          { slug: 'minuwangoda', name: 'Minuwangoda' },
          { slug: 'kandana', name: 'Kandana' },
          { slug: 'ragama', name: 'Ragama' },
        ],
      },
      {
        slug: 'kalutara',
        name: 'Kalutara',
        cities: [
          { slug: 'kalutara', name: 'Kalutara' },
          { slug: 'panadura', name: 'Panadura' },
          { slug: 'horana', name: 'Horana' },
          { slug: 'beruwala', name: 'Beruwala' },
          { slug: 'bandaragama', name: 'Bandaragama' },
        ],
      },
    ],
  },
  {
    slug: 'central',
    name: 'Central Province',
    districts: [
      {
        slug: 'kandy',
        name: 'Kandy',
        cities: [
          { slug: 'kandy', name: 'Kandy' },
          { slug: 'peradeniya', name: 'Peradeniya' },
          { slug: 'katugastota', name: 'Katugastota' },
          { slug: 'gampola', name: 'Gampola' },
          { slug: 'nawalapitiya', name: 'Nawalapitiya' },
        ],
      },
      {
        slug: 'matale',
        name: 'Matale',
        cities: [
          { slug: 'matale', name: 'Matale' },
          { slug: 'dambulla', name: 'Dambulla' },
          { slug: 'sigiriya', name: 'Sigiriya' },
        ],
      },
      {
        slug: 'nuwara-eliya',
        name: 'Nuwara Eliya',
        cities: [
          { slug: 'nuwara-eliya', name: 'Nuwara Eliya' },
          { slug: 'hatton', name: 'Hatton' },
          { slug: 'bandarawela', name: 'Bandarawela' },
        ],
      },
    ],
  },
  {
    slug: 'southern',
    name: 'Southern Province',
    districts: [
      {
        slug: 'galle',
        name: 'Galle',
        cities: [
          { slug: 'galle', name: 'Galle' },
          { slug: 'hikkaduwa', name: 'Hikkaduwa' },
          { slug: 'ambalangoda', name: 'Ambalangoda' },
          { slug: 'unawatuna', name: 'Unawatuna' },
        ],
      },
      {
        slug: 'matara',
        name: 'Matara',
        cities: [
          { slug: 'matara', name: 'Matara' },
          { slug: 'weligama', name: 'Weligama' },
          { slug: 'mirissa', name: 'Mirissa' },
          { slug: 'dikwella', name: 'Dikwella' },
        ],
      },
      {
        slug: 'hambantota',
        name: 'Hambantota',
        cities: [
          { slug: 'hambantota', name: 'Hambantota' },
          { slug: 'tangalle', name: 'Tangalle' },
          { slug: 'tissamaharama', name: 'Tissamaharama' },
        ],
      },
    ],
  },
  {
    slug: 'northern',
    name: 'Northern Province',
    districts: [
      {
        slug: 'jaffna',
        name: 'Jaffna',
        cities: [
          { slug: 'jaffna', name: 'Jaffna' },
          { slug: 'chavakachcheri', name: 'Chavakachcheri' },
          { slug: 'point-pedro', name: 'Point Pedro' },
        ],
      },
      {
        slug: 'kilinochchi',
        name: 'Kilinochchi',
        cities: [{ slug: 'kilinochchi', name: 'Kilinochchi' }],
      },
      {
        slug: 'mullaitivu',
        name: 'Mullaitivu',
        cities: [{ slug: 'mullaitivu', name: 'Mullaitivu' }],
      },
      {
        slug: 'vavuniya',
        name: 'Vavuniya',
        cities: [{ slug: 'vavuniya', name: 'Vavuniya' }],
      },
      {
        slug: 'mannar',
        name: 'Mannar',
        cities: [{ slug: 'mannar', name: 'Mannar' }],
      },
    ],
  },
  {
    slug: 'eastern',
    name: 'Eastern Province',
    districts: [
      {
        slug: 'trincomalee',
        name: 'Trincomalee',
        cities: [
          { slug: 'trincomalee', name: 'Trincomalee' },
          { slug: 'kinniya', name: 'Kinniya' },
        ],
      },
      {
        slug: 'batticaloa',
        name: 'Batticaloa',
        cities: [
          { slug: 'batticaloa', name: 'Batticaloa' },
          { slug: 'kattankudy', name: 'Kattankudy' },
        ],
      },
      {
        slug: 'ampara',
        name: 'Ampara',
        cities: [
          { slug: 'ampara', name: 'Ampara' },
          { slug: 'kalmunai', name: 'Kalmunai' },
        ],
      },
    ],
  },
  {
    slug: 'north-western',
    name: 'North Western Province',
    districts: [
      {
        slug: 'kurunegala',
        name: 'Kurunegala',
        cities: [
          { slug: 'kurunegala', name: 'Kurunegala' },
          { slug: 'kuliyapitiya', name: 'Kuliyapitiya' },
          { slug: 'narammala', name: 'Narammala' },
        ],
      },
      {
        slug: 'puttalam',
        name: 'Puttalam',
        cities: [
          { slug: 'puttalam', name: 'Puttalam' },
          { slug: 'chilaw', name: 'Chilaw' },
          { slug: 'wennappuwa', name: 'Wennappuwa' },
        ],
      },
    ],
  },
  {
    slug: 'north-central',
    name: 'North Central Province',
    districts: [
      {
        slug: 'anuradhapura',
        name: 'Anuradhapura',
        cities: [
          { slug: 'anuradhapura', name: 'Anuradhapura' },
          { slug: 'medawachchiya', name: 'Medawachchiya' },
        ],
      },
      {
        slug: 'polonnaruwa',
        name: 'Polonnaruwa',
        cities: [
          { slug: 'polonnaruwa', name: 'Polonnaruwa' },
          { slug: 'kaduruwela', name: 'Kaduruwela' },
        ],
      },
    ],
  },
  {
    slug: 'uva',
    name: 'Uva Province',
    districts: [
      {
        slug: 'badulla',
        name: 'Badulla',
        cities: [
          { slug: 'badulla', name: 'Badulla' },
          { slug: 'bandarawela-uva', name: 'Bandarawela' },
          { slug: 'ella', name: 'Ella' },
        ],
      },
      {
        slug: 'monaragala',
        name: 'Monaragala',
        cities: [
          { slug: 'monaragala', name: 'Monaragala' },
          { slug: 'wellawaya', name: 'Wellawaya' },
        ],
      },
    ],
  },
  {
    slug: 'sabaragamuwa',
    name: 'Sabaragamuwa Province',
    districts: [
      {
        slug: 'ratnapura',
        name: 'Ratnapura',
        cities: [
          { slug: 'ratnapura', name: 'Ratnapura' },
          { slug: 'embilipitiya', name: 'Embilipitiya' },
          { slug: 'balangoda', name: 'Balangoda' },
        ],
      },
      {
        slug: 'kegalle',
        name: 'Kegalle',
        cities: [
          { slug: 'kegalle', name: 'Kegalle' },
          { slug: 'mawanella', name: 'Mawanella' },
          { slug: 'rambukkana', name: 'Rambukkana' },
        ],
      },
    ],
  },
];

/** Lookup helpers */
export function getProvinceBySlug(slug: string): Province | undefined {
  return PROVINCES.find((p) => p.slug === slug);
}

export function getDistrictBySlug(
  provinceSlug: string,
  districtSlug: string
): District | undefined {
  const prov = getProvinceBySlug(provinceSlug);
  return prov?.districts.find((d) => d.slug === districtSlug);
}

export function getCityBySlug(
  provinceSlug: string,
  districtSlug: string,
  citySlug: string
): City | undefined {
  const dist = getDistrictBySlug(provinceSlug, districtSlug);
  return dist?.cities.find((c) => c.slug === citySlug);
}

export function getDistrictName(provinceSlug: string, districtSlug: string): string {
  return getDistrictBySlug(provinceSlug, districtSlug)?.name ?? districtSlug;
}

export function getCityName(
  provinceSlug: string,
  districtSlug: string,
  citySlug: string
): string {
  return getCityBySlug(provinceSlug, districtSlug, citySlug)?.name ?? citySlug;
}

/** Flat list of all districts for quick access */
export function getAllDistricts(): { provinceSlug: string; districtSlug: string; name: string }[] {
  const result: { provinceSlug: string; districtSlug: string; name: string }[] = [];
  for (const prov of PROVINCES) {
    for (const dist of prov.districts) {
      result.push({ provinceSlug: prov.slug, districtSlug: dist.slug, name: dist.name });
    }
  }
  return result;
}

/** Flat list of all cities for quick access */
export function getAllCities(): { provinceSlug: string; districtSlug: string; citySlug: string; name: string }[] {
  const result: { provinceSlug: string; districtSlug: string; citySlug: string; name: string }[] = [];
  for (const prov of PROVINCES) {
    for (const dist of prov.districts) {
      for (const city of dist.cities) {
        result.push({
          provinceSlug: prov.slug,
          districtSlug: dist.slug,
          citySlug: city.slug,
          name: city.name,
        });
      }
    }
  }
  return result;
}

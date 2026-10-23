/**
 * Pakistan Official Administrative Demarcation
 * Source of Truth for all 174 Districts, Divisions, and Provinces/Territories
 */

export const PAKISTAN_LOCATIONS = [
  {
    province: 'Islamabad Capital Territory',
    divisions: [
      {
        division: 'Islamabad Division',
        districts: ['Islamabad']
      }
    ]
  },
  {
    province: 'Punjab',
    divisions: [
      {
        division: 'Rawalpindi Division',
        districts: ['Rawalpindi', 'Attock', 'Chakwal', 'Jhelum', 'Murree', 'Talagang']
      },
      {
        division: 'Lahore Division',
        districts: ['Lahore', 'Kasur', 'Nankana Sahib', 'Sheikhupura']
      },
      {
        division: 'Faisalabad Division',
        districts: ['Faisalabad', 'Chiniot', 'Jhang', 'Toba Tek Singh']
      },
      {
        division: 'Gujranwala Division',
        districts: ['Gujranwala', 'Gujrat', 'Hafizabad', 'Mandi Bahauddin', 'Narowal', 'Sialkot', 'Wazirabad']
      },
      {
        division: 'Multan Division',
        districts: ['Multan', 'Khanewal', 'Lodhran', 'Vehari']
      },
      {
        division: 'Sargodha Division',
        districts: ['Sargodha', 'Bhakkar', 'Khushab', 'Mianwali']
      },
      {
        division: 'Bahawalpur Division',
        districts: ['Bahawalpur', 'Bahawalnagar', 'Rahim Yar Khan']
      },
      {
        division: 'Sahiwal Division',
        districts: ['Sahiwal', 'Okara', 'Pakpattan']
      },
      {
        division: 'Dera Ghazi Khan Division',
        districts: ['Dera Ghazi Khan', 'Kot Addu', 'Layyah', 'Muzaffargarh', 'Rajanpur', 'Taunsa']
      }
    ]
  },
  {
    province: 'Sindh',
    divisions: [
      {
        division: 'Karachi Division',
        districts: ['Karachi', 'Karachi Central', 'Karachi East', 'Karachi South', 'Karachi West', 'Keamari', 'Korangi', 'Malir']
      },
      {
        division: 'Hyderabad Division',
        districts: ['Hyderabad', 'Badin', 'Dadu', 'Jamshoro', 'Matiari', 'Sujawal', 'Tando Allahyar', 'Tando Muhammad Khan', 'Thatta']
      },
      {
        division: 'Sukkur Division',
        districts: ['Sukkur', 'Ghotki', 'Khairpur']
      },
      {
        division: 'Larkana Division',
        districts: ['Larkana', 'Jacobabad', 'Kashmore', 'Qambar Shahdadkot', 'Shikarpur']
      },
      {
        division: 'Mirpur Khas Division',
        districts: ['Mirpur Khas', 'Tharparkar', 'Umerkot']
      },
      {
        division: 'Shaheed Benazirabad Division',
        districts: ['Shaheed Benazirabad', 'Naushahro Feroze', 'Sanghar']
      }
    ]
  },
  {
    province: 'Khyber Pakhtunkhwa',
    divisions: [
      {
        division: 'Peshawar Division',
        districts: ['Peshawar', 'Charsadda', 'Khyber', 'Mohmand', 'Nowshera']
      },
      {
        division: 'Mardan Division',
        districts: ['Mardan', 'Swabi']
      },
      {
        division: 'Malakand Division',
        districts: ['Swat', 'Bajaur', 'Buner', 'Chitral Lower', 'Chitral Upper', 'Dir Lower', 'Dir Upper', 'Malakand', 'Shangla']
      },
      {
        division: 'Hazara Division',
        districts: ['Abbottabad', 'Allai', 'Battagram', 'Haripur', 'Kohistan Lower', 'Kohistan Upper', 'Kolai-Palas', 'Mansehra', 'Torghar']
      },
      {
        division: 'Kohat Division',
        districts: ['Kohat', 'Hangu', 'Karak', 'Kurram', 'Orakzai']
      },
      {
        division: 'Bannu Division',
        districts: ['Bannu', 'Lakki Marwat', 'North Waziristan']
      },
      {
        division: 'Dera Ismail Khan Division',
        districts: ['Dera Ismail Khan', 'South Waziristan Lower', 'South Waziristan Upper', 'Tank', 'Wana']
      }
    ]
  },
  {
    province: 'Balochistan',
    divisions: [
      {
        division: 'Quetta Division',
        districts: ['Quetta', 'Chaman', 'Killa Abdullah', 'Pishin', 'Karezat']
      },
      {
        division: 'Kalat Division',
        districts: ['Kalat', 'Awaran', 'Hub', 'Khuzdar', 'Lasbela', 'Mastung', 'Surab']
      },
      {
        division: 'Makran Division',
        districts: ['Gwadar', 'Kech', 'Panjgur']
      },
      {
        division: 'Nasirabad Division',
        districts: ['Nasirabad', 'Jaffarabad', 'Jhal Magsi', 'Kachhi', 'Sohbatpur', 'Usta Muhammad']
      },
      {
        division: 'Sibi Division',
        districts: ['Sibi', 'Dera Bugti', 'Harnai', 'Kohlu', 'Ziarat']
      },
      {
        division: 'Zhob Division',
        districts: ['Zhob', 'Killa Saifullah', 'Sherani']
      },
      {
        division: 'Loralai Division',
        districts: ['Loralai', 'Barkhan', 'Duki', 'Musakhel']
      },
      {
        division: 'Rakhshan Division',
        districts: ['Chagai', 'Kharan', 'Nushki', 'Washuk']
      }
    ]
  },
  {
    province: 'Azad Jammu & Kashmir',
    divisions: [
      {
        division: 'Mirpur Division',
        districts: ['Mirpur', 'Bhimber', 'Kotli']
      },
      {
        division: 'Muzaffarabad Division',
        districts: ['Muzaffarabad', 'Hattian Bala', 'Neelum']
      },
      {
        division: 'Poonch Division',
        districts: ['Poonch', 'Bagh', 'Haveli', 'Sudhanoti']
      }
    ]
  },
  {
    province: 'Gilgit-Baltistan',
    divisions: [
      {
        division: 'Gilgit Division',
        districts: ['Gilgit', 'Ghizer', 'Gupis-Yasin', 'Hunza', 'Nagar']
      },
      {
        division: 'Baltistan Division',
        districts: ['Skardu', 'Ghanche', 'Kharmang', 'Roundu', 'Shigar']
      },
      {
        division: 'Diamer Division',
        districts: ['Diamer', 'Astore', 'Darel', 'Tangir']
      }
    ]
  }
];

// Top metropolitan cities for quick 1-click selection chips
export const POPULAR_CITIES = [
  'Islamabad',
  'Rawalpindi',
  'Lahore',
  'Karachi Central',
  'Peshawar',
  'Faisalabad',
  'Multan',
  'Gujranwala',
  'Sialkot',
  'Quetta',
  'Hyderabad',
  'Abbottabad'
];

// Flattened, unique, alphabetically sorted array of all 174 districts
export const ALL_PAKISTAN_CITIES = Array.from(
  new Set(
    PAKISTAN_LOCATIONS.flatMap((prov) =>
      prov.divisions.flatMap((div) => div.districts)
    )
  )
).sort((a, b) => a.localeCompare(b));

// Quick lookup map: City Name -> { province, division, district }
const LOCATION_LOOKUP = new Map();
PAKISTAN_LOCATIONS.forEach((prov) => {
  prov.divisions.forEach((div) => {
    div.districts.forEach((dist) => {
      LOCATION_LOOKUP.set(dist.toLowerCase(), {
        district: dist,
        division: div.division,
        province: prov.province
      });
    });
  });
});

/**
 * Returns metadata (province, division) for a given district name
 */
export function getLocationMeta(cityName) {
  if (!cityName) return null;
  return LOCATION_LOOKUP.get(cityName.toLowerCase().trim()) || null;
}

/**
 * Check if a city is in the verified districts list
 */
export function isValidDistrict(cityName) {
  if (!cityName) return false;
  return LOCATION_LOOKUP.has(cityName.toLowerCase().trim());
}

/**
 * Filtered search across districts, divisions, and provinces
 */
export function searchLocations(query) {
  if (!query || !query.trim()) {
    return PAKISTAN_LOCATIONS;
  }
  const q = query.toLowerCase().trim();

  return PAKISTAN_LOCATIONS.map((prov) => {
    const provMatch = prov.province.toLowerCase().includes(q);

    const matchingDivisions = prov.divisions.map((div) => {
      const divMatch = div.division.toLowerCase().includes(q);

      const matchingDistricts = div.districts.filter((dist) =>
        provMatch || divMatch || dist.toLowerCase().includes(q)
      );

      if (matchingDistricts.length > 0) {
        return {
          division: div.division,
          districts: matchingDistricts
        };
      }
      return null;
    }).filter(Boolean);

    if (matchingDivisions.length > 0) {
      return {
        province: prov.province,
        divisions: matchingDivisions
      };
    }
    return null;
  }).filter(Boolean);
}

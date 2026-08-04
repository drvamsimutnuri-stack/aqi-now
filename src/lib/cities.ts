/** Curated cities that get their own pre-rendered page for search traffic. */
export interface City {
  slug: string;
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  { slug: "delhi", name: "Delhi", region: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { slug: "mumbai", name: "Mumbai", region: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777 },
  { slug: "bengaluru", name: "Bengaluru", region: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { slug: "hyderabad", name: "Hyderabad", region: "Telangana", country: "India", latitude: 17.385, longitude: 78.4867 },
  { slug: "chennai", name: "Chennai", region: "Tamil Nadu", country: "India", latitude: 13.0827, longitude: 80.2707 },
  { slug: "kolkata", name: "Kolkata", region: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { slug: "pune", name: "Pune", region: "Maharashtra", country: "India", latitude: 18.5204, longitude: 73.8567 },
  { slug: "ahmedabad", name: "Ahmedabad", region: "Gujarat", country: "India", latitude: 23.0225, longitude: 72.5714 },
  { slug: "lahore", name: "Lahore", country: "Pakistan", latitude: 31.5204, longitude: 74.3587 },
  { slug: "karachi", name: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011 },
  { slug: "dhaka", name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125 },
  { slug: "kathmandu", name: "Kathmandu", country: "Nepal", latitude: 27.7172, longitude: 85.324 },
  { slug: "beijing", name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074 },
  { slug: "shanghai", name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737 },
  { slug: "hong-kong", name: "Hong Kong", country: "China", latitude: 22.3193, longitude: 114.1694 },
  { slug: "seoul", name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.978 },
  { slug: "tokyo", name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { slug: "bangkok", name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018 },
  { slug: "jakarta", name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456 },
  { slug: "hanoi", name: "Hanoi", country: "Vietnam", latitude: 21.0278, longitude: 105.8342 },
  { slug: "singapore", name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
  { slug: "manila", name: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842 },
  { slug: "dubai", name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { slug: "tehran", name: "Tehran", country: "Iran", latitude: 35.6892, longitude: 51.389 },
  { slug: "riyadh", name: "Riyadh", country: "Saudi Arabia", latitude: 24.7136, longitude: 46.6753 },
  { slug: "cairo", name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357 },
  { slug: "lagos", name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792 },
  { slug: "nairobi", name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219 },
  { slug: "johannesburg", name: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473 },
  { slug: "istanbul", name: "Istanbul", country: "Türkiye", latitude: 41.0082, longitude: 28.9784 },
  { slug: "london", name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { slug: "paris", name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { slug: "berlin", name: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.405 },
  { slug: "madrid", name: "Madrid", country: "Spain", latitude: 40.4168, longitude: -3.7038 },
  { slug: "rome", name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964 },
  { slug: "milan", name: "Milan", country: "Italy", latitude: 45.4642, longitude: 9.19 },
  { slug: "warsaw", name: "Warsaw", country: "Poland", latitude: 52.2297, longitude: 21.0122 },
  { slug: "moscow", name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6173 },
  { slug: "new-york", name: "New York", region: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
  { slug: "los-angeles", name: "Los Angeles", region: "California", country: "United States", latitude: 34.0522, longitude: -118.2437 },
  { slug: "chicago", name: "Chicago", region: "Illinois", country: "United States", latitude: 41.8781, longitude: -87.6298 },
  { slug: "houston", name: "Houston", region: "Texas", country: "United States", latitude: 29.7604, longitude: -95.3698 },
  { slug: "san-francisco", name: "San Francisco", region: "California", country: "United States", latitude: 37.7749, longitude: -122.4194 },
  { slug: "seattle", name: "Seattle", region: "Washington", country: "United States", latitude: 47.6062, longitude: -122.3321 },
  { slug: "denver", name: "Denver", region: "Colorado", country: "United States", latitude: 39.7392, longitude: -104.9903 },
  { slug: "phoenix", name: "Phoenix", region: "Arizona", country: "United States", latitude: 33.4484, longitude: -112.074 },
  { slug: "toronto", name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832 },
  { slug: "vancouver", name: "Vancouver", country: "Canada", latitude: 49.2827, longitude: -123.1207 },
  { slug: "mexico-city", name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332 },
  { slug: "bogota", name: "Bogotá", country: "Colombia", latitude: 4.711, longitude: -74.0721 },
  { slug: "lima", name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428 },
  { slug: "santiago", name: "Santiago", country: "Chile", latitude: -33.4489, longitude: -70.6693 },
  { slug: "sao-paulo", name: "São Paulo", country: "Brazil", latitude: -23.5505, longitude: -46.6333 },
  { slug: "buenos-aires", name: "Buenos Aires", country: "Argentina", latitude: -34.6037, longitude: -58.3816 },
  { slug: "sydney", name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { slug: "melbourne", name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631 },
  { slug: "auckland", name: "Auckland", country: "New Zealand", latitude: -36.8485, longitude: 174.7633 },
];

export function findCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/** Cities shown as quick links on the home page. */
export const FEATURED_SLUGS = [
  "delhi",
  "mumbai",
  "hyderabad",
  "bengaluru",
  "lahore",
  "dhaka",
  "beijing",
  "jakarta",
  "london",
  "new-york",
  "los-angeles",
  "tokyo",
];

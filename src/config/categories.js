// Central category registry. Every other part of the app (nav, home grid,
// category pages, filters) reads from this single source of truth so a new
// category only needs to be added here + given a data file.

export const CATEGORIES = [
  {
    id: 'pms',
    name: 'Property Management Systems',
    shortName: 'PMS',
    route: '/pms',
    dataFile: 'pms',
    color: 'indigo',
    icon: 'Building2',
    description:
      'Software that runs the day-to-day operations of hotels and properties — reservations, housekeeping, billing and front-desk operations.',
  },
  {
    id: 'crs',
    name: 'Central Reservation Systems',
    shortName: 'CRS',
    route: '/crs',
    dataFile: 'crs',
    color: 'teal',
    icon: 'Server',
    description:
      'The backbone systems that manage rates, inventory and availability across a hotel or chain’s many distribution channels.',
  },
  {
    id: 'airline-aggregators',
    name: 'Airline Aggregators',
    shortName: 'Airlines',
    route: '/airline-aggregators',
    dataFile: 'airline-aggregators',
    color: 'sky',
    icon: 'Plane',
    description:
      'GDS and API platforms that aggregate airline fares and inventory for travel agencies, OTAs and corporate booking tools.',
  },
  {
    id: 'hotel-aggregators',
    name: 'Hotel Aggregators',
    shortName: 'Hotels',
    route: '/hotel-aggregators',
    dataFile: 'hotel-aggregators',
    color: 'amber',
    icon: 'Hotel',
    description:
      'Wholesale hotel supply platforms giving resellers API access to global accommodation inventory and net rates.',
  },
  {
    id: 'rail-aggregators',
    name: 'Rail Aggregators',
    shortName: 'Rail',
    route: '/rail-aggregators',
    dataFile: 'rail-aggregators',
    color: 'emerald',
    icon: 'TrainFront',
    description:
      'API platforms aggregating rail operator content across countries so resellers can sell rail as easily as flights.',
  },
  {
    id: 'cruise-aggregators',
    name: 'Liveaboard & Cruise Aggregators',
    shortName: 'Cruise',
    route: '/cruise-aggregators',
    dataFile: 'cruise-aggregators',
    color: 'cyan',
    icon: 'Ship',
    description:
      'Booking and distribution platforms specialising in cruise lines, liveaboard diving trips and river cruises.',
  },
  {
    id: 'channel-managers',
    name: 'Channel Managers',
    shortName: 'Channel Mgrs',
    route: '/channel-managers',
    dataFile: 'channel-managers',
    color: 'violet',
    icon: 'Share2',
    description:
      'Tools that sync rates, availability and inventory in real time across every OTA and channel a property sells on.',
  },
  {
    id: 'b2b-wholesalers',
    name: 'B2B Wholesalers',
    shortName: 'Wholesalers',
    route: '/b2b-wholesalers',
    dataFile: 'b2b-wholesalers',
    color: 'orange',
    icon: 'Warehouse',
    description:
      'Bed banks and wholesale travel suppliers providing net-rate accommodation and ancillary content to trade partners.',
  },
  {
    id: 'booking-distribution',
    name: 'Booking & Distribution Platforms',
    shortName: 'Booking',
    route: '/booking-distribution',
    dataFile: 'booking-distribution',
    color: 'rose',
    icon: 'Network',
    description:
      'End-to-end booking engines and distribution technology connecting suppliers, resellers and travel sellers.',
  },
  {
    id: 'ota',
    name: 'OTA & Travel Aggregators',
    shortName: 'OTA',
    route: '/ota',
    dataFile: 'ota',
    color: 'blue',
    icon: 'Globe2',
    description:
      'Consumer-facing online travel agencies and metasearch aggregators selling flights, hotels and packages directly.',
  },
  {
    id: 'tour-operators',
    name: 'Tour Operators with Own API Distribution',
    shortName: 'Tour Ops',
    route: '/tour-operators',
    dataFile: 'tour-operators',
    color: 'lime',
    icon: 'Map',
    description:
      'Tour and package operators that expose their own inventory via API for B2B resale by agents and OTAs.',
  },
  {
    id: 'rail-meta',
    name: 'Rail Meta Booking Engines',
    shortName: 'Rail Meta',
    route: '/rail-meta',
    dataFile: 'rail-meta',
    color: 'fuchsia',
    icon: 'Route',
    description:
      'Metasearch and booking engines comparing rail fares across multiple operators and countries in one interface.',
  },
]

export const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id)

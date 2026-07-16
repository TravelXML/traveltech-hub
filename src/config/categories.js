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
      'Software that runs the day-to-day operations of hotels and properties - reservations, housekeeping, billing and front-desk operations.',
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
  {
    id: 'hotel-reservations',
    name: 'Hotel Reservations Software',
    shortName: 'Reservations',
    route: '/hotel-reservations',
    dataFile: 'hotel-reservations',
    color: 'red',
    icon: 'CalendarCheck',
    description:
      'Reservation platforms that let independent hotels and small chains manage bookings, rates and availability directly.',
  },
  {
    id: 'hotel-management-software',
    name: 'Hotel Management Software',
    shortName: 'Hotel Mgmt',
    route: '/hotel-management-software',
    dataFile: 'hotel-management-software',
    color: 'yellow',
    icon: 'LayoutDashboard',
    description:
      'All-in-one operational software covering front desk, housekeeping, POS and back-office management for properties.',
  },
  {
    id: 'revenue-management',
    name: 'Revenue Management Systems',
    shortName: 'Revenue Mgmt',
    route: '/revenue-management',
    dataFile: 'revenue-management',
    color: 'green',
    icon: 'LineChart',
    description:
      'Dynamic pricing and forecasting engines that optimise hotel room rates against demand, competitors and market data.',
  },
  {
    id: 'booking-engine',
    name: 'Booking Engine',
    shortName: 'Booking Engine',
    route: '/booking-engine',
    dataFile: 'booking-engine',
    color: 'purple',
    icon: 'MousePointerClick',
    description:
      'Direct booking widgets and engines hotels embed on their own websites to convert visitors without OTA commission.',
  },
  {
    id: 'hotel-crm-email-marketing',
    name: 'Hotel CRM & Email Marketing',
    shortName: 'CRM & Email',
    route: '/hotel-crm-email-marketing',
    dataFile: 'hotel-crm-email-marketing',
    color: 'pink',
    icon: 'Mail',
    description:
      'Guest data platforms and email/CRM tools that help hotels build guest profiles and drive repeat direct bookings.',
  },
  {
    id: 'guest-messaging',
    name: 'Guest Messaging Software',
    shortName: 'Messaging',
    route: '/guest-messaging',
    dataFile: 'guest-messaging',
    color: 'stone',
    icon: 'MessageCircle',
    description:
      'Two-way SMS, WhatsApp and chat platforms that let hotel staff communicate with guests before, during and after their stay.',
  },
  {
    id: 'hotel-guest-apps',
    name: 'Hotel Guest Apps',
    shortName: 'Guest Apps',
    route: '/hotel-guest-apps',
    dataFile: 'hotel-guest-apps',
    color: 'gray',
    icon: 'Smartphone',
    description:
      'Mobile and web apps offering guests digital check-in, room service, concierge requests and in-stay information.',
  },
  {
    id: 'keyless-entry',
    name: 'Hotel Keyless Entry Systems',
    shortName: 'Keyless Entry',
    route: '/keyless-entry',
    dataFile: 'keyless-entry',
    color: 'slate',
    icon: 'KeyRound',
    description:
      'Mobile and RFID access control systems letting guests unlock hotel rooms without a physical key card.',
  },
  {
    id: 'travel-tech-marketing',
    name: 'Travel Tech Marketing',
    shortName: 'Marketing',
    route: '/travel-tech-marketing',
    dataFile: 'travel-tech-marketing',
    color: 'zinc',
    icon: 'Megaphone',
    description:
      'Digital marketing agencies, ad-tech and media platforms specialised in reaching travelers on behalf of hotels, destinations and travel brands.',
  },
]

export const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id)

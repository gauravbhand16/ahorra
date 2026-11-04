// All on-screen copy lives here. Brand name is always lowercase: ahorra.
export const EMAIL = 'communications@ahorra.in';
export const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Partnering with ahorra')}`;

export const NAV = [
  { key: 'about', label: 'About' },
  { key: 'how', label: 'How It Works' },
  { key: 'brands', label: 'For Brands' },
  { key: 'contact', label: 'Contact' },
];

export const FOOTER = [{ key: 'home', label: 'Home' }, ...NAV];

// Official Instagram handle shared for ahorra. LinkedIn opens a company search until its exact page URL is added.
export const SOCIAL = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/ahorra-in' },
  { label: 'Instagram', href: 'https://www.instagram.com/ahorra.in/' },
];

export const BLOCKS = [
  {
    id: 'problem',
    range: [-0.02, 0.0, 0.105, 0.14],
    pos: 'left',
    title: 'Turning Surplus into Opportunity.',
    sub: 'We help brands, distributors and retailers find new ways to sell their surplus inventory.',
    big: true,
  },
  {
    id: 'opportunity',
    range: [0.165, 0.2, 0.27, 0.3],
    pos: 'left',
    title: 'Products deserve another opportunity.',
    sub: 'ahorra connects businesses with consumers, moving suitable surplus inventory into a retail network where it can sell again.',
  },
  {
    id: 'how',
    range: [0.3, 0.325, 0.36, 0.385],
    pos: 'left',
    title: 'From surplus inventory to new opportunities.',
  },
  {
    id: 'retail',
    range: [0.572, 0.6, 0.665, 0.69],
    pos: 'left',
    title: 'Better prices. More value.',
    sub: 'ahorra makes suitable products available to consumers at better prices through its retail network.',
    chip: 'Today: kiosks at universities, corporate offices and events',
  },
  {
    id: 'impact',
    range: [0.69, 0.715, 0.78, 0.805],
    pos: 'top',
    title: 'Creating value all around.',
  },
  {
    id: 'future',
    range: [0.815, 0.845, 0.93, 0.95],
    pos: 'left',
    title: 'One network. More opportunities.',
    sub: 'Starting with kiosks, we aim to build a growing network of Green Stores across India.',
    chip: 'Future vision',
  },
];

export const STAGES = [
  { n: 1, label: 'Brands, distributors and retailers reach out to ahorra', from: 0.2 },
  { n: 2, label: 'They dispatch their surplus and near-expiry stock to ahorra', from: 0.255 },
  { n: 3, label: 'ahorra quality-checks every product', from: 0.36 },
  { n: 4, label: 'Eligible products enter the ahorra network', from: 0.43 },
  { n: 5, label: 'Products reach ahorra kiosks', from: 0.5 },
  { n: 6, label: 'A customer picks one up at a better price', from: 0.6 },
];
export const STAGE_RANGE = [0.19, 0.215, 0.665, 0.695];

export const IMPACT = [
  { a: 0.7, title: 'For Businesses', body: 'Less loss on unsold stock, plus an additional sales channel to recover value from surplus inventory.' },
  { a: 0.72, title: 'For Consumers', body: 'Quality products at better prices and more value from everyday spending.' },
  { a: 0.74, title: 'For Products', body: 'Suitable surplus products get another opportunity to sell instead of going to waste.' },
  { a: 0.76, title: 'For the Environment', body: 'When good products are used rather than thrown away, less food is wasted.' },
];

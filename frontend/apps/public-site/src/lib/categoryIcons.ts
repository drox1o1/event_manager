// Lucide icon per seeded category name (src/layers/common/common/migrations
// 0001 seeds exactly these 6). Categories aren't in the DB with an icon
// column, so this stays a small display-only lookup on the frontend.
const CATEGORY_ICONS: Record<string, string> = {
  Music: 'music',
  Comedy: 'mic-2',
  Workshops: 'pencil',
  Sports: 'trophy',
  'Food & Drink': 'utensils',
  Theatre: 'drama',
};

export function iconForCategory(name: string): string {
  return CATEGORY_ICONS[name] ?? 'tag';
}

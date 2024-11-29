export interface GeneralItem {
  id: string;
  type: 'movie' | 'tvshow';
  title: string;
  poster_path: string;
  added_at: string;
}

export interface Collection {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: GeneralItem[];
}
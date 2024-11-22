export interface CollectionItem {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  added_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  items: CollectionItem[];
}
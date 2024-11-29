export interface GeneralItem {
  id: number;
  poster_path: string;
  title: string;
  type: string;
}
export interface Collection {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: GeneralItem[];
}
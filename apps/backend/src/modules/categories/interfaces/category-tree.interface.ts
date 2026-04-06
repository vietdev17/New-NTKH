export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isCombo: boolean;
  tags: string[];
  children: CategoryTreeNode[];
  productCount?: number;
}

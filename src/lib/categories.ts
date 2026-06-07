import prisma from "@/lib/prisma";

export interface SubCategory {
  id: string;
  name: string;
  parentId: string | null;
  children: SubCategory[];
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: SubCategory[];
}

/**
 * Builds a recursive tree from a flat array of categories.
 */
export function buildCategoryTree(categories: any[]): Category[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  // Initialize map with empty children array for each category
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Build the parent-child relationships
  categories.forEach((cat) => {
    const mapped = map.get(cat.id);
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(mapped);
      } else {
        // Parent not in map (orphan), treat as root
        roots.push(mapped);
      }
    } else {
      roots.push(mapped);
    }
  });

  // Sort children by name
  map.forEach((item) => {
    item.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
  });

  // Sort roots by name
  roots.sort((a, b) => a.name.localeCompare(b.name));

  return roots;
}

/**
 * Recursively resolves a category ID and all its descendants.
 */
export async function getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const result: string[] = [categoryId];
  
  const allCats = await prisma.category.findMany({
    select: { id: true, parentId: true }
  });
  
  const childrenMap = new Map<string, string[]>();
  allCats.forEach(c => {
    if (c.parentId) {
      const list = childrenMap.get(c.parentId) || [];
      list.push(c.id);
      childrenMap.set(c.parentId, list);
    }
  });
  
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current);
    if (children) {
      result.push(...children);
      queue.push(...children);
    }
  }
  
  return result;
}

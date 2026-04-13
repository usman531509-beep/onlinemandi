type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

export type CategoryFilterItem = {
  group?: string;
  name: string;
  subcategories?: CategoryNode[];
};

export function normalizeGroupName(group?: string) {
  return group?.trim() || "";
}

export function getGroupOptions(categories: CategoryFilterItem[]) {
  return Array.from(new Set(categories.map((category) => normalizeGroupName(category.group)))).sort();
}

export function getCategoryOptionsForGroup(categories: CategoryFilterItem[], selectedGroup: string) {
  return Array.from(
    new Set(
      categories
        .filter((category) => selectedGroup === "all" || normalizeGroupName(category.group) === selectedGroup)
        .map((category) => category.name)
    )
  ).sort();
}

export function findGroupForCategory(categories: CategoryFilterItem[], categoryName: string) {
  const normalizedCategory = categoryName.trim().toLowerCase();

  for (const category of categories) {
    if (category.name.trim().toLowerCase() === normalizedCategory) {
      return normalizeGroupName(category.group);
    }

    for (const subcategory of category.subcategories || []) {
      if (subcategory.name.trim().toLowerCase() === normalizedCategory) {
        return normalizeGroupName(category.group);
      }

      for (const child of subcategory.children || []) {
        if (child.name.trim().toLowerCase() === normalizedCategory) {
          return normalizeGroupName(category.group);
        }
      }
    }
  }

  return "";
}

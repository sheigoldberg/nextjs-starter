'use client';

import { useState } from 'react';

import { Filter, X } from 'lucide-react';

import { Badge } from './badge';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface FilterSection {
  id: string;
  label: string;
  type: 'tags' | 'date' | 'category'; // Extensible for future filter types
  options?: Tag[]; // For tags or category options
}

interface ContentFilterButtonProps {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagSlug: string) => void;
  onClearFilters: () => void;
  // Future: Add more filter props here
  // selectedDateRange?: DateRange;
  // onDateRangeChange?: (range: DateRange) => void;
}

export function ContentFilterButton({
  tags,
  selectedTags,
  onToggleTag,
  onClearFilters,
}: ContentFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>(selectedTags);

  // Calculate total active filters across all dimensions
  const totalActiveFilters = selectedTags.length; // + other filter counts in future

  // Update temp state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTempSelectedTags(selectedTags);
      // Future: Initialize other temp filter states here
    }
  };

  const toggleTempTag = (tagSlug: string) => {
    setTempSelectedTags((prev) =>
      prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug]
    );
  };

  const handleReset = () => {
    setTempSelectedTags([]);
    // Future: Reset other filter states here
  };

  const handleApply = () => {
    // Apply tag changes
    const toAdd = tempSelectedTags.filter((slug) => !selectedTags.includes(slug));
    const toRemove = selectedTags.filter((slug) => !tempSelectedTags.includes(slug));

    toRemove.forEach((slug) => onToggleTag(slug));
    toAdd.forEach((slug) => onToggleTag(slug));

    // Future: Apply other filter changes here

    setOpen(false);
  };

  // Calculate total temp selections for apply button
  const tempFilterCount = tempSelectedTags.length; // + other temp filter counts in future

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2">
                {totalActiveFilters}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Filter Content</DialogTitle>
            <DialogDescription>
              Refine your search by selecting filters. Click apply when done.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto px-1">
            <div className="space-y-6 px-2 py-4 sm:px-4">
              {/* Tags Filter Section */}
              {tags.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Tags</h3>
                    {tempSelectedTags.length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {tempSelectedTags.length} selected
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={tempSelectedTags.includes(tag.slug) ? 'default' : 'outline'}
                        className="hover:bg-primary/10 cursor-pointer transition-colors"
                        onClick={() => toggleTempTag(tag.slug)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Future: Date Range Filter Section */}
              {/* Uncomment when implementing date filters
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Date Range</h3>
                <DateRangePicker
                  value={tempDateRange}
                  onChange={setTempDateRange}
                />
              </div>
              */}

              {/* Future: Category Filter Section */}
              {/* Uncomment when implementing category filters
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={tempSelectedCategories.includes(category.slug) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors hover:bg-primary/10"
                      onClick={() => toggleTempCategory(category.slug)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
              */}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
              disabled={tempFilterCount === 0}
            >
              Reset
            </Button>
            <Button onClick={handleApply} className="w-full sm:w-auto">
              Apply {tempFilterCount > 0 && `(${tempFilterCount})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ActiveFilters({
  tags,
  selectedTags,
  onToggleTag,
}: Omit<ContentFilterButtonProps, 'onClearFilters'>) {
  if (selectedTags.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">Active filters:</span>
      {selectedTags.map((tagSlug) => {
        const tag = tags.find((t) => t.slug === tagSlug);
        return tag ? (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button onClick={() => onToggleTag(tag.slug)} className="hover:text-destructive ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ) : null;
      })}
    </div>
  );
}

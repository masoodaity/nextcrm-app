import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableFacetedFilter<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilter<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  const handleToggle = (optionValue: string) => {
    console.log("Toggling filter:", optionValue);
    const newSelectedValues = new Set(selectedValues);
    if (selectedValues.has(optionValue)) {
      newSelectedValues.delete(optionValue);
    } else {
      newSelectedValues.add(optionValue);
    }
    const filterValues = Array.from(newSelectedValues);
    console.log("New filter values:", filterValues);
    column?.setFilterValue(
      filterValues.length ? filterValues : undefined
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">{title}</div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.has(option.value);
              return (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleToggle(option.value)}
                  />
                  {option.icon && (
                    <option.icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 text-sm">{option.label}</span>
                  {facets?.get(option.value) && (
                    <span className="text-xs text-muted-foreground">
                      {facets.get(option.value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {selectedValues.size > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column?.setFilterValue(undefined)}
                className="w-full"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

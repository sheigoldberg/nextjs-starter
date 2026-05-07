'use client';

import * as React from 'react';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Input } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { DataTablePagination } from '@/components/dashboard';
import { DataTableSkeleton } from '@/components/dashboard';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string | string[];
  isLoading?: boolean;
  emptyMessage?: string;
  showSearch?: boolean;
  showPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  isLoading = false,
  emptyMessage = 'No results found.',
  showSearch = true,
  showPagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, value) => {
      if (!searchKey) return true;

      const searchKeys = Array.isArray(searchKey) ? searchKey : [searchKey];
      const searchValue = value.toLowerCase();

      console.log('🔍 GlobalFilter Debug:', {
        searchKeys,
        searchValue,
        rowData: row.original,
        columnId,
      });

      const result = searchKeys.some((key) => {
        const cellValue = row.getValue(key);

        if (!cellValue) return false;

        // Handle nested objects (like user.name, user.email, role.name)
        if (typeof cellValue === 'object') {
          const objString = JSON.stringify(cellValue).toLowerCase();
          return objString.includes(searchValue);
        }

        const stringValue = String(cellValue).toLowerCase();
        return stringValue.includes(searchValue);
      });

      return result;
    },
  });

  // Show skeleton loading if data is loading
  if (isLoading) {
    return <DataTableSkeleton columns={columns.length} />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {showSearch && searchKey && (
        <div className="flex items-center justify-between">
          <Input
            placeholder={
              Array.isArray(searchKey)
                ? `Search by ${searchKey.join(', ')}...`
                : `Search by ${searchKey}...`
            }
            value={globalFilter}
            onChange={(event) => {
              console.log('🔍 Search input changed:', event.target.value);
              setGlobalFilter(event.target.value);
            }}
            className="w-full max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && <DataTablePagination table={table} />}
    </div>
  );
}

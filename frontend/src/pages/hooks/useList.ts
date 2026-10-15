import { useEffect, useState } from 'react';
import { query } from '../../api';
import { useResource } from '../../context';
import type { Paged, QueryParams, ResourceRecords } from '../../types';

export function useList<K extends keyof ResourceRecords>(name: K, filters: QueryParams) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const filterKey = JSON.stringify(filters);

  useEffect(() => setPage(1), [filterKey]);

  const resource = useResource<Paged<ResourceRecords[K]>>(
    `/${name}${query({ ...filters, page, page_size: pageSize })}`,
  );

  function onPageChange(nextPage: number, nextPageSize: number) {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }

  return { resource, page, pageSize, onPageChange };
}

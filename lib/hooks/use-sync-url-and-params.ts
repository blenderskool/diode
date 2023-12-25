import { QueryParams } from 'pages/api/v1/types';
import { useCallback, useEffect } from 'react';
import {
  Path,
  PathValue,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
  WatchObserver,
} from 'react-hook-form';
import { addQueryParams } from '../internals/utils';

type ParentFormFields = {
  apiUrl: string;
  queryParams: { name: string; value: string }[];
};

type UseSyncUrlAndParamsProps<T extends ParentFormFields> = {
  setValue: UseFormSetValue<T>;
  getValues: UseFormGetValues<T>;
  watch: UseFormWatch<T>;
};

export const useSyncUrlAndParams = <
  T extends {
    apiUrl: string;
    queryParams: { name: string; value: string }[];
  }
>({
  setValue,
  getValues,
  watch,
}: UseSyncUrlAndParamsProps<T>) => {
  const syncUrlAndQueryParams: WatchObserver<T> = useCallback(
    (_, { name, type }) => {
      if (type !== 'change') return;

      const { apiUrl, queryParams } = getValues();

      try {
        if (name === 'apiUrl') {
          const url = new URL(apiUrl);
          setValue(
            'queryParams' as Path<T>,
            [...url.searchParams].map(([name, value]) => ({
              name,
              value,
            })) as PathValue<T, Path<T>>
          );
        } else if (name.startsWith('queryParams')) {
          const qp: QueryParams = queryParams.map(({ name, value }) => [
            name,
            value,
          ]);
          setValue(
            'apiUrl' as Path<T>,
            addQueryParams(apiUrl, qp) as PathValue<T, Path<T>>
          );
        }
      } catch (err) {
        // Ignore error as further updates might resolve correctly
        console.log(err);
      }
    },
    [setValue, getValues]
  );

  useEffect(() => {
    return watch(syncUrlAndQueryParams).unsubscribe;
  }, [watch, syncUrlAndQueryParams]);

  return syncUrlAndQueryParams;
};

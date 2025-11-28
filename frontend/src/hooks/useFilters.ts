import { filter, omit } from "lodash";
import { useRouter } from "next/router";
import { useCallback } from "react";

export const useFilterCount = () => {
  const router = useRouter();
  const { airlines, providers } = router.query;
  return filter([airlines, providers], Boolean).length;
};

export const useClearFilters = () => {
  const router = useRouter();
  const formattedQuery = omit(router.query, "airlines", "providers");
  const onClearFilters = useCallback(() => {
    router.push({
      pathname: router.pathname,
      query: formattedQuery,
    });
  }, [formattedQuery, router]);
  return { onClearFilters };
};

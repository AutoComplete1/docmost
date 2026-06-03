import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  createChangeSet,
  getChangeLogInfo,
  getChangeSets,
  setChangeLogSettings,
} from "@/features/compliance/services/change-set-service.ts";
import {
  IChangeLogInfo,
  IChangeSet,
  IComplianceScope,
  ICreateChangeSet,
} from "@/features/compliance/types/compliance.types.ts";
import { IPagination } from "@/lib/types.ts";
import { useSetAtom } from "jotai";
import { changeLogDirtyAtom } from "@/features/compliance/atoms/compliance-atoms.ts";

export function useChangeSetsQuery(
  scope: IComplianceScope,
  query?: string,
): UseInfiniteQueryResult<InfiniteData<IPagination<IChangeSet>, unknown>> {
  return useInfiniteQuery({
    queryKey: ["change-sets", scope, query ?? ""],
    queryFn: ({ pageParam }) => getChangeSets(scope, pageParam, query),
    enabled: !!(scope.pageId || scope.spaceId),
    gcTime: 0,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });
}

export function useCreateChangeSetMutation() {
  const queryClient = useQueryClient();
  const setDirty = useSetAtom(changeLogDirtyAtom);

  return useMutation<IChangeSet, Error, ICreateChangeSet>({
    mutationFn: (data) => createChangeSet(data),
    onSuccess: (_data, variables) => {
      if (variables.pageId) {
        setDirty((prev) => ({ ...prev, [variables.pageId!]: false }));
      }
      queryClient.invalidateQueries({ queryKey: ["change-sets"] });
      queryClient.invalidateQueries({ queryKey: ["change-log-info"] });
    },
  });
}

export function useChangeLogInfoQuery(
  scope: IComplianceScope,
): UseQueryResult<IChangeLogInfo, Error> {
  return useQuery({
    queryKey: ["change-log-info", scope],
    queryFn: () => getChangeLogInfo(scope),
    enabled: !!(scope.pageId || scope.spaceId),
  });
}

export function useSetChangeLogSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, IComplianceScope & { enabled: boolean }>({
    mutationFn: (data) => setChangeLogSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-log-info"] });
    },
  });
}

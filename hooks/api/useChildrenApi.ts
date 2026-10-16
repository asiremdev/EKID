import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Child, ChildStats } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';
import { useChildStore } from '../../store/useChildStore';

export function useChildren() {
  const setChild = useChildStore((s) => s.setChild);
  return useQuery({
    queryKey: qk.children,
    queryFn: async () => {
      const children = await api.get<Child[]>('/children');
      const current = useChildStore.getState().child;
      const keep = current ? children.find((c) => c.id === current.id) : null;
      if (keep) setChild(keep);
      else if (children[0]) setChild(children[0]);
      return children;
    },
  });
}

export function useChild(childId: string | null) {
  return useQuery({
    queryKey: childId ? qk.child(childId) : ['child', 'none'],
    queryFn: () => api.get<Child>(`/children/${childId}`),
    enabled: !!childId,
  });
}

export function useChildStats(childId: string | null) {
  return useQuery({
    queryKey: childId ? qk.childStats(childId) : ['child', 'none', 'stats'],
    queryFn: () => api.get<ChildStats>(`/children/${childId}/stats`),
    enabled: !!childId,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; avatar?: string; ageGroup: string }) =>
      api.post<Child>('/children', input),
    onSuccess: (child) => {
      useChildStore.getState().setChild(child);
      queryClient.invalidateQueries({ queryKey: qk.children });
    },
  });
}

export function useUpdateChild(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<{ name: string; avatar: string; ageGroup: string }>) =>
      api.patch<Child>(`/children/${childId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.children });
      queryClient.invalidateQueries({ queryKey: qk.child(childId) });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) => api.del(`/children/${childId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.children }),
  });
}

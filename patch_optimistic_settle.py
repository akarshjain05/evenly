with open("frontend/src/components/modals/SettleUpModal.tsx", "r") as f:
    content = f.read()

import_str = "const { isSettleUpOpen, closeSettleUp, openSettleUp } = useUIStore();\n"
content = content.replace("const { isSettleUpOpen, closeSettleUp } = useUIStore();", import_str)

old_mutation = """  const mutation = useMutation({
    mutationFn: (settlement: any) => apiClient.post(`groups/${id}/settlements`, settlement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
      closeSettleUp();
      setAmount('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to record settlement');
    }
  });"""

new_mutation = """  const mutation = useMutation({
    mutationFn: (settlement: any) => apiClient.post(`groups/${id}/settlements`, settlement),
    onMutate: async (settlement: any) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });
      
      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      
      const fromMemberObj = group.members.find(m => m.id === settlement.from_member);
      const toMemberObj = group.members.find(m => m.id === settlement.to_member);
      const fakeId = `temp-${Date.now()}`;
      
      const optimisticActivity = {
        id: fakeId,
        type: 'settlement',
        description: 'Payment',
        amount: settlement.amount,
        paid_by_name: '',
        from_name: fromMemberObj ? fromMemberObj.name : 'Unknown',
        to_name: toMemberObj ? toMemberObj.name : 'Unknown',
        from_member: settlement.from_member,
        to_member: settlement.to_member,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['group-activity', id], (old: any) => {
        return old ? [optimisticActivity, ...old] : [optimisticActivity];
      });

      queryClient.setQueryData(['group', id], (old: any) => {
        if (!old) return old;
        const newGroup = JSON.parse(JSON.stringify(old));
        newGroup.members.forEach((m: any) => {
            if (m.id === settlement.from_member) {
                m.balance = (Number(m.balance) + settlement.amount).toString();
            }
            if (m.id === settlement.to_member) {
                m.balance = (Number(m.balance) - settlement.amount).toString();
            }
        });
        return newGroup;
      });

      closeSettleUp();
      setAmount('');
      setError('');

      return { previousActivity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
    },
    onError: (err: any, settlement, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
        queryClient.invalidateQueries({ queryKey: ['group', id] });
      }
      openSettleUp();
      setError(err.response?.data?.detail || 'Failed to record settlement');
    }
  });"""

content = content.replace(old_mutation, new_mutation)

with open("frontend/src/components/modals/SettleUpModal.tsx", "w") as f:
    f.write(content)

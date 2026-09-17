with open("frontend/src/components/modals/AddExpenseModal.tsx", "r") as f:
    content = f.read()

import_str = "const { isAddExpenseOpen, closeAddExpense, openAddExpense } = useUIStore();\n"
content = content.replace("const { isAddExpenseOpen, closeAddExpense } = useUIStore();", import_str)

old_mutation = """  const mutation = useMutation({
    mutationFn: (newExpense: ExpenseCreate) => apiClient.post(`groups/${id}/expenses`, newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
      closeAddExpense();
      setDescription('');
      setAmount('');
      setError('');
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to save expense'));
    }
  });"""

new_mutation = """  const mutation = useMutation({
    mutationFn: (newExpense: ExpenseCreate) => apiClient.post(`groups/${id}/expenses`, newExpense),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });
      
      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      
      const payer = group.members.find(m => m.id === newExpense.paid_by);
      const fakeId = `temp-${Date.now()}`;
      
      const optimisticActivity = {
        id: fakeId,
        type: 'expense',
        description: newExpense.description,
        amount: newExpense.amount,
        paid_by: newExpense.paid_by,
        paid_by_name: payer ? payer.name : 'Unknown',
        created_at: new Date().toISOString(),
        split_type: newExpense.split_type,
      };

      queryClient.setQueryData(['group-activity', id], (old: any) => {
        return old ? [optimisticActivity, ...old] : [optimisticActivity];
      });

      queryClient.setQueryData(['group', id], (old: any) => {
        if (!old) return old;
        const newGroup = JSON.parse(JSON.stringify(old));
        if (newExpense.split_type === 'equal') {
            const share = newExpense.amount / newGroup.members.length;
            newGroup.members.forEach((m: any) => {
                if (m.id === newExpense.paid_by) {
                    m.balance = (Number(m.balance) + newExpense.amount - share).toString();
                } else {
                    m.balance = (Number(m.balance) - share).toString();
                }
            });
        }
        return newGroup;
      });

      closeAddExpense();
      setDescription('');
      setAmount('');
      setError('');

      return { previousActivity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
    },
    onError: (err: any, newExpense, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
        queryClient.invalidateQueries({ queryKey: ['group', id] });
      }
      openAddExpense();
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to save expense'));
    }
  });"""

content = content.replace(old_mutation, new_mutation)

with open("frontend/src/components/modals/AddExpenseModal.tsx", "w") as f:
    f.write(content)

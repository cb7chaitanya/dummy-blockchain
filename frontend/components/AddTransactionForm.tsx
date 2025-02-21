'use client';

import { useRef, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AddTransactionFormProps {
  addTransaction: (formData: FormData) => Promise<void>;
}

export default function AddTransactionForm({ addTransaction }: AddTransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addTransaction(formData);
      formRef.current?.reset();
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Add New Transaction</CardTitle>
        <CardDescription>
          Create a new transaction to be added to the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="sender">Sender</Label>
            <Input
              id="sender"
              name="sender"
              placeholder="Enter sender's address"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              name="recipient"
              placeholder="Enter recipient's address"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="Enter amount"
              step="0.01"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isPending}
          >
            {isPending ? 'Processing...' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
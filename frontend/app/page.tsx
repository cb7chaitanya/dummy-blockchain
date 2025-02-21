import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AddTransactionForm from '@/components/AddTransactionForm';
import { revalidatePath } from 'next/cache';

interface Transaction {
  sender: string;
  recipient: string;
  amount: number;
}

interface Block {
  timestamp: number;
  transactions: Transaction[];
  previous_hash: string;
  nonce: number;
  hash: string;
}

interface Blockchain {
  blocks: Block[];
  difficulty: number;
}

async function getBlockchain(): Promise<Blockchain> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chain`, { 
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch blockchain');
  }
  return response.json();
}

async function addTransaction(formData: FormData) {
  'use server';
  
  const transaction = {
    sender: formData.get('sender'),
    recipient: formData.get('recipient'),
    amount: parseFloat(formData.get('amount') as string)
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/add_block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([transaction]),
  });

  if (!response.ok) {
    throw new Error('Failed to add transaction');
  }

  revalidatePath('/');
}

export default async function Home() {
  const blockchain = await getBlockchain();

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-center">Blockchain Demo</h1>

      {/* Add Transaction Form */}
      <AddTransactionForm addTransaction={addTransaction} />

      {/* Blockchain Display */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Blockchain</h2>
        {blockchain.blocks.map((block, index) => (
          <Card key={block.hash} className="overflow-hidden">
            <CardHeader className="bg-gray-100 dark:bg-gray-800">
              <CardTitle className="text-lg">
                Block #{index}
                {index === 0 && <span className="ml-2 text-sm">(Genesis Block)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-gray-500">Hash</Label>
                    <p className="text-sm font-mono break-all">{block.hash}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-gray-500">Previous Hash</Label>
                    <p className="text-sm font-mono break-all">{block.previous_hash}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-gray-500">Nonce</Label>
                      <p className="text-sm font-mono">{block.nonce}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase text-gray-500">Timestamp</Label>
                      <p className="text-sm">
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-500">Transactions</Label>
                  <div className="mt-2 space-y-2">
                    {block.transactions.length === 0 ? (
                      <p className="text-sm text-gray-500">No transactions in this block</p>
                    ) : (
                      block.transactions.map((tx, i) => (
                        <Card key={i} className="p-3">
                          <div className="text-sm space-y-1">
                            <div className="grid grid-cols-[80px_1fr]">
                              <span className="text-gray-500">From:</span>
                              <span className="font-mono">{tx.sender}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr]">
                              <span className="text-gray-500">To:</span>
                              <span className="font-mono">{tx.recipient}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr]">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-mono">{tx.amount}</span>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

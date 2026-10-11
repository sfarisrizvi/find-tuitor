import React from 'react';
import { WalletHub } from '../../../components/wallet/WalletHub';

export const metadata = {
  title: 'My Wallet & Credits | TutorOnline.pk',
  description: 'Manage your credits, view payment receipts, and deposit funds securely via escrow.'
};

export default function ClientWalletPage() {
  return <WalletHub userRole="client" />;
}

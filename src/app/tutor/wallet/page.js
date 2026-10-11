import React from 'react';
import { WalletHub } from '../../../components/wallet/WalletHub';

export const metadata = {
  title: 'Tutor Credits & Wallet | TutorOnline.pk',
  description: 'Manage tutor credits, purchase credits via bank deposit to accept tuition contracts, and review statement ledger.'
};

export default function TutorWalletPage() {
  return <WalletHub userRole="tutor" />;
}

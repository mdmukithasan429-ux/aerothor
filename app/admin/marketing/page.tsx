import React from 'react';
import { AdminMarketingWorkspace as AdminMarketingHub } from '../../../src/components/AdminMarketingWorkspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminMarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <AdminMarketingHub />
      </div>
    </div>
  );
}

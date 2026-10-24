import { PairForm } from '@/components/PairForm';

export default async function PairPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === 'caller' || params.role === 'grandma' ? params.role : 'caretaker';
  return <PairForm role={role} setup={params.setup === '1'} />;
}

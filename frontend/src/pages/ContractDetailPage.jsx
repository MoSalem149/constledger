/**
 * ContractDetailPage — read-only contract view with PDF viewer + milestones.
 *
 * Sprint 2 builds the full screen: contract metadata, status badge,
 * milestone timeline, and PDF preview.
 *
 * Path: /contracts/:id
 * Accessible by all authenticated roles.
 */
export default function ContractDetailPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Contract details</h1>
      <p className="text-text-secondary mt-2">
        13-field review form coming in Sprint 3
      </p>
    </div>
  );
}

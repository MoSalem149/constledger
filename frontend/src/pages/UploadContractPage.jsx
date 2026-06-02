/**
 * UploadContractPage — drag-and-drop contract upload with async polling.
 *
 * Sprint 2 builds the full screen: file picker → S3 pre-signed URL →
 * backend processes via LLM → frontend polls every 5s until status
 * is "active" or "analysis_failed".
 *
 * Role: contractManager only (enforced by RoleGuard in App.jsx).
 */
export default function UploadContractPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Upload Contract</h1>
      <p className="text-text-secondary mt-2">
        Drag &amp; drop upload screen coming in Sprint 2
      </p>
    </div>
  );
}

import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { DocumentUpload } from "../../components/booking/DocumentUpload";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/browser";

export function AccountProfilePage() {
  const { user } = useAuth();
  
  const [govIdFile, setGovIdFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const statusMessages = {
    unsubmitted: { text: "Documents required", color: "text-graphite", bg: "bg-mist" },
    pending: { text: "Pending verification", color: "text-saffron", bg: "bg-saffron/10" },
    verified: { text: "Verified", color: "text-basil", bg: "bg-basil/10" },
    rejected: { text: "Rejected. Please re-upload.", color: "text-ember", bg: "bg-ember/10" },
  };

  const status = statusMessages[user?.documentStatus || "unsubmitted"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!govIdFile || !licenseFile) {
      setError("Please select both your Government ID and Driving License.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const govIdExt = govIdFile.name.split(".").pop();
      const licenseExt = licenseFile.name.split(".").pop();
      
      const govIdPath = `${user.id}/govid_${timestamp}.${govIdExt}`;
      const licensePath = `${user.id}/license_${timestamp}.${licenseExt}`;

      // Upload Government ID
      const { error: govIdError } = await supabase.storage
        .from("customer-documents")
        .upload(govIdPath, govIdFile);
      if (govIdError) throw govIdError;

      // Upload Driving License
      const { error: licenseError } = await supabase.storage
        .from("customer-documents")
        .upload(licensePath, licenseFile);
      if (licenseError) throw licenseError;

      const { data: { publicUrl: govIdUrl } } = supabase.storage
        .from("customer-documents")
        .getPublicUrl(govIdPath);

      const { data: { publicUrl: licenseUrl } } = supabase.storage
        .from("customer-documents")
        .getPublicUrl(licensePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          gov_id_url: govIdUrl,
          driving_license_url: licenseUrl,
          document_status: "pending"
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccessMsg("Documents uploaded successfully! They are now pending verification.");
      setGovIdFile(null);
      setLicenseFile(null);
      
      // Refresh the page to trigger useAuth reload (easiest way to sync state)
      window.location.reload();

    } catch (err) {
      console.error("Document upload error:", err);
      setError(`Upload failed: ${err.message || JSON.stringify(err)}`);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 max-w-3xl">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Account</p>
        <h1 className="mt-2 text-4xl font-black text-ink">My Profile</h1>
      </div>

      <div className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink mb-4">Personal Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-graphite">Full Name</span>
            <p className="mt-1 font-semibold text-ink">{user?.fullName}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-graphite">Email</span>
            <p className="mt-1 font-semibold text-ink">{user?.email}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-graphite">Phone</span>
            <p className="mt-1 font-semibold text-ink">{user?.phone || "Not provided"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-ink">Identity Verification</h2>
          <span className={`rounded-md px-3 py-1 text-xs font-bold ${status.bg} ${status.color}`}>
            {status.text}
          </span>
        </div>

        {user?.documentStatus === "verified" ? (
          <div className="rounded-md bg-basil/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-basil shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-basil">Your identity is verified.</p>
              <p className="text-sm text-graphite mt-1">
                You can now book cars without any delays. Thank you for completing your profile!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <p className="text-sm text-graphite">
              To book a vehicle, you must provide a valid Government ID and Driving License. 
              {user?.documentStatus === "pending" && " Your previously uploaded documents are currently under review. You can upload new ones if needed."}
              {user?.documentStatus === "rejected" && " Your previous documents were rejected. Please upload clearer images."}
            </p>

            <DocumentUpload 
              licenseFile={licenseFile}
              idProofFile={govIdFile}
              onLicenseChange={setLicenseFile}
              onIdProofChange={setGovIdFile}
            />

            {error && (
              <p className="flex items-center gap-2 rounded-md bg-ember/10 p-3 text-sm font-semibold text-ember">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </p>
            )}

            {successMsg && (
              <p className="flex items-center gap-2 rounded-md bg-basil/10 p-3 text-sm font-semibold text-basil">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-line">
              <Button type="submit" isLoading={isSubmitting} disabled={!govIdFile || !licenseFile}>
                Submit Documents
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

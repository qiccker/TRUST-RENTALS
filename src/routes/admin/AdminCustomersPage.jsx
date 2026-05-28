import { CheckCircle, Eye, FileWarning, Search, ShieldPlus, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { useProfiles } from "../../hooks/useProfiles";

export function AdminCustomersPage() {
  const { customers, fetchProfiles, updateProfileRole, updateDocumentStatus, deleteProfile, getSignedDocumentUrl, isLoading } = useProfiles();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [govIdUrl, setGovIdUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Load document URLs when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setGovIdUrl("");
      setLicenseUrl("");
      if (selectedCustomer.gov_id_url) {
        getSignedDocumentUrl(selectedCustomer.gov_id_url).then(setGovIdUrl);
      }
      if (selectedCustomer.driving_license_url) {
        getSignedDocumentUrl(selectedCustomer.driving_license_url).then(setLicenseUrl);
      }
    }
  }, [selectedCustomer, getSignedDocumentUrl]);

  const handlePromote = async (id) => {
    if (confirm("Promote this customer to staff? They will gain access to the admin dashboard.")) {
      const ok = await updateProfileRole(id, 'staff');
      if (ok) setSelectedCustomer(null);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedCustomer) return;
    const ok = await updateDocumentStatus(selectedCustomer.id, status);
    if (ok) setSelectedCustomer({ ...selectedCustomer, document_status: status });
  };

  const handleRemove = async (customer) => {
    if (!confirm(`Remove customer "${customer.full_name || 'Unknown'}"? This cannot be undone.`)) return;
    await deleteProfile(customer.id);
    if (selectedCustomer?.id === customer.id) setSelectedCustomer(null);
  };

  const statusBadge = {
    unsubmitted: { bg: "bg-graphite/10 text-graphite", icon: <FileWarning className="h-3 w-3" /> },
    pending: { bg: "bg-saffron/20 text-ink", icon: <Search className="h-3 w-3" /> },
    verified: { bg: "bg-basil/10 text-basil", icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { bg: "bg-ember/10 text-ember", icon: <XCircle className="h-3 w-3" /> }
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">User management</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Customers</h1>
        <p className="mt-1 text-sm text-graphite">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Customers List */}
        <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm self-start">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-mist text-xs uppercase tracking-[0.12em] text-graphite">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">ID Verification</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={isLoading ? "opacity-50" : ""}>
                {customers.map((customer) => {
                  const s = statusBadge[customer.document_status || 'unsubmitted'];
                  return (
                    <tr key={customer.id} className={`border-b border-line/70 transition ${selectedCustomer?.id === customer.id ? 'bg-teal/5' : 'hover:bg-mist/30'}`}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink">{customer.full_name || 'Unknown'}</p>
                      </td>
                      <td className="px-5 py-4 text-graphite">{customer.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${s.bg}`}>
                          {s.icon}
                          {customer.document_status || 'unsubmitted'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            className="rounded p-1.5 text-graphite hover:bg-mist hover:text-teal transition"
                            onClick={() => setSelectedCustomer(customer)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1.5 text-graphite hover:bg-ember/10 hover:text-ember transition"
                            onClick={() => handleRemove(customer)}
                            title="Remove customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {customers.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-graphite">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Customer Detail / Verification Panel */}
        {selectedCustomer ? (
          <aside className="rounded-md border border-line bg-white shadow-sm self-start sticky top-24">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-lg font-black text-ink truncate pr-2">{selectedCustomer.full_name || 'Customer Details'}</h2>
              <button onClick={() => setSelectedCustomer(null)} className="rounded p-1 hover:bg-mist transition text-graphite">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-graphite">Phone</p>
                  <p className="mt-1 font-bold text-ink text-sm">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-graphite">Status</p>
                  <p className="mt-1 font-bold capitalize text-sm">{selectedCustomer.document_status || 'unsubmitted'}</p>
                </div>
              </div>

              {/* Document Viewer */}
              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-bold text-ink mb-3">Identity Documents</h3>
                
                {(selectedCustomer.gov_id_url || selectedCustomer.driving_license_url) ? (
                  <div className="grid gap-3">
                    {selectedCustomer.gov_id_url && (
                      <div>
                        <p className="text-xs font-bold uppercase text-graphite mb-1">Government ID (National ID / Aadhaar)</p>
                        <div className="aspect-video bg-mist rounded overflow-hidden relative group flex items-center justify-center border border-line">
                          {govIdUrl ? (
                            <img src={govIdUrl} alt="Government ID" className="object-contain w-full h-full" />
                          ) : (
                            <p className="text-xs text-graphite">Loading…</p>
                          )}
                          {govIdUrl && (
                            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <a href={govIdUrl} target="_blank" rel="noreferrer" className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded">View Full Size</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedCustomer.driving_license_url && (
                      <div>
                        <p className="text-xs font-bold uppercase text-graphite mb-1">Driving License</p>
                        <div className="aspect-video bg-mist rounded overflow-hidden relative group flex items-center justify-center border border-line">
                          {licenseUrl ? (
                            <img src={licenseUrl} alt="Driving License" className="object-contain w-full h-full" />
                          ) : (
                            <p className="text-xs text-graphite">Loading…</p>
                          )}
                          {licenseUrl && (
                            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <a href={licenseUrl} target="_blank" rel="noreferrer" className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded">View Full Size</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approve / Reject actions */}
                    {selectedCustomer.document_status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <Button variant="danger" onClick={() => handleVerify('rejected')}>
                          Reject Documents
                        </Button>
                        <Button onClick={() => handleVerify('verified')}>
                          Approve ✓
                        </Button>
                      </div>
                    )}
                    {selectedCustomer.document_status === 'verified' && (
                      <p className="text-xs text-basil font-bold bg-basil/10 rounded p-2 text-center">✓ Documents verified</p>
                    )}
                    {selectedCustomer.document_status === 'rejected' && (
                      <div className="grid gap-2">
                        <p className="text-xs text-ember font-bold bg-ember/10 rounded p-2 text-center">✕ Documents rejected</p>
                        <Button variant="secondary" onClick={() => handleVerify('pending')} className="text-xs">
                          Reset to Pending
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-mist rounded p-4 text-center">
                    <FileWarning className="h-6 w-6 text-graphite/40 mx-auto mb-2" />
                    <p className="text-xs text-graphite">Customer has not uploaded any documents yet.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-line pt-4 grid gap-2">
                <Button variant="secondary" onClick={() => handlePromote(selectedCustomer.id)} leftIcon={<ShieldPlus className="h-4 w-4" />}>
                  Promote to Staff
                </Button>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="rounded-md border border-dashed border-line bg-mist/50 p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
            <Eye className="h-8 w-8 text-graphite/30 mb-3" />
            <p className="text-sm font-bold text-graphite">Select a customer to review their details and documents</p>
          </aside>
        )}
      </div>
    </div>
  );
}

import { ShieldAlert, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { useProfiles } from "../../hooks/useProfiles";

export function AdminStaffPage() {
  const { staff, customers, fetchProfiles, updateProfileRole, deleteProfile, isLoading } = useProfiles();
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleDemote = async (member) => {
    if (member.role === 'admin') {
      alert("Cannot demote an admin. Change their role directly in the database.");
      return;
    }
    if (confirm(`Remove staff access for "${member.full_name || 'Unknown'}"? They will become a regular customer.`)) {
      await updateProfileRole(member.id, 'customer');
    }
  };

  const handlePromote = async (customerId) => {
    await updateProfileRole(customerId, 'staff');
    setShowPromoteModal(false);
  };

  const handleRemoveStaff = async (member) => {
    if (member.role === 'admin') {
      alert("Cannot remove an admin account from here.");
      return;
    }
    if (confirm(`Permanently remove "${member.full_name || 'Unknown'}" from the system? This cannot be undone.`)) {
      await deleteProfile(member.id);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Access control</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Staff Management</h1>
          <p className="mt-1 text-sm text-graphite">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowPromoteModal(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
          Add Staff
        </Button>
      </div>

      {/* Staff List */}
      <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-xs uppercase tracking-[0.12em] text-graphite">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={isLoading ? "opacity-50" : ""}>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-line/70 hover:bg-mist/30 transition">
                  <td className="px-5 py-4">
                    <p className="font-bold text-ink">{member.full_name || 'Unknown'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                      member.role === 'admin' ? "bg-ember/10 text-ember" : "bg-teal/10 text-teal"
                    }`}>
                      {member.role === 'admin' ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-graphite">{member.phone || '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {member.role !== 'admin' && (
                        <>
                          <button
                            className="rounded p-1.5 text-graphite hover:bg-saffron/10 hover:text-ink transition"
                            onClick={() => handleDemote(member)}
                            title="Demote to customer"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1.5 text-graphite hover:bg-ember/10 hover:text-ember transition"
                            onClick={() => handleRemoveStaff(member)}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {member.role === 'admin' && (
                        <span className="text-xs text-graphite italic px-2">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-graphite">
                    No staff members. Click "Add Staff" to promote a customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Promote Customer Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setShowPromoteModal(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-line p-5">
              <h3 className="text-lg font-black text-ink">Promote Customer to Staff</h3>
              <p className="text-sm text-graphite mt-1">Select a customer to grant staff access</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {customers.length === 0 ? (
                <p className="p-5 text-center text-sm text-graphite">No customers available to promote.</p>
              ) : (
                <div className="divide-y divide-line">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handlePromote(customer.id)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-mist/50 transition text-left"
                    >
                      <div>
                        <p className="font-bold text-ink text-sm">{customer.full_name || 'Unknown'}</p>
                        <p className="text-xs text-graphite">{customer.phone || 'No phone'}</p>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-teal flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-line p-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowPromoteModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

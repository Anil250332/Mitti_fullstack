import React, { useMemo, useRef, useState, useEffect } from "react";
import { FiEdit2, FiPlus, FiSave, FiUpload, FiChevronLeft, FiChevronRight, FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

import api, { resolveUploadUrl } from "../../api/axios";
import { fetchSettings } from "../../store/slices/settingsSlice";

const TABS = [
  { key: "general", label: "General Settings" },
  { key: "permissions", label: "Admin Permissions" },
  { key: "profile", label: "My Profile" },
];
// eslint-disable-next-line no-unused-vars
const PERMISSION_KEYS = [
  { key: "home", label: "Dashboard" },
  { key: "orders", label: "Orders" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Category" },
  { key: "sliders", label: "Sliders" },
  { key: "tags", label: "Tags" },
  { key: "messages", label: "Messages" },
  { key: "coupons", label: "Coupons" },
  { key: "users", label: "Users" },
  { key: "permissions", label: "Permissions" },
  { key: "settings", label: "Settings" },
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function splitAddressLines(address) {
  const raw = safeString(address, "").trim();
  if (!raw) return ["", ""];
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [raw, ""];
  return [parts[0], parts.slice(1).join(", ")];
}


export default function DashboardSettings() {
  const dispatch = useDispatch();
  const { data: settings } = useSelector(state => state.settings);
  const [tab, setTab] = useState("general");
  const logoInputRef = useRef(null);

  const [generalDraft, setGeneralDraft] = useState(() => ({
    logoUrl: settings?.logoDataUrl || "",
    logoFile: null,
    logoPreviewUrl: "",
    logoFileName: "",
    contactNo: settings?.contactNumber || "+123 ( 456 ) ( 7890 )",
    email: "",
    address: Array.isArray(settings?.footer?.addressLines)
      ? settings.footer.addressLines.filter(Boolean).join(", ")
      : "",
    openingTime: "",
    closingTime: "",
    facebook: "",
    instagram: settings?.footer?.instagramHandle || "",
    youtube: "",
  }));

  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);

  // cleanup object URL previews
  useEffect(() => {
    return () => {
      if (generalDraft.logoPreviewUrl) {
        try {
          URL.revokeObjectURL(generalDraft.logoPreviewUrl);
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });

  const [savingPermissionsByUserId, setSavingPermissionsByUserId] = useState({});
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    username: "",
    password: "",
  });

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    username: "",
    password: "",
  });

  const activeTabLabel = useMemo(() => TABS.find((t) => t.key === tab)?.label || "Settings", [tab]);

  const fetchAdmins = async (page = 1) => {
    try {
      const [usersResponse, permissionsResponse] = await Promise.all([
        api.get(`/admin/users?page=${page}&limit=${pagination.limit}`),
        api.get(`/admin/users/permission`),
      ]);

      if (!usersResponse.data.success) return;

      const users = usersResponse.data.data;
      const permissionRows = Array.isArray(permissionsResponse?.data?.data)
        ? permissionsResponse.data.data
        : [];

      const permissionsByUserId = new Map(
        permissionRows.map((row) => [row?.id, Array.isArray(row?.permissions) ? row.permissions : []])
      );

      const usersWithPermissions = users.map((user) => {
        const permissions = {};
        PERMISSION_KEYS.forEach((pk) => (permissions[pk.key] = false));

        const userPerms = permissionsByUserId.get(user.id) || [];
        userPerms.forEach((p) => {
          if (p?.pageKey) permissions[p.pageKey] = Boolean(p.canView);
        });

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          permissions,
        };
      });

      setAdmins(usersWithPermissions);
      setPagination(usersResponse.data.pagination);
    } catch (error) {
    }
  };

  const fetchGeneralSettings = async () => {
    setGeneralLoading(true);
    try {
      const response = await api.get("/admin/settings");
      const payload = response?.data?.data || response?.data;

      const next = {
        logoUrl: safeString(payload?.logo, ""),
        logoFile: null,
        logoPreviewUrl: "",
        logoFileName: "",
        contactNo: safeString(payload?.contactNo, ""),
        email: safeString(payload?.email, ""),
        address: safeString(payload?.address, ""),
        openingTime: safeString(payload?.openingTime, ""),
        closingTime: safeString(payload?.closingTime, ""),
        facebook: safeString(payload?.facebook, ""),
        instagram: safeString(payload?.instagram, ""),
        youtube: safeString(payload?.youtube, ""),
      };

      setGeneralDraft((prev) => ({ ...prev, ...next }));
      dispatch(fetchSettings());
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to fetch settings.");
    } finally {
      setGeneralLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.replace("/admin-login");
        return;
      }

      const decoded = parseJwt(token);

      // Try to find the ID in common JWT fields
      const userId = decoded?.id || decoded?.userId || decoded?.sub;

      if (!userId) {
        return;
      }

      const response = await api.get(`/admin/users/${userId}`);

      if (response.data.success) {
        let user = null;
        // Handle both array (as per docs) and object (common variation) responses
        if (Array.isArray(response.data.data)) {
          user = response.data.data[0];
        } else if (response.data.data) {
          user = response.data.data;
        }

        if (user) {
          setProfile(prev => ({
            ...prev,
            id: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phoneNo: user.phoneNo || "",
            username: user.username || "",
          }));
        } else {
          // No user data found
        }
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    if (tab === "permissions") {
      fetchAdmins(pagination.currentPage);
    }
    if (tab === "profile") {
      fetchUserProfile();
    }
    if (tab === "general") {
      fetchGeneralSettings();
    }
  }, [tab, pagination.currentPage]);

  const saveGeneral = async () => {
    const email = safeString(generalDraft.email, "").trim();
    const contactNo = safeString(generalDraft.contactNo, "").trim();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    if (contactNo) {
      if (!/^\d+$/.test(contactNo)) {
        window.alert("Phone number should contain only digits.");
        return;
      }
      if (contactNo.length !== 10) {
        window.alert("Phone number must be exactly 10 digits.");
        return;
      }
    }

    const formData = new FormData();
    if (generalDraft.logoFile instanceof File) {
      formData.append("logo", generalDraft.logoFile);
    }
    formData.append("contactNo", contactNo);
    formData.append("email", email);
    formData.append("address", safeString(generalDraft.address, "").trim());
    formData.append("openingTime", safeString(generalDraft.openingTime, "").trim());
    formData.append("closingTime", safeString(generalDraft.closingTime, "").trim());
    formData.append("facebook", safeString(generalDraft.facebook, "").trim());
    formData.append("instagram", safeString(generalDraft.instagram, "").trim());
    formData.append("youtube", safeString(generalDraft.youtube, "").trim());

    setGeneralSaving(true);
    try {
      const response = await api.post("/admin/settings", formData);
      if (response?.data?.success === false) {
        window.alert(response?.data?.message || "Failed to save settings.");
        return;
      }

      // Prefer server-returned values (e.g., uploaded logo URL)
      const server = response?.data?.data || response?.data;
      const saved = {
        logoUrl: safeString(server?.logo, generalDraft.logoUrl),
        contactNo: safeString(server?.contactNo, generalDraft.contactNo),
        email: safeString(server?.email, generalDraft.email),
        address: safeString(server?.address, generalDraft.address),
        openingTime: safeString(server?.openingTime, generalDraft.openingTime),
        closingTime: safeString(server?.closingTime, generalDraft.closingTime),
        facebook: safeString(server?.facebook, generalDraft.facebook),
        instagram: safeString(server?.instagram, generalDraft.instagram),
        youtube: safeString(server?.youtube, generalDraft.youtube),
      };

      dispatch(fetchSettings());

      // reset file selection after save
      setGeneralDraft((prev) => {
        if (prev.logoPreviewUrl) {
          try {
            URL.revokeObjectURL(prev.logoPreviewUrl);
          } catch {
            // ignore
          }
        }
        return {
          ...prev,
          logoUrl: saved.logoUrl,
          logoFile: null,
          logoPreviewUrl: "",
          logoFileName: "",
          contactNo: saved.contactNo,
          email: saved.email,
          address: saved.address,
          openingTime: saved.openingTime,
          closingTime: saved.closingTime,
          facebook: saved.facebook,
          instagram: saved.instagram,
          youtube: saved.youtube,
        };
      });

      window.alert(response?.data?.message || "Settings saved successfully.");
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to save settings.");
    } finally {
      setGeneralSaving(false);
    }
  };

  const toggleSuperAdmin = async (adminId) => {
    try {
      const admin = admins.find(a => a.id === adminId);
      if (!admin) return;

      const newStatus = !admin.isAdmin;
      const response = await api.post("/admin/users/save", {
        id: adminId,
        isAdmin: newStatus
      });

      if (response.data.success) {
        setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, isAdmin: newStatus } : a));
      }
    } catch (error) {
      window.alert("Failed to update role");
    }
  };

  const togglePermission = (adminId, permKey) => {
    setAdmins((prev) =>
      prev.map((a) =>
        a.id === adminId
          ? { ...a, permissions: { ...a.permissions, [permKey]: !a.permissions?.[permKey] } }
          : a
      )
    );
  };

  const savePermissions = async (adminId) => {
    const admin = admins.find((a) => a.id === adminId);
    if (!admin) return;

    const permissionsPayload = PERMISSION_KEYS.map((p) => ({
      pageKey: p.key,
      canView: Boolean(admin?.permissions?.[p.key]),
    }));

    setSavingPermissionsByUserId((prev) => ({ ...prev, [adminId]: true }));
    try {
      const response = await api.post("/admin/users/permission/save", {
        UserId: adminId,
        permissions: permissionsPayload,
      });

      if (response.data.success) {
        window.alert(response.data.message || "Permissions saved successfully.");
        // Keep UI in sync with backend (optional refresh)
        fetchAdmins(pagination.currentPage);
      } else {
        window.alert(response.data.message || "Failed to save permissions.");
      }
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to save permissions.");
    } finally {
      setSavingPermissionsByUserId((prev) => ({ ...prev, [adminId]: false }));
    }
  };

  const openAddAdmin = () => {
    setNewAdmin({
      firstName: "",
      lastName: "",
      email: "",
      phoneNo: "",
      username: "",
      password: "",
    });
    setAdminModalOpen(true);
  };

  const addAdmin = async () => {
    const firstName = String(newAdmin.firstName ?? "").trim();
    const lastName = String(newAdmin.lastName ?? "").trim();
    const email = String(newAdmin.email ?? "").trim();
    const phoneNo = String(newAdmin.phoneNo ?? "").trim();
    const username = String(newAdmin.username ?? "").trim();
    const password = String(newAdmin.password ?? "").trim();

    if (!firstName) {
      window.alert("First Name is required.");
      return;
    }
    if (!lastName) {
      window.alert("Last Name is required.");
      return;
    }
    if (!email) {
      window.alert("Email is required.");
      return;
    }
    if (!username) {
      window.alert("Username is required.");
      return;
    }
    if (!password) {
      window.alert("Password is required.");
      return;
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    if (phoneNo) {
      if (!/^\d+$/.test(phoneNo)) {
        window.alert("Phone number should contain only digits.");
        return;
      }
      if (phoneNo.length !== 10) {
        window.alert("Phone number must be exactly 10 digits.");
        return;
      }
    }

    setIsAddingAdmin(true);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNo,
        username,
        password,
        isAdmin: false,
      };

      const response = await api.post("/admin/users/save", payload);

      if (response.data.success) {
        window.alert(response.data.message || "Admin added successfully.");
        setAdminModalOpen(false);
        setNewAdmin({
          firstName: "",
          lastName: "",
          email: "",
          phoneNo: "",
          username: "",
          password: "",
        });
        fetchAdmins(pagination.currentPage);
      } else {
        window.alert(response.data.message || "Failed to add admin.");
      }
    } catch (error) {

      window.alert(error.response?.data?.message || "Failed to add admin.");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin? This action cannot be undone.")) return;

    try {
      const response = await api.delete(`/admin/users/${adminId}`);
      if (response.data.success) {
        window.alert(response.data.message || "Admin deleted successfully.");
        fetchAdmins(pagination.currentPage);
      } else {
        window.alert(response.data.message || "Failed to delete admin.");
      }
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to delete admin.");
    }
  };

  const saveProfile = async () => {
    if (!profile.id) {
      window.alert("User ID is missing. Cannot update profile.");
      return;
    }

    const firstName = String(profile.firstName ?? "").trim();
    const lastName = String(profile.lastName ?? "").trim();
    const email = String(profile.email ?? "").trim();
    const phoneNo = String(profile.phoneNo ?? "").trim();
    const username = String(profile.username ?? "").trim();

    if (!firstName || !lastName || !email || !username) {
      window.alert("Please fill in all required fields (First Name, Last Name, Email, Username).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    if (phoneNo) {
      if (!/^\d+$/.test(phoneNo)) {
        window.alert("Phone number should contain only digits.");
        return;
      }
      if (phoneNo.length !== 10) {
        window.alert("Phone number must be exactly 10 digits.");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        id: profile.id,
        firstName,
        lastName,
        email,
        phoneNo,
        username,
        isAdmin: true,
      };

      if (profile.password) {
        payload.password = profile.password;
      }

      const response = await api.post("/admin/users/save", payload);
      if (response.data.success) {
        window.alert(response.data.message || "Profile updated successfully.");
        setProfile((p) => ({ ...p, password: "" }));
      } else {
        window.alert(response.data.message || "Failed to update profile.");
      }
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#3b2a23]">Settings</h2>
        <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
          {activeTabLabel}
        </span>
      </div>

      {/* Settings Menu */}
      <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#ececec]">
          <h3 className="text-base font-bold text-[#3b2a23]">Menu</h3>
        </div>

        <div className="p-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`cursor-pointer px-4 py-2 rounded-md border text-sm font-bold transition-colors duration-150 ${tab === t.key
                ? "bg-[#5C3A2E] text-white border-[#5C3A2E]"
                : "bg-gray-50 text-[#3b2a23] border-[#ececec] hover:bg-gray-50"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* General Settings */}
      {tab === "general" ? (
        <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#3b2a23]">General Settings</h3>
            <button
              type="button"
              onClick={saveGeneral}
              disabled={generalSaving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generalSaving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave /> Save
                </>
              )}
            </button>
          </div>

          {generalLoading ? (
            <div className="p-6 text-sm text-[#7c6a5a]">Loading settings...</div>
          ) : (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className="border border-[#ececec] rounded-lg p-5 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => logoInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    logoInputRef.current?.click();
                  }
                }}
                aria-label="Change logo"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#5C3A2E]"><FiUpload /></span>
                  <h4 className="font-bold text-[#3b2a23]">Logo</h4>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setGeneralDraft((prev) => {
                      if (prev.logoPreviewUrl) {
                        try {
                          URL.revokeObjectURL(prev.logoPreviewUrl);
                        } catch {
                          // ignore
                        }
                      }
                      const previewUrl = URL.createObjectURL(file);
                      return {
                        ...prev,
                        logoFile: file,
                        logoPreviewUrl: previewUrl,
                        logoFileName: file.name,
                      };
                    });

                    // allow selecting the same file again
                    e.target.value = "";
                  }}
                  className="sr-only"
                />

                <div className="text-xs text-[#7c6a5a]">Click anywhere on this card to select a logo image.</div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-md border border-[#ececec] bg-[#fffaf9] flex items-center justify-center overflow-hidden">
                    {generalDraft.logoPreviewUrl || resolveUploadUrl(generalDraft.logoUrl) ? (
                      <img
                        src={generalDraft.logoPreviewUrl || resolveUploadUrl(generalDraft.logoUrl)}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-[#7c6a5a]">No logo</span>
                    )}
                  </div>
                  <div className="text-xs text-[#7c6a5a]">
                    {generalDraft.logoFileName ? (
                      <div>Selected: <span className="font-semibold text-[#3b2a23]">{generalDraft.logoFileName}</span></div>
                    ) : (
                      <div>Click to select a logo from your PC.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-[#ececec] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#5C3A2E]"><FiEdit2 /></span>
                  <h4 className="font-bold text-[#3b2a23]">Contact</h4>
                </div>

                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Phone*</label>
                <input
                  value={generalDraft.contactNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    if (val.length <= 10) {
                      setGeneralDraft((prev) => ({ ...prev, contactNo: val }));
                    }
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />

                <label className="block text-xs font-bold text-[#3b2a23] mb-2 mt-4">Email*</label>
                <input
                  value={generalDraft.email}
                  type="email"
                  onChange={(e) => setGeneralDraft((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="support@example.com"
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />


              </div>

              <div className="border border-[#ececec] rounded-lg p-5">
                <h4 className="font-bold text-[#3b2a23] mb-4">Address</h4>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Full Address</label>
                <input
                  value={generalDraft.address}
                  onChange={(e) => setGeneralDraft((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Shop #10, Main Road, Karachi"
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                />
              </div>


              <div className="border border-[#ececec] rounded-lg p-5">
                <h4 className="font-bold text-[#3b2a23] mb-4">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Facebook</label>
                    <input
                      value={generalDraft.facebook}
                      onChange={(e) => setGeneralDraft((p) => ({ ...p, facebook: e.target.value }))}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Instagram</label>
                    <input
                      value={generalDraft.instagram}
                      onChange={(e) => setGeneralDraft((p) => ({ ...p, instagram: e.target.value }))}
                      placeholder="https://instagram.com/yourpage"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">YouTube</label>
                    <input
                      value={generalDraft.youtube}
                      onChange={(e) => setGeneralDraft((p) => ({ ...p, youtube: e.target.value }))}
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Admin Permissions */}
      {
        tab === "permissions" ? (
          <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-[#3b2a23]">Admin Permissions</h3>
                <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
                  {admins.length}
                </span>
              </div>
              <button
                type="button"
                onClick={openAddAdmin}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-xs font-bold text-white hover:opacity-95"
              >
                <FiPlus /> Add Admin
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fffaf9] text-[#3b2a23]">
                  <tr>
                    <th className="text-left font-bold px-6 py-4 whitespace-nowrap">Admin</th>
                    {PERMISSION_KEYS.map((p) => (
                      <th key={p.key} className="text-center font-bold px-4 py-4 whitespace-nowrap">{p.label}</th>
                    ))}
                    <th className="text-center font-bold px-4 py-4 whitespace-nowrap">Role</th>
                    <th className="text-right font-bold px-6 py-4 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-t border-[#ececec] hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#3b2a23]">{a.name}</div>
                        <div className="text-xs text-[#7c6a5a]">{a.email}</div>
                      </td>
                      {PERMISSION_KEYS.map((p) => (
                        <td key={p.key} className="px-4 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(a.permissions?.[p.key])}
                            onChange={() => togglePermission(a.id, p.key)}
                            className="w-4 h-4 accent-[#5C3A2E] disabled:opacity-30"
                            disabled={a.isAdmin}
                            aria-label={`${a.name} ${p.label}`}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-5 text-center">
                        <button
                          onClick={() => toggleSuperAdmin(a.id)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${a.isAdmin ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        >
                          {a.isAdmin ? "SUPER" : "NORMAL"}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => savePermissions(a.id)}
                            disabled={Boolean(savingPermissionsByUserId?.[a.id])}
                            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-3 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingPermissionsByUserId?.[a.id] ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <FiSave /> Save
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#ececec] flex items-center justify-between">
                <span className="text-xs text-[#7c6a5a]">
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                    disabled={pagination.currentPage === 1}
                    className="p-2 rounded-md border border-[#ececec] text-[#3b2a23] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="text-xs font-bold text-[#3b2a23]">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 rounded-md border border-[#ececec] text-[#3b2a23] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null
      }

      {/* My Profile */}
      {
        tab === "profile" ? (
          <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-[#3b2a23]">My Profile</h3>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-70"
              >
                {isSavingProfile ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave /> Save
                  </>
                )}
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">First Name*</label>
                <input
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value.replace(/[0-9]/g, "") }))}
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Last Name*</label>
                <input
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value.replace(/[0-9]/g, "") }))}
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Email*</label>
                <input
                  value={profile.email}
                  type="email"
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Phone No</label>
                <input
                  value={profile.phoneNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    if (val.length <= 10) {
                      setProfile((p) => ({ ...p, phoneNo: val }));
                    }
                  }}
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Username*</label>
                <input
                  value={profile.username}
                  onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.trim() }))}
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3b2a23] mb-2">Change Password</label>
                <input
                  type="password"
                  value={profile.password}
                  onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter new password"
                  className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                />
              </div>
            </div>
          </section>
        ) : null
      }

      {/* Add Admin Modal */}
      {
        adminModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAdminModalOpen(false)} />

            <div className="relative w-full max-w-lg bg-white rounded-lg shadow border border-[#ececec] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-base font-bold text-[#3b2a23]">Add Admin</h3>
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="cursor-pointer text-[#3b2a23] font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">First Name*</label>
                    <input
                      value={newAdmin.firstName}
                      onChange={(e) => setNewAdmin((p) => ({ ...p, firstName: e.target.value.replace(/[0-9]/g, "") }))}
                      placeholder="Enter first name"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Last Name*</label>
                    <input
                      value={newAdmin.lastName}
                      onChange={(e) => setNewAdmin((p) => ({ ...p, lastName: e.target.value.replace(/[0-9]/g, "") }))}
                      placeholder="Enter last name"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Email*</label>
                    <input
                      value={newAdmin.email}
                      type="email"
                      onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                      placeholder="admin@example.com"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Phone No</label>
                    <input
                      value={newAdmin.phoneNo}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val.length <= 10) {
                          setNewAdmin((p) => ({ ...p, phoneNo: val }));
                        }
                      }}
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Username*</label>
                    <input
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin((p) => ({ ...p, username: e.target.value.trim() }))}
                      placeholder="username"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3b2a23] mb-2">Password* </label>
                    <input
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-md border border-[#ececec] bg-white px-4 py-2 text-sm text-[#3b2a23] outline-none focus:border-[#5C3A2E]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="cursor-pointer rounded-md bg-gray-50 border border-[#ececec] px-4 py-2 text-xs font-bold text-[#3b2a23] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addAdmin}
                    disabled={isAddingAdmin}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-70"
                  >
                    {isAddingAdmin ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <FiPlus /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null
      }
    </div >
  );
}

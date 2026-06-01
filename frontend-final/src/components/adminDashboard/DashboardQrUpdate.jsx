import React, { useState, useEffect, useRef } from "react";
import { FiSave, FiUpload, FiImage } from "react-icons/fi";
import api, { resolveUploadUrl } from "../../api/axios";
import { toast } from "react-hot-toast";

export default function DashboardQrUpdate() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/settings");
      const data = response.data.data;
      if (data) {
        setQrCodeUrl(data.qrCode || "");
      }
    } catch (error) {
      toast.error("Failed to load current QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!qrFile && !qrCodeUrl) {
      toast.error("Please select a QR code image");
      return;
    }

    const formData = new FormData();
    if (qrFile) {
      formData.append("qrCode", qrFile);
    }

    setSaving(true);
    try {
      const response = await api.post("/admin/settings", formData);
      if (response.data.success) {
        toast.success("QR Code updated successfully");
        setQrFile(null);
        if (qrPreview) {
          URL.revokeObjectURL(qrPreview);
          setQrPreview("");
        }
        fetchSettings();
      } else {
        toast.error(response.data.message || "Failed to update QR Code");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-[#3b2a23]">Payment QR Update</h2>
        <span className="text-xs font-bold bg-gray-50 border border-[#ececec] px-2 py-1 rounded-full text-[#3b2a23]">
          Management
        </span>
      </div>

      <section className="bg-white rounded-lg shadow border border-[#ececec] overflow-hidden max-w-2xl">
        <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#3b2a23]">QR Code Settings</h3>
          <button
            onClick={handleSave}
            disabled={saving || (!qrFile && qrCodeUrl)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#5C3A2E] px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <FiSave /> Save Changes
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#7c6a5a] mb-6">
            Upload your payment QR code here. This QR code will be displayed to users on the checkout page when they select the "Online Payment" option.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div 
              className="border-2 border-dashed border-[#ececec] rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-brown mb-3 group-hover:scale-110 transition-transform">
                <FiUpload size={20} />
              </div>
              <p className="text-xs font-bold text-brown uppercase tracking-wider">Upload New QR</p>
              <p className="text-[10px] text-[#7c6a5a] mt-1">PNG, JPG or JPEG up to 5MB</p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7c6a5a] mb-3">Live Preview</p>
              <div className="bg-white p-4 rounded-2xl shadow-md border border-[#ececec] relative group">
                {loading ? (
                  <div className="w-48 h-48 flex items-center justify-center animate-pulse bg-gray-100 rounded-lg">
                    <FiImage className="text-gray-300" size={40} />
                  </div>
                ) : qrPreview || qrCodeUrl ? (
                  <img 
                    src={qrPreview || resolveUploadUrl(qrCodeUrl)} 
                    alt="QR Preview" 
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-[#ececec]">
                    <FiImage className="text-gray-300 mb-2" size={40} />
                    <span className="text-[10px] font-bold text-gray-400">No Image Uploaded</span>
                  </div>
                )}
                
                {(qrPreview || qrCodeUrl) && !loading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <p className="text-white text-xs font-bold uppercase tracking-widest">Current View</p>
                    </div>
                )}
              </div>
              {qrFile && (
                <p className="mt-3 text-[10px] font-bold text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping" />
                  New file selected: {qrFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#fffaf9] p-4 border-t border-[#ececec]">
           <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0">
                 <div className="w-4 h-4 rounded-full bg-brown/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-brown">!</span>
                 </div>
              </div>
              <p className="text-[10px] text-[#7c6a5a] leading-relaxed">
                 <span className="font-bold text-[#3b2a23]">Important:</span> Ensure the QR code is clear and high-contrast for easier scanning by customers. Test scanning with a phone after updating to verify it works.
              </p>
           </div>
        </div>
      </section>
    </div>
  );
}

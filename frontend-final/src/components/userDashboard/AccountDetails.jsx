import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, changePasswordProfile } from '../../store/slices/authSlice';

const AccountDetails = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
            });
        }
    }, [user]);

    const [pwData, setPwData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [updating, setUpdating] = useState(false);

    if (!user && loading) {
        return (
            <div className="flex justify-center py-20">
                <FiLoader className="animate-spin text-brown" size={40} />
            </div>
        );
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (updating) return;

        const name = formData.name.trim();
        const email = formData.email.trim();
        const mobile = formData.mobile.trim();

        if (!name || !email || !mobile) {
            alert("Please fill in all details");
            return;
        }

        if (!/^[A-Za-z\s]+$/.test(name)) {
            alert("Name should only contain letters");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address");
            return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            alert("Please enter a valid 10-digit phone number");
            return;
        }

        setUpdating(true);
        try {
            await dispatch(updateProfile({
                name,
                email,
                mobile
            })).unwrap();
            alert("Profile updated successfully");
        } catch (err) {
            alert(err || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (updating) return;

        const oldPassword = pwData.oldPassword.trim();
        const newPassword = pwData.newPassword.trim();
        const confirmPassword = pwData.confirmPassword.trim();

        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("Please fill in all password fields. Spaces are not allowed.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            alert("New password must be at least 6 characters long");
            return;
        }

        setUpdating(true);
        try {
            await dispatch(changePasswordProfile({
                email: formData.email,
                oldPassword: oldPassword,
                newPassword: newPassword
            })).unwrap();
            alert("Password changed successfully");
            setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            alert(err || "Failed to change password");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-brown tracking-tighter mb-1 md:mb-2">Account Details</h2>
                <p className="text-brown/60 font-bold text-xs md:text-sm">Manage your personal information and security settings.</p>
            </div>

            <form className="space-y-6 max-w-2xl" onSubmit={handleProfileSubmit}>
                {/* Personal Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Full Name</label>
                        <div className="relative group">
                            <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-gold transition-colors" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-14 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Phone Number</label>
                        <div className="relative group">
                            <FiPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-gold transition-colors" />
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    if (val.length <= 10) setFormData({ ...formData, mobile: val });
                                }}
                                className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-14 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Email Address</label>
                    <div className="relative group">
                        <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-brown/30 group-focus-within:text-gold transition-colors" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-14 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                        />
                    </div>
                </div>

                <motion.button
                    type="submit"
                    disabled={updating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto bg-brown text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-brown/20 hover:bg-gold transition-all duration-500 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                >
                    {updating ? (
                        <>
                            <FiLoader className="animate-spin" />
                            UPDATING...
                        </>
                    ) : (
                        <>Update Profile <FiCheckCircle /></>
                    )}
                </motion.button>
            </form>

            <form className="space-y-6 max-w-2xl" onSubmit={handlePasswordSubmit}>
                {/* Password Section */}
                <div className="pt-8 border-t border-brown/5">
                    <h3 className="text-xl font-black text-brown tracking-tight mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 bg-luxury-light rounded-xl flex items-center justify-center text-brown border border-brown/5">
                            <FiLock size={16} />
                        </span>
                        Change Password
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Current Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={pwData.oldPassword}
                                onChange={(e) => setPwData({ ...pwData, oldPassword: e.target.value })}
                                className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={pwData.newPassword}
                                onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                                className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown/40 ml-4">Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={pwData.confirmPassword}
                                onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                                className="w-full bg-luxury-light border-2 border-brown/5 rounded-2xl px-6 py-4 text-brown font-bold focus:outline-none focus:border-brown/10 focus:bg-luxury-light focus:shadow-xl focus:shadow-brown/5 transition-all duration-500"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    type="submit"
                    disabled={updating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto bg-brown text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-brown/20 hover:bg-gold transition-all duration-500 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                >
                    {updating ? (
                        <>
                            <FiLoader className="animate-spin" />
                            CHANGING...
                        </>
                    ) : (
                        <>Update Password <FiCheckCircle /></>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default AccountDetails;

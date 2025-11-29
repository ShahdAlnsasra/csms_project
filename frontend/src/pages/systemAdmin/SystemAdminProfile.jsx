// frontend/src/pages/systemAdmin/SystemAdminProfile.jsx
import React, { useEffect, useState } from "react";
import { User, Shield, Info, Phone, Mail, IdCard, Upload, X, Save } from "lucide-react"; // הוספת אייקונים

function mapRole(role) {
  if (role === "SYSTEM_ADMIN") return "System Admin";
  if (role === "DEPARTMENT_ADMIN") return "Department Admin";
  if (role === "REVIEWER") return "Reviewer";
  if (role === "LECTURER") return "Lecturer";
  if (role === "STUDENT") return "Student";
  return role || "Unknown";
}

// קומפוננטת עזר להצגת פריט נתון
const DetailItem = ({ icon: Icon, title, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-indigo-500/80 mt-1 shrink-0" />
    <div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-0.5 font-medium text-slate-900 break-words">
        {value || <span className="text-slate-400">Not set yet</span>}
      </div>
    </div>
  </div>
);


export default function SystemAdminProfile() {
  const [user, setUser] = useState(null);

  // תמונת פרופיל + סטטוס אם צריך לשמור
  const [avatar, setAvatar] = useState(null);
  const [avatarDirty, setAvatarDirty] = useState(false); // האם יש שינוי שלא נשמר

  useEffect(() => {
    const raw = localStorage.getItem("csmsUser");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse csmsUser from localStorage", e);
      }
    }

    const storedAvatar = localStorage.getItem("csmsAdminAvatar");
    if (storedAvatar) {
      setAvatar(storedAvatar);
      setAvatarDirty(false);
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setAvatar(dataUrl);
      setAvatarDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = () => {
    if (!avatarDirty) return;

    if (avatar) {
      localStorage.setItem("csmsAdminAvatar", avatar);
    } else {
      localStorage.removeItem("csmsAdminAvatar");
    }
    setAvatarDirty(false);
    alert("Profile picture saved.");
  };

  const handleAvatarRemove = () => {
    const ok = window.confirm("Remove profile picture?");
    if (!ok) return;

    setAvatar(null);
    localStorage.removeItem("csmsAdminAvatar");
    setAvatarDirty(false);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-200 p-8 text-sm text-slate-500">
          <p>
            No user data loaded. Please log out and log in again as a System
            Admin.
          </p>
        </div>
      </div>
    );
  }

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "System Admin";
  const initials =
    (firstName?.[0] || "") + (lastName?.[0] || "") || "SA";
  const idNumber = user.national_id || user.id_number || user.id || ""; // מנסה למצוא ת"ז במקומות שונים

  return (
    <div className="space-y-6">
      {/* כותרת הדף */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
          <User className="inline h-7 w-7 text-indigo-600 mr-2 -mt-1" />
          My Profile
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          View your System Admin account details and manage your personal
          preferences.
        </p>
      </div>


      {/* כרטיס פרופיל ראשי */}
      <div className="bg-white/90 rounded-2xl shadow-md border border-slate-200 px-6 py-6 md:px-8 md:py-7 flex flex-col lg:flex-row gap-8">

        {/* צד שמאל – תמונה, שם ותפקיד */}
        <div className="flex flex-col items-center md:items-start lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 pr-0 lg:pr-8 pb-6 lg:pb-0">
          
          {/* אזור התמונה */}
          <div className="relative mb-5">
            {/* התמונה או האותיות הראשיות */}
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-32 w-32 rounded-3xl object-cover shadow-lg border-4 border-white ring-2 ring-indigo-200"
              />
            ) : (
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {initials}
              </div>
            )}

            {/* כפתור שינוי */}
            <label className="absolute -bottom-1 -right-1 px-3 py-1.5 rounded-full bg-white shadow-md text-xs font-medium text-slate-700 cursor-pointer border border-slate-200 hover:bg-slate-50 transition-colors flex items-center">
              <Upload className="h-3 w-3 mr-1" />
              Change
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* כפתורי שמירה/הסרה */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={handleAvatarSave}
              disabled={!avatarDirty}
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
                avatarDirty
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Save className="h-3 w-3 mr-1.5" />
              Save
            </button>

            <button
              type="button"
              onClick={handleAvatarRemove}
              className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold border border-slate-300 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 shadow-sm"
            >
              <X className="h-3 w-3 mr-1.5" />
              Remove
            </button>
          </div>

          {/* שם + תפקיד + תיאור תפקיד */}
          <div className="text-center md:text-left">
            <div className="text-xl font-bold text-slate-900">
              {fullName}
            </div>
            <div className="text-sm font-medium uppercase tracking-widest text-indigo-600 mt-1 flex items-center justify-center md:justify-start">
                <Shield className="h-4 w-4 mr-2" />
                {mapRole(user.role)}
            </div>
            <div className="mt-4 text-xs text-slate-500 max-w-xs md:max-w-none">
              This account has global permissions to manage departments, approve
              Department Admins, and configure the CSMS system.
            </div>
          </div>
        </div>

        {/* צד ימין – פרטים מפורטים (רשת 2 עמודות) */}
        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm pt-4 lg:pt-0">
          
          {/* עמודה 1: שם ואימייל */}
          <div className="space-y-6">
            <DetailItem icon={User} title="First name" value={firstName} />
            <DetailItem icon={User} title="Last name" value={lastName} />
            <DetailItem icon={Mail} title="Email" value={<span className="font-mono text-[13px]">{user.email}</span>} />
          </div>

          {/* עמודה 2: טלפון, ת"ז, תפקיד (Role) */}
          <div className="space-y-6">
            <DetailItem icon={Phone} title="Phone number" value={user.phone} />
            <DetailItem 
                icon={IdCard} 
                title="ID number" 
                value={idNumber || <span className="text-slate-400">Not available</span>} 
            />
            <DetailItem icon={Info} title="System Role" value={mapRole(user.role)} />
          </div>
        </div>
      </div>
    </div>
  );
}
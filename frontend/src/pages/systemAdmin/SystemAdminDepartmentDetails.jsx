// frontend/src/pages/systemAdmin/SystemAdminDepartmentDetails.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  BookOpenText,
  Clock,
  Briefcase,
  ArrowLeft,
  X,
  AlertTriangle,
  ClipboardList,
  Info,
  UserRound,
} from "lucide-react";

import { deleteAdminDepartment } from "../../api/api"; // 👈 להוסיף


/**
 * Generic confirmation modal with formal, minimal design
 */
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  confirmClass,
  IconComponent,
  iconColorClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-3">
          <h3 className="flex items-center text-sm font-semibold text-slate-900">
            {IconComponent && (
              <IconComponent className={`mr-2 h-5 w-5 ${iconColorClass}`} />
            )}
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <p className="mb-6 text-sm leading-relaxed text-slate-700">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SystemAdminDepartmentDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const dept = state?.department;
  const successMessage = state?.successMessage;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

  const formatDegree = (degree) => {
    switch (degree) {
      case "MSC":
        return "Master's degree (M.Sc.)";
      case "BOTH":
        return "Bachelor's and Master's (B.Sc. + M.Sc.)";
      case "BSC":
      default:
        return "Bachelor's degree (B.Sc.)";
    }
  };

  const editModalContent = {
    title: "Edit Department Details",
    message:
      "You are about to open the department editing interface. Changes to this data may affect related courses, syllabi and users. Please continue only if you are authorized to do so.",
    onConfirm: () => {
      setIsModalOpen(false);
      navigate(`/system-admin/departments/edit/${dept.code}`, {
        state: { department: dept },
      });
    },
    confirmText: "Continue to Edit",
    confirmClass: "bg-indigo-600 hover:bg-indigo-700",
    IconComponent: Pencil,
    iconColorClass: "text-indigo-600",
  };

  const deleteModalContent = {
    title: "Confirm Department Deletion",
    message: `You are about to permanently delete the department "${dept.name}" (${dept.code}). This action is irreversible and may affect related records. Are you sure you wish to proceed?`,
    onConfirm: async () => {
      setIsModalOpen(false);
      try {
        await deleteAdminDepartment(dept.id);  // 👈 שימוש אמיתי בפונקציה
        alert(`Department "${dept.name}" was deleted successfully.`);
        navigate("/system-admin/departments/manage");
      } catch (error) {
        console.error("Failed to delete department", error);
        alert("Failed to delete department. Please try again.");
      }
    },
    confirmText: "Confirm deletion",
    confirmClass: "bg-red-600 hover:bg-red-700",
    IconComponent: AlertTriangle,
    iconColorClass: "text-red-600",
  };

  const modalProps =
    modalType === "delete" ? deleteModalContent : editModalContent;

  // If user entered directly without state
  if (!dept) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-transparent px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-red-700">
            Department details not available
          </h2>
          <p className="text-sm text-slate-600">
            The department details could not be loaded. Please go back to the
            departments list and try again.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/system-admin/departments/manage")}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Departments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    {/* ✅ הודעת הצלחה אחרי עדכון */}
     {successMessage && (
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      </div>
     )}
      {/* Main card – academic style, aligned with other System Admin pages */}
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-100 bg-white px-6 py-7 shadow-xl md:px-10 md:py-9">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {/* Icon bubble */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 shadow-sm">
              <Briefcase className="h-6 w-6 text-indigo-600" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Department Profile
              </p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                {dept.name}
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Academic department within the institution. Use this view to
                review key academic properties before updating or deleting this
                department.
              </p>

              {/* Code chip */}
              <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="mr-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Code
                </span>
                <span className="font-mono text-sm uppercase text-slate-900">
                  {dept.code}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Details – academic “stats” cards */}
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          {/* Degree type */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
            <dt className="mb-1 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <BookOpenText className="mr-2 h-4 w-4 text-indigo-500" />
              Academic degree level
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {formatDegree(dept.degree)}
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              Indicates whether this department offers undergraduate and/or
              graduate programs.
            </p>
          </div>

          {/* Years of study */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
            <dt className="mb-1 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Clock className="mr-2 h-4 w-4 text-indigo-500" />
              Years of study
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {dept.years_of_study} years
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              Standard duration for completing the full academic program.
            </p>
          </div>

          {/* Semesters per year */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
            <dt className="mb-1 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <ClipboardList className="mr-2 h-4 w-4 text-indigo-500" />
              Semesters per year
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {dept.semesters_per_year} semesters
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              Used for syllabus planning, course load and academic calendars.
            </p>
          </div>

            {/* Department Admin */}
  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm">
    <dt className="mb-1 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <UserRound className="mr-2 h-4 w-4 text-indigo-500" />
      Department Admin
    </dt>
    <dd className="mt-1 text-sm font-semibold text-slate-900">
      {dept.department_admin_name
        ? dept.department_admin_name
        : "No department admin assigned yet."}
    </dd>
    <p className="mt-1 text-xs text-slate-500">
      {dept.department_admin_name
        ? `Official department administrator for this department.`
        : "Once a Department Admin signup request is approved for this department, their name will appear here."}
    </p>
  </div>
        </dl>

        {/* Description Section */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <dt className="mb-2 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Info className="mr-2 h-4 w-4 text-indigo-500" />
            Department description
          </dt>
          <dd className="text-sm leading-relaxed text-slate-800">
            {dept.description && dept.description.trim() ? (
              dept.description
            ) : (
              <span className="italic text-slate-500">
                A detailed description has not yet been provided for this
                department. You can use the edit action to document the academic
                focus, research areas and target student audience.
              </span>
            )}
          </dd>
        </div>

        {/* Actions row – back button moved to bottom-left */}
        <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
          {/* Left side: Back + note */}
          <div className="flex flex-col items-start gap-2">
            <button
              onClick={() => navigate("/system-admin/departments/manage")}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to departments list
            </button>
            <p className="text-xs text-slate-500">
              Changes to department data may affect related courses, syllabi and
              registered users.
            </p>
          </div>

          {/* Right side: actions */}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={() => {
                setModalType("edit");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit department
            </button>
            <button
              onClick={() => {
                setModalType("delete");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete department
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={modalProps.title}
        message={modalProps.message}
        onConfirm={modalProps.onConfirm}
        onCancel={() => setIsModalOpen(false)}
        confirmText={modalProps.confirmText}
        confirmClass={modalProps.confirmClass}
        IconComponent={modalProps.IconComponent}
        iconColorClass={modalProps.iconColorClass}
      />
    </div>
  );
}

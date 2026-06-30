"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  phone: string;
  pfp_path: string | null;
  is_admin: number;
  last_login_at: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  // Create states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pfp, setPfp] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPfp, setEditPfp] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [deleteCurrentPfp, setDeleteCurrentPfp] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Cropper states
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<"create" | "edit" | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  async function loadUsers() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Leak-free preview url effect for Create
  useEffect(() => {
    if (!pfp) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pfp);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pfp]);

  // Leak-free preview url effect for Edit
  useEffect(() => {
    if (!editPfp) {
      setEditPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(editPfp);
    setEditPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editPfp]);

  // Submit Create
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    if (pfp) formData.append("pfp", pfp);

    const res = await fetch("/api/users", { method: "POST", body: formData });

    if (res.ok) {
      setName("");
      setPhone("");
      setPfp(null);
      await loadUsers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  }

  // Open Edit Dialog
  function handleOpenEdit(u: User) {
    setEditingUser(u);
    setEditName(u.name);
    setEditPhone(u.phone);
    setEditPfp(null);
    setEditPreviewUrl(null);
    setDeleteCurrentPfp(false);
    setEditError("");
  }

  // Submit Edit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditing(true);
    setEditError("");

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("phone", editPhone);
    if (editPfp) formData.append("pfp", editPfp);
    if (deleteCurrentPfp) formData.append("deletePfp", "true");

    const res = await fetch(`/api/users/${editingUser.id}`, { method: "POST", body: formData });

    if (res.ok) {
      setEditingUser(null);
      await loadUsers();
    } else {
      const data = await res.json();
      setEditError(data.error || "Failed to update user");
    }
    setEditing(false);
  }

  // Delete User
  async function handleDelete(id: number) {
    if (!confirm("Delete this user? All their predictions will be removed.")) return;
    await fetch("/api/users/" + id, { method: "DELETE" });
    await loadUsers();
  }

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "create" | "edit") => {
    const file = e.target.files?.[0];
    if (file) {
      setCropperType(type);
      const reader = new FileReader();
      reader.onload = () => {
        setCropperSrc(reader.result as string);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // Dragging event handlers for the cropper viewport
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offsetX,
      y: e.touches[0].clientY - offsetY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Perform canvas crop
  const handleCropConfirm = () => {
    if (!cropperSrc) return;

    const img = new Image();
    img.src = cropperSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, 200, 200);

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const viewportSize = 240;
        let renderWidth = viewportSize;
        let renderHeight = viewportSize;

        if (imgWidth > imgHeight) {
          renderHeight = (imgHeight / imgWidth) * viewportSize;
        } else {
          renderWidth = (imgWidth / imgHeight) * viewportSize;
        }

        ctx.translate(100, 100);
        const scaleFactor = 200 / viewportSize;
        ctx.translate(offsetX * scaleFactor, offsetY * scaleFactor);
        ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
        ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], "cropped-pfp.jpg", {
                type: "image/jpeg",
              });
              if (cropperType === "edit") {
                setEditPfp(croppedFile);
                setDeleteCurrentPfp(false);
              } else {
                setPfp(croppedFile);
              }
            }
          },
          "image/jpeg",
          0.9
        );
      }
      setCropperSrc(null);
      setCropperType(null);
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-outfit">
            Manage <span className="text-gradient">Predictors</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Register family members, upload and crop profile photos</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add User Form */}
        <form onSubmit={handleSubmit} className="card bg-[#0c0d14]/40 border-white/[0.04] p-5 h-fit space-y-4">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 font-outfit px-1">Add Predictor</h2>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Name</label>
            <input
              type="text"
              placeholder="e.g. Latifa Janahi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. +97339######"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
              required
            />
          </div>

          {/* Profile Photo Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Profile Photo</label>
            <div className="flex items-center gap-4 bg-[#08090f] p-3 rounded-2xl border border-white/[0.06]">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center font-bold text-lg text-gray-500 shrink-0">
                  {name[0] || "?"}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <input
                  type="file"
                  accept="image/*"
                  id="pfp-input"
                  onChange={(e) => handleFileChange(e, "create")}
                  className="hidden"
                />
                <label
                  htmlFor="pfp-input"
                  className="cursor-pointer text-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg border border-emerald-500/20 transition-all select-none"
                >
                  Choose Photo
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => setPfp(null)}
                    className="text-[10px] text-rose-400 font-bold uppercase text-left hover:text-rose-300 transition-colors ml-1 select-none"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-xl text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
          >
            {loading ? "Adding..." : "Add Predictor"}
          </button>
        </form>

        {/* Users List */}
        <div className="space-y-2 md:col-span-2">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 font-outfit px-1 mb-3">Family members</h2>
          {users.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl">
              No family members registered.
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="card bg-[#0c0d14]/50 border-white/[0.06] flex items-center justify-between gap-3 p-3 hover:border-white/[0.12] transition-colors duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  {u.pfp_path ? (
                    <img src={u.pfp_path} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center font-bold text-gray-300 shrink-0">
                      {u.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                      <span>{u.name}</span>
                      {u.is_admin ? (
                        <span className="text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">
                          Admin
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{u.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/15 hover:border-emerald-500/35 transition-all active:scale-95 text-xs font-bold"
                  >
                    Edit
                  </button>
                  {!u.is_admin && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/30 transition-all active:scale-95 text-xs font-bold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-[#0c0d14]/90 backdrop-blur-xl border border-white/[0.08] max-w-sm w-full p-6 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-white font-outfit">Edit Predictor</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Update profile details</p>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-xl mb-4 text-center">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="input text-xs py-2.5 px-3 bg-[#08090f] border-white/[0.08]"
                  required
                />
              </div>

              {/* Profile Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Profile Photo</label>
                
                <div className="flex items-center gap-4 bg-[#08090f] p-3 rounded-2xl border border-white/[0.06]">
                  {editPreviewUrl ? (
                    <img src={editPreviewUrl} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : editingUser.pfp_path && !deleteCurrentPfp ? (
                    <img src={editingUser.pfp_path} alt="Current" className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center font-bold text-lg text-gray-400 shrink-0">
                      {editName[0] || "?"}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      id="edit-pfp-input"
                      onChange={(e) => handleFileChange(e, "edit")}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-pfp-input"
                      className="cursor-pointer text-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg border border-emerald-500/20 transition-all select-none"
                    >
                      Choose Photo
                    </label>
                    
                    {(editPreviewUrl || (editingUser.pfp_path && !deleteCurrentPfp)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditPfp(null);
                          setEditPreviewUrl(null);
                          setDeleteCurrentPfp(true);
                        }}
                        className="text-[10px] text-rose-400 font-bold uppercase text-left hover:text-rose-300 transition-colors ml-1 select-none"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  {editing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROPPER MODAL OVERLAY */}
      {cropperSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full bg-[#0c0d14]/95 border-white/[0.08] shadow-2xl p-6 flex flex-col items-center gap-5">
            <div className="text-center w-full">
              <h3 className="font-extrabold text-lg text-white font-outfit">Crop Profile Photo</h3>
              <p className="text-xs text-gray-400 mt-1">Drag to position, use slider to zoom</p>
            </div>

            {/* Viewport Box */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              className="relative overflow-hidden w-[240px] h-[240px] border border-white/10 rounded-full cursor-move shadow-inner bg-black flex items-center justify-center select-none"
            >
              <img
                src={cropperSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
                className="pointer-events-none select-none transition-transform duration-75"
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setCropperSrc(null);
                  setCropperType(null);
                }}
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="btn-primary flex-1 py-2 text-xs font-bold"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

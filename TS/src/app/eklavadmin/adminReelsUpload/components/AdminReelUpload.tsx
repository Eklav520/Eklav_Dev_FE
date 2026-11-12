import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import {
  FaVideo, FaPlus, FaEdit, FaTrash, FaEye, FaArrowUp, FaArrowDown, FaUpload, FaSave, FaTimes,
  FaSpinner, FaSyncAlt, FaCheckCircle, FaExclamationTriangle, FaFilm, FaLock, FaCloudUploadAlt, FaLayerGroup, FaPlay,
} from "react-icons/fa";
import { AdminPage, AdminSelect, EmptyState, PageHeader, SearchInput, StatCards, TableFooter, type StatItem } from "@/components/admin-ui";
import { UploadProgress } from "../../aptitudeQuestionsUpload/components/UploadParts";

type ReelSection = {
  _id: string;
  courseName: string;
  shortDescription: string;
  isActive: boolean;
  reelCount: number;
  createdAt: string;
  reels?: {
    _id: string;
    title: string;
    videoUrl: string;
    order?: number;
  }[];
};

type ReelInput = {
  _id?: string;
  title: string;
  video: File | null;
  videoUrl?: string;
  order?: number;
};

const PAGE_SIZE = 10;
const fmtSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

/* Video picker for a new reel: drop zone until a file is chosen, then a chip with a preview */
const VideoPicker = ({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pick = (f?: File | null) => { if (f && f.type.startsWith("video/")) onChange(f); };

  return (
    <>
      <input ref={inputRef} type="file" accept="video/*" className="d-none" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {file && url ? (
        <div className="rv-file">
          <video src={url} className="rv-thumb" muted preload="metadata" />
          <div className="aui-stack">
            <strong title={file.name}>{file.name}</strong>
            <small>{fmtSize(file.size)} · uploads when you save</small>
          </div>
          <button type="button" className="aui-btn aui-btn-sm" onClick={() => inputRef.current?.click()}>Replace</button>
          <button type="button" className="aui-icon-btn" title="Remove video" onClick={() => onChange(null)}><FaTimes size={11} /></button>
        </div>
      ) : (
        <div
          className={`rv-drop${drag ? " is-drag" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        >
          <FaCloudUploadAlt /> <span>Drop a video or <u>browse</u></span> <small>MP4 / WebM, vertical works best</small>
        </div>
      )}
    </>
  );
};

const AdminReels: React.FC = () => {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<ReelSection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const [courseName, setCourseName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [reels, setReels] = useState<ReelInput[]>([{ title: "", video: null }]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ReelSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletedReelIds, setDeletedReelIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<ReelSection | null>(null);
  const [playingReel, setPlayingReel] = useState<string | null>(null);

  const fetchSections = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/api/adminSideReels/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(res.data.sections || []);
    } catch (err) {
      console.error("Fetch sections error:", err);
      setError("Failed to fetch reel sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchSections(); }, [token]); // eslint-disable-line
  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sections.filter((s) => {
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      return !q || s.courseName.toLowerCase().includes(q) || (s.shortDescription || "").toLowerCase().includes(q);
    });
  }, [sections, searchTerm, statusFilter]);

  const addReelField = () => setReels((prev) => [...prev, { title: "", video: null, order: prev.length }]);

  const removeReelField = (index: number) => {
    const reel = reels[index];
    if (reel._id) setDeletedReelIds((prev) => [...prev, reel._id!]);
    setReels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReelChange = (index: number, field: "title" | "video", value: any) => {
    setReels((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const moveReel = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= reels.length) return;
    setReels((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const handleEdit = (section: ReelSection) => {
    setEditMode(true);
    setEditId(section._id);
    setCourseName(section.courseName);
    setSectionDescription(section.shortDescription);
    setDeletedReelIds([]);
    setFormError(null);
    setReels(section.reels && section.reels.length > 0
      ? section.reels.map((r, index) => ({ _id: r._id, title: r.title, video: null, videoUrl: r.videoUrl, order: index }))
      : [{ title: "", video: null }]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setFormError("Unauthorized. Please log in again."); return; }
    if (!courseName.trim() || !sectionDescription.trim()) { setFormError("Enter the course name and a short description."); return; }
    const missingVideo = reels.findIndex((r) => !r._id && r.title.trim() && !r.video);
    if (missingVideo !== -1) { setFormError(`Choose a video for reel #${missingVideo + 1}, or remove it.`); return; }
    const missingTitle = reels.findIndex((r) => !r._id && r.video && !r.title.trim());
    if (missingTitle !== -1) { setFormError(`Give reel #${missingTitle + 1} a title.`); return; }

    try {
      setSaving(true);
      setUploadPct(0);
      setFormError(null);
      const data = new FormData();
      data.append("courseName", courseName.trim());
      data.append("shortDescription", sectionDescription.trim());

      deletedReelIds.forEach((id) => data.append("deletedReels", id));

      reels.forEach((reel) => {
        if (reel.video) {
          data.append("titles", reel.title.trim());
          data.append("videos", reel.video);
        }
      });

      const reelOrder = reels
        .filter((r) => r._id)
        .map((r, index) => ({ reelId: r._id, order: index }));
      data.append("reelOrder", JSON.stringify(reelOrder));

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (ev: any) => { if (ev.total) setUploadPct(Math.round((ev.loaded / ev.total) * 100)); },
      };
      if (editMode && editId) {
        await axios.put(`${baseURL}/api/adminSideReels/section/${editId}`, data, config);
        setSuccessMessage(`"${courseName.trim()}" was updated.`);
      } else {
        await axios.post(`${baseURL}/api/adminSideReels/upload-multiple-reels`, data, config);
        setSuccessMessage(`"${courseName.trim()}" was created.`);
      }

      resetForm();
      fetchSections();
    } catch (err) {
      console.error("Submit error:", err);
      setFormError("Saving failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCourseName("");
    setSectionDescription("");
    setReels([{ title: "", video: null }]);
    setDeletedReelIds([]);
    setFormError(null);
    setShowModal(false);
    setEditMode(false);
    setEditId(null);
    setPlayingReel(null);
  };

  const toggleStatus = async (section: ReelSection) => {
    if (!token) return;
    setTogglingId(section._id);
    try {
      await axios.patch(`${baseURL}/api/adminSideReels/toggle-section/${section._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections((prev) => prev.map((s) => (s._id === section._id ? { ...s, isActive: !s.isActive } : s)));
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update the status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (section: ReelSection) => {
    if (!token) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseURL}/api/adminSideReels/section/${section._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(`"${section.courseName}" was deleted.`);
      fetchSections();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete the reel section.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const pageRows = filteredSections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalReels = sections.reduce((acc, s) => acc + (s.reelCount || 0), 0);
  const activeSections = sections.filter((s) => s.isActive).length;
  const stats: StatItem[] = [
    { label: "Sections", value: sections.length, icon: FaLayerGroup, tone: "orange" },
    { label: "Reels", value: totalReels, icon: FaFilm, tone: "blue" },
    { label: "Live", value: activeSections, icon: FaEye, tone: "green" },
  ];
  const newVideos = reels.filter((r) => r.video);

  return (
    <AdminPage>
      <PageHeader
        icon={FaVideo}
        title="Admin Reels"
        subtitle="Short video reels grouped by course; switch a section off to hide it from students"
        stats={<StatCards inline items={stats} loading={loading && sections.length === 0} />}
        actions={
          <>
            <button type="button" className="aui-btn" onClick={fetchSections} disabled={loading}>
              <FaSyncAlt size={11} className={loading ? "aui-spin" : ""} /> Refresh
            </button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> Create Section</button>
          </>
        }
      />

      {successMessage && (
        <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{successMessage}</span>
          <button type="button" className="aui-alert-close" onClick={() => setSuccessMessage(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>Reel sections</h3>
            <p>Search by course name or description</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search sections…" />
            <AdminSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: "", label: "All statuses" }, { value: "active", label: "Live" }, { value: "inactive", label: "Hidden" }]}
            />
            <span className="aui-count">{filteredSections.length} section{filteredSections.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        {loading && sections.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading reel sections…</p></div>
        ) : filteredSections.length === 0 ? (
          <EmptyState
            icon={FaVideo}
            title={sections.length ? "No sections match" : "No reel sections yet"}
            text={sections.length ? "Try a different search or status." : "Create a section for a course and upload its reels."}
            action={sections.length
              ? <button type="button" className="aui-btn" onClick={() => { setSearchTerm(""); setStatusFilter(""); }}>Clear filters</button>
              : <button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> Create Section</button>}
          />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}>#</th>
                    <th>Section</th>
                    <th className="text-center" style={{ width: 110 }}>Reels</th>
                    <th style={{ width: 150 }}>Visibility</th>
                    <th style={{ width: 130 }}>Created</th>
                    <th className="text-end" style={{ width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((section, i) => (
                    <tr key={section._id} className={section.isActive ? "" : "rv-off"}>
                      <td className="aui-num">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div className="aui-person">
                          <span className="rv-icon"><FaFilm /></span>
                          <div className="aui-stack">
                            <strong>{section.courseName}</strong>
                            <small className="rv-desc" title={section.shortDescription}>{section.shortDescription || "No description"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        {section.reels && section.reels.length > 0 ? (
                          <button type="button" className="rv-count" onClick={() => setPreviewSection(section)} title="Watch reels">
                            <b>{section.reelCount}</b> <small>reel{section.reelCount === 1 ? "" : "s"}</small>
                          </button>
                        ) : (
                          <span className="rv-count is-static"><b>{section.reelCount}</b> <small>reel{section.reelCount === 1 ? "" : "s"}</small></span>
                        )}
                      </td>
                      <td>
                        <label className="rv-switch" title={section.isActive ? "Live: students can see this section" : "Hidden from students"}>
                          <input type="checkbox" checked={section.isActive} disabled={togglingId === section._id} onChange={() => toggleStatus(section)} />
                          <span className="aui-toggle-track" />
                          <span>{section.isActive ? "Live" : "Hidden"}</span>
                        </label>
                      </td>
                      <td className="rv-date">{new Date(section.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="text-end">
                        <div className="rv-actions">
                          {section.reels && section.reels.length > 0 && (
                            <button type="button" className="aui-icon-btn" title="Watch reels" onClick={() => setPreviewSection(section)}><FaEye /></button>
                          )}
                          <button type="button" className="aui-icon-btn" title="Edit section" onClick={() => handleEdit(section)}><FaEdit /></button>
                          <button type="button" className="aui-icon-btn rv-del" title="Delete section" onClick={() => setShowDeleteConfirm(section)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooter page={currentPage} pageSize={PAGE_SIZE} total={filteredSections.length} onPageChange={setCurrentPage} noun="sections" />
          </>
        )}
      </div>

      {/* ── Create / edit ── */}
      <Modal show={showModal} onHide={() => !saving && resetForm()} size="lg" centered contentClassName="aui-modal" backdropClassName="aui-backdrop" scrollable>
        <form onSubmit={handleSubmit} className="aui-page rv-form">
          <div className="aui-modal-head">
            <span className="aui-heading-icon">{editMode ? <FaEdit /> : <FaPlus />}</span>
            <div>
              <h3>{editMode ? "Edit reel section" : "Create reel section"}</h3>
              <p>{editMode ? courseName : "Name the course, then add its reels in order"}</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={resetForm} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
          </div>

          <div className="aui-modal-body">
            {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}

            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="rv-course">Course name</label>
                <input id="rv-course" className="aui-input" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Full Stack Development" />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="rv-desc">Short description</label>
                <input id="rv-desc" className="aui-input" value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} placeholder="One line about what these reels cover" />
              </div>
            </div>

            <div className="rv-reels-head">
              <div className="aui-section-label">Reels <span className="aui-optional">{reels.length}</span></div>
              <button type="button" className="aui-btn aui-btn-sm aui-btn-soft" onClick={addReelField}><FaPlus size={10} /> Add reel</button>
            </div>

            <div className="rv-reels">
              {reels.length === 0 && <div className="rv-reels-empty">No reels. Add one to upload a video.</div>}
              {reels.map((reel, index) => (
                <div key={reel._id || `new-${index}`} className={`rv-reel${reel._id ? " is-saved" : ""}`}>
                  <div className="rv-reel-head">
                    <span className="rv-order">{index + 1}</span>
                    {reel._id ? (
                      <>
                        {reel.videoUrl ? (
                          <button type="button" className={`rv-mini${playingReel === reel._id ? " is-on" : ""}`} onClick={() => setPlayingReel(playingReel === reel._id ? null : reel._id!)} title={playingReel === reel._id ? "Hide player" : "Play"}>
                            <video src={`${reel.videoUrl}#t=0.5`} muted preload="metadata" />
                            <span>{playingReel === reel._id ? <FaTimes size={9} /> : <FaPlay size={9} />}</span>
                          </button>
                        ) : <span className="rv-mini is-empty"><FaFilm /></span>}
                        <div className="rv-saved-title">
                          <strong>{reel.title || "Untitled reel"}</strong>
                          <small><FaLock size={9} /> Saved reel · reorder or remove</small>
                        </div>
                      </>
                    ) : (
                      <input className="aui-input rv-title" placeholder="Reel title" value={reel.title} onChange={(e) => handleReelChange(index, "title", e.target.value)} />
                    )}
                    <div className="rv-reel-actions">
                      <button type="button" className="aui-icon-btn" title="Move up" onClick={() => moveReel(index, -1)} disabled={index === 0}><FaArrowUp size={10} /></button>
                      <button type="button" className="aui-icon-btn" title="Move down" onClick={() => moveReel(index, 1)} disabled={index === reels.length - 1}><FaArrowDown size={10} /></button>
                      <button type="button" className="aui-icon-btn rv-del" title={reel._id ? "Remove this reel when saving" : "Remove"} onClick={() => removeReelField(index)}><FaTrash size={10} /></button>
                    </div>
                  </div>
                  {reel._id ? (
                    playingReel === reel._id && reel.videoUrl && <video src={reel.videoUrl} controls autoPlay className="rv-saved-video" />
                  ) : (
                    <VideoPicker file={reel.video} onChange={(f) => handleReelChange(index, "video", f)} />
                  )}
                </div>
              ))}
            </div>
            {deletedReelIds.length > 0 && (
              <p className="aui-hint rv-removed">{deletedReelIds.length} saved reel{deletedReelIds.length === 1 ? "" : "s"} will be removed when you save.</p>
            )}

            {saving && newVideos.length > 0 && (
              <div className="rv-progress"><UploadProgress value={uploadPct} label={`Uploading ${newVideos.length} video${newVideos.length === 1 ? "" : "s"}…`} /></div>
            )}
          </div>

          <div className="aui-modal-foot">
            <span className="rv-foot-note">{newVideos.length > 0 ? `${newVideos.length} new video${newVideos.length === 1 ? "" : "s"} · ${fmtSize(newVideos.reduce((s, r) => s + (r.video?.size || 0), 0))}` : ""}</span>
            <button type="button" className="aui-btn" onClick={resetForm} disabled={saving}>Cancel</button>
            <button type="submit" className="aui-btn aui-btn-primary" disabled={saving}>
              {saving ? <FaSpinner className="aui-spin" style={{ color: "#fff" }} /> : editMode ? <FaSave size={11} /> : <FaUpload size={11} />}
              {saving ? " Saving…" : editMode ? " Save changes" : " Create section"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Watch reels ── */}
      <Modal show={!!previewSection} onHide={() => setPreviewSection(null)} size="lg" centered contentClassName="aui-modal" backdropClassName="aui-backdrop" scrollable>
        <div className="aui-modal-head">
          <span className="aui-heading-icon"><FaFilm /></span>
          <div>
            <h3>{previewSection?.courseName}</h3>
            <p>{previewSection?.reels?.length || 0} reel{previewSection?.reels?.length === 1 ? "" : "s"} in student order</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={() => setPreviewSection(null)} aria-label="Close"><FaTimes size={12} /></button>
        </div>
        <div className="aui-modal-body">
          <div className="rv-gallery">
            {previewSection?.reels?.map((r, i) => (
              <figure key={r._id}>
                <video src={r.videoUrl} controls preload="metadata" />
                <figcaption><span>{i + 1}</span> {r.title || "Untitled reel"}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Delete ── */}
      <Modal show={!!showDeleteConfirm} onHide={() => !deleting && setShowDeleteConfirm(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-modal-head">
          <span className="rv-del-icon"><FaTrash /></span>
          <div>
            <h3>Delete this section?</h3>
            <p>{showDeleteConfirm?.courseName}</p>
          </div>
        </div>
        <div className="aui-modal-body">
          <p className="rv-modal-text">The section and all {showDeleteConfirm?.reelCount ?? 0} of its reels are removed for good. To hide it from students instead, switch it to Hidden.</p>
        </div>
        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-danger" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} disabled={deleting}>
            {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete section
          </button>
        </div>
      </Modal>

      <style>{`
        .rv-off td > * { opacity: 0.6; }
        .rv-off td:nth-child(4) > * { opacity: 1; }
        .rv-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border-radius: 10px; background: rgba(255,122,0,0.1); color: #ff9a3c; }
        .rv-desc { display: block; max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rv-count { display: inline-flex; align-items: baseline; gap: 4px; padding: 2px 6px; border: 0; background: none; color: #858a90; cursor: pointer; }
        .rv-count b { color: #ff9a3c; font-size: 1rem; }
        .rv-count:hover b { text-decoration: underline; }
        .rv-count.is-static { cursor: default; }
        .rv-count.is-static b { color: #c3c7ca; }
        .rv-count small { font-size: 0.72rem; }
        .rv-date { color: #a6abb0; font-size: 0.78rem; white-space: nowrap; }
        .rv-actions { display: inline-flex; gap: 6px; }
        .rv-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .rv-switch { position: relative; display: inline-flex; align-items: center; gap: 8px; margin: 0; color: #9da2a8; font-size: 0.76rem; font-weight: 650; cursor: pointer; }
        .rv-switch input { position: absolute; opacity: 0; pointer-events: none; }
        .rv-switch .aui-toggle-track { margin-top: 0; }
        .rv-switch input:checked + .aui-toggle-track { background: #31c45e; }
        .rv-switch input:checked + .aui-toggle-track::after { background: #fff; transform: translateX(16px); }
        .rv-switch input:checked ~ span:last-child { color: #45dd75; }
        .rv-switch input:disabled ~ * { opacity: 0.5; }

        .rv-reels-head { display: flex; align-items: center; justify-content: space-between; margin: 0.25rem 0 0.6rem; }
        .rv-reels-head .aui-section-label { margin: 0; }
        .rv-reels { display: flex; flex-direction: column; gap: 10px; }
        .rv-reels-empty { padding: 1rem; border: 1px dashed #2c3034; border-radius: 10px; color: #6b7280; font-size: 0.8rem; text-align: center; }
        .rv-reel { display: flex; flex-direction: column; gap: 10px; padding: 0.75rem; border: 1px solid #25282b; border-radius: 12px; background: #111315; }
        .rv-reel-head { display: flex; align-items: center; gap: 10px; }
        .rv-order { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 8px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.78rem; font-weight: 800; }
        .rv-title { flex: 1; height: 36px; }
        .rv-saved-title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .rv-saved-title strong { overflow: hidden; color: #eceef0; font-size: 0.86rem; text-overflow: ellipsis; white-space: nowrap; }
        .rv-saved-title small { display: inline-flex; align-items: center; gap: 5px; color: #6b7280; font-size: 0.7rem; }
        .rv-reel-actions { display: flex; gap: 4px; }
        .rv-reel-actions .aui-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .rv-saved-video { width: 100%; max-height: 280px; border-radius: 8px; background: #000; }
        /* The form sits between the modal content and its body, so it has to pass the scroll down */
        .rv-form { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); overflow: hidden; }
        .rv-form .aui-modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-color: #34383d transparent; scrollbar-width: thin; }
        .rv-reel.is-saved { gap: 0; padding: 0.55rem 0.7rem; }
        .rv-reel.is-saved .rv-saved-video { margin-top: 0.6rem; }
        .rv-mini { position: relative; display: block; width: 72px; height: 42px; flex: 0 0 72px; overflow: hidden; padding: 0; border: 1px solid #2c3034; border-radius: 7px; background: #000; cursor: pointer; }
        .rv-mini video { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; pointer-events: none; }
        .rv-mini span { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; }
        .rv-mini span svg { padding: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,122,0,0.9); box-sizing: border-box; }
        .rv-mini:hover { border-color: rgba(255,122,0,0.6); }
        .rv-mini.is-on { border-color: #ff7a00; }
        .rv-mini.is-empty { display: grid; place-items: center; color: #4b5056; cursor: default; }
        .rv-drop { display: flex; align-items: center; gap: 10px; padding: 0.8rem 1rem; border: 1.5px dashed #3a3f45; border-radius: 10px; background: #0e1012; color: #9aa0a6; font-size: 0.8rem; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .rv-drop:hover, .rv-drop:focus-visible, .rv-drop.is-drag { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); outline: none; }
        .rv-drop svg { color: #ff7a00; font-size: 1.1rem; }
        .rv-drop u { color: #ff9a3c; text-decoration: none; }
        .rv-drop small { margin-left: auto; color: #6b7280; font-size: 0.7rem; }
        .rv-file { display: flex; align-items: center; gap: 12px; padding: 0.6rem 0.75rem; border: 1px solid rgba(49,216,102,0.25); border-radius: 10px; background: rgba(49,216,102,0.05); }
        .rv-file .aui-stack { flex: 1; min-width: 0; }
        .rv-file strong { overflow: hidden; color: #e5e7eb; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
        .rv-file small { color: #858a90; font-size: 0.7rem; }
        .rv-thumb { width: 64px; height: 44px; flex: 0 0 64px; border-radius: 6px; background: #000; object-fit: cover; }
        .rv-removed { margin-top: 0.6rem !important; color: #f4b43f !important; }
        .rv-progress { margin-top: 0.9rem; }
        .rv-foot-note { margin-right: auto; color: #858a90; font-size: 0.74rem; }

        .rv-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
        .rv-gallery figure { margin: 0; overflow: hidden; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .rv-gallery video { display: block; width: 100%; aspect-ratio: 9 / 16; max-height: 320px; background: #000; object-fit: contain; }
        .rv-gallery figcaption { display: flex; align-items: center; gap: 8px; padding: 0.5rem 0.65rem; color: #e5e7eb; font-size: 0.78rem; }
        .rv-gallery figcaption span { display: grid; place-items: center; width: 20px; height: 20px; flex: 0 0 20px; border-radius: 6px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.68rem; font-weight: 800; }
        .rv-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
        .rv-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }
      `}</style>
    </AdminPage>
  );
};

export default AdminReels;

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { toast } from "sonner";

interface Album {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  _count: { images: number };
}

export default function GalleryAdminPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumForm, setAlbumForm] = useState({ title: "", description: "", coverUrl: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/gallery");
    const data = await res.json();
    setAlbums(data.albums || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "album", ...albumForm }),
      });
      if (res.ok) {
        toast.success("Album created");
        setAddAlbumOpen(false);
        setAlbumForm({ title: "", description: "", coverUrl: "" });
        fetchAlbums();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum || !imageUrl) return;
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "image", albumId: selectedAlbum.id, imageUrl, caption: imageCaption }),
    });
    if (res.ok) {
      toast.success("Image added");
      setImageUrl("");
      setImageCaption("");
      fetchAlbums();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Gallery & Media</h1>
        <Button size="sm" onClick={() => setAddAlbumOpen(true)}>
          <Plus size={15} /> New Album
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>No albums yet. Create the first album.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map(album => (
            <div key={album.id}
              onClick={() => setSelectedAlbum(album)}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-md transition-all">
              <div className="h-32 bg-primary-50 flex items-center justify-center">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-primary-300" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{album.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{album._count.images} photos</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Album Modal */}
      <Modal open={addAlbumOpen} onClose={() => setAddAlbumOpen(false)} title="Create New Album" size="sm">
        <form onSubmit={handleAddAlbum} className="space-y-4">
          <Input label="Album Title" required value={albumForm.title} onChange={e => setAlbumForm(p => ({ ...p, title: e.target.value }))} />
          <Input label="Description" value={albumForm.description} onChange={e => setAlbumForm(p => ({ ...p, description: e.target.value }))} />
          <Input label="Cover Image URL" value={albumForm.coverUrl} onChange={e => setAlbumForm(p => ({ ...p, coverUrl: e.target.value }))} hint="Paste image URL" />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddAlbumOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Create Album</Button>
          </div>
        </form>
      </Modal>

      {/* Album detail modal */}
      <Modal open={!!selectedAlbum} onClose={() => setSelectedAlbum(null)} title={selectedAlbum?.title || ""} size="lg">
        <form onSubmit={handleAddImage} className="flex gap-3 mb-4">
          <Input placeholder="Paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="flex-1" />
          <Input placeholder="Caption (optional)" value={imageCaption} onChange={e => setImageCaption(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm"><Plus size={14} /> Add</Button>
        </form>
        <p className="text-xs text-gray-400 mb-4">In production, images will be uploaded via Supabase Storage. Currently using URL input.</p>
      </Modal>
    </div>
  );
}

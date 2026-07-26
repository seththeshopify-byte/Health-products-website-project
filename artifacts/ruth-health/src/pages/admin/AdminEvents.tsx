import { useEffect, useRef, useState } from "react";
import { useListEvents, getListEventsQueryKey, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarPlus, Edit2, Trash2, Video, MapPin, Loader2 } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";

const emptyForm = { title: "", description: "", location: "", eventDate: "", imageUrls: [] as string[], videoUrls: [] as string[] };

// Removes potentially dangerous markup (scripts, event handlers, javascript: links)
// while keeping normal formatting tags like <b>, <i>, <span style="...">, <font>, etc.
function sanitizeHtml(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  const stripDangerous = (node: Element) => {
    Array.from(node.children).forEach((child) => stripDangerous(child));
    if (["SCRIPT", "IFRAME", "OBJECT", "EMBED", "STYLE"].includes(node.tagName)) {
      node.remove();
      return;
    }
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      if (name.startsWith("on") || (name === "href" && value.startsWith("javascript:"))) {
        node.removeAttribute(attr.name);
      }
    });
  };

  Array.from(container.children).forEach((child) => stripDangerous(child));
  return container.innerHTML;
}

// A contentEditable field that preserves formatting (bold, italic, color, etc.)
// when the admin pastes ready-made text from Word, Google Docs, AI tools, etc.
function RichTextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && ref.current) {
      ref.current.innerHTML = value;
      initialized.current = true;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onPaste={() => {
        setTimeout(() => {
          if (ref.current) {
            const clean = sanitizeHtml(ref.current.innerHTML);
            if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean;
            onChange(ref.current.innerHTML);
          }
        }, 0);
      }}
      onInput={() => {
        if (ref.current) onChange(ref.current.innerHTML);
      }}
      className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

// A plain code box for pasting raw HTML source (e.g. <h2>, <ul><li>, style="color:...").
function HtmlSourceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<h2>Heading</h2>&#10;<p>Paragraph text...</p>"
    />
  );
}

// A location input that suggests real places as the admin types, using the free
// OpenStreetMap Nominatim search API — no API key or billing required.
function LocationAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (location: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<{ display_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(value)}`
        );
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (displayName: string) => {
    skipNextFetch.current = true;
    onChange(displayName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="event-location"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Start typing an address or venue..."
          autoComplete="off"
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.display_name}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion.display_name)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEvents() {
  const { data: events, isLoading } = useListEvents({ query: { queryKey: getListEventsQueryKey() } });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [textMode, setTextMode] = useState<"paste" | "html">("paste");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, imageUrls: [], videoUrls: [] });
    setFormKey((key) => key + 1);
    setTextMode("paste");
    setOpen(true);
  };
  const openEdit = (event: any) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      imageUrls: event.imageUrls?.length ? event.imageUrls : event.imageUrl ? [event.imageUrl] : [],
      videoUrls: event.videoUrls || [],
    });
    setFormKey((key) => key + 1);
    setTextMode("paste");
    setOpen(true);
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = { title: formData.title, description: formData.description ? sanitizeHtml(formData.description) : null, location: formData.location || null, eventDate: new Date(formData.eventDate).toISOString(), imageUrls: formData.imageUrls, videoUrls: formData.videoUrls, imageUrl: formData.imageUrls[0] ?? null };
    const onSuccess = () => { void invalidate(); setOpen(false); toast({ title: editingId ? "Event updated" : "Event created" }); };
    if (editingId) updateMutation.mutate({ id: editingId, data }, { onSuccess });
    else createMutation.mutate({ data }, { onSuccess });
  };
  const handleDelete = (id: number) => {
    if (!confirm("Delete this event?")) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { void invalidate(); toast({ title: "Event deleted" }); } });
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="mb-1 text-3xl font-serif">Company Events</h1><p className="text-muted-foreground">Manage upcoming and past events, photos, and videos.</p></div><Button onClick={openCreate} className="gap-2"><CalendarPlus size={16} /> Add Event</Button></div>
      <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead>Media</TableHead><TableHead /></TableRow></TableHeader><TableBody>
        {isLoading ? <TableRow><TableCell colSpan={4} className="py-8 text-center">Loading...</TableCell></TableRow> : !events?.length ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No events found</TableCell></TableRow> : events.map((event) => <TableRow key={event.id}><TableCell><div className="font-medium">{event.title}</div><div className="text-sm text-muted-foreground">{event.location}</div></TableCell><TableCell>{new Date(event.eventDate).toLocaleDateString("en-NG")}</TableCell><TableCell className="text-sm text-muted-foreground">{event.imageUrls?.length || (event.imageUrl ? 1 : 0)} photo(s), {event.videoUrls?.length || 0} video(s)</TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Edit2 size={16} /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}><Trash2 size={16} /></Button></div></TableCell></TableRow>)}
      </TableBody></Table></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingId ? "Edit Event" : "Add Company Event"}</DialogTitle></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid gap-2"><Label htmlFor="event-title">Title</Label><Input id="event-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
        <div className="grid gap-2"><Label htmlFor="event-date">Date and time</Label><Input id="event-date" type="datetime-local" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required /></div>
        <div className="grid gap-2">
          <Label htmlFor="event-location">Location</Label>
          <LocationAutocomplete value={formData.location} onChange={(location) => setFormData({ ...formData, location })} />
          <p className="text-xs text-muted-foreground">Start typing and pick the exact place from the suggestions — this makes the "view on map" link accurate.</p>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="event-description">Description</Label>
            <div className="flex rounded-full border bg-muted p-0.5 text-xs">
              <button type="button" onClick={() => setTextMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste formatted text</button>
              <button type="button" onClick={() => setTextMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste HTML code</button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {textMode === "paste"
              ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
              : "Paste raw HTML code (e.g. <h2>, <ul><li>, style=\"color:...\") and it will render as real headings, lists, and colors."}
          </p>
          {textMode === "paste" ? (
            <RichTextField key={`rich-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
          ) : (
            <>
              <HtmlSourceField key={`html-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
              <div className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                <div
                  className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.description) || "<span class=\"text-muted-foreground\">Nothing to preview yet…</span>" }}
                />
              </div>
            </>
          )}
        </div>
        <div className="grid gap-2"><Label><Video size={15} className="mr-1 inline" /> Event photos and videos</Label><MediaUploader imageUrls={formData.imageUrls} videoUrls={formData.videoUrls} onImagesChange={(imageUrls) => setFormData({ ...formData, imageUrls })} onVideosChange={(videoUrls) => setFormData({ ...formData, videoUrls })} /></div>
      </div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Event"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}

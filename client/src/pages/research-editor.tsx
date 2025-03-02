import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import RouteDebug from "@/components/RouteDebug";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toggle } from "@/components/ui/toggle";
import type { ResearchDocument } from "@shared/schema";
import { X, Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResearchEditor() {
  // Get ID directly from URL since params aren't working
  const [location] = useLocation();
  const urlParts = location.split('/');
  const id = urlParts[urlParts.length - 1];

  // Keep original params for debugging
  const params = useParams<{ id: string }>();
  console.log("PARAMS DEBUG:", params, "ID from URL:", id);
  const isNewDocument = id === 'new';

  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [authors, setAuthors] = useState("");
  const [content, setContent] = useState("");
  const [useHtmlEditor, setUseHtmlEditor] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now()); // Force re-render when needed
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [fileUpload, setFileUpload] = useState<File | null>(null); // Add state for file upload
  const [fileUrl, setFileUrl] = useState<string | null>(null); // Add state for file URL

  const { data: tinyMceConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/config/tinymce'],
    queryFn: async () => {
      const res = await fetch('/api/config/tinymce', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch TinyMCE config');
      return res.json();
    }
  });

  // Fetch document if editing
  const { data: document, isLoading: isLoadingDocument } = useQuery<ResearchDocument>({
    queryKey: ['/api/research', id],
    queryFn: async () => {
      if (isNewDocument) return null;

      console.log(`Fetching research document with ID: ${id}`);

      const res = await fetch(`/api/research/${id}`, { 
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching research document: ${errorText}`);
        throw new Error(`Failed to fetch research document: ${errorText}`);
      }

      const documentData = await res.json();
      console.log("Received document data:", documentData);
      return documentData;
    },
    enabled: !isNewDocument && !!id,
    staleTime: 0
  });

  // Update form when document data is loaded
  useEffect(() => {
    if (document) {
      console.log("Setting form data from document:", document);
      setTitle(document.title || "");
      setSummary(document.summary || "");
      setAuthors(document.authors || "");
      setContent(document.content || "");
      setImageUrls(Array.isArray(document.imageUrls) ? document.imageUrls : []);
      setTags(Array.isArray(document.tags) ? document.tags : []);
      setFileUrl(document.fileUrl || null); // Set file URL if available
      // Force re-render TinyMCE editor with new content
      setEditorKey(Date.now());
    }
  }, [document]);

  const addImageUrl = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (urlToRemove: string) => {
    setImageUrls(imageUrls.filter(url => url !== urlToRemove));
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const createDocument = useMutation({
    mutationFn: async (data: Partial<ResearchDocument>) => {
      const res = await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      toast({ title: "Success", description: "Research document created successfully" });
      navigate('/research');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create research document",
        variant: "destructive"
      });
    }
  });

  const updateDocument = useMutation({
    mutationFn: async (data: Partial<ResearchDocument>) => {
      console.log(`Updating research document with ID: ${id}`, data);
      const res = await fetch(`/api/admin/research/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      toast({ title: "Success", description: "Research document updated successfully" });
      navigate('/research');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update research document",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!title || !content || !summary) {
      toast({ 
        title: "Error", 
        description: "Title, content, and summary are required",
        variant: "destructive"
      });
      return;
    }

    const documentData = {
      title,
      content,
      summary,
      authors,
      imageUrls,
      tags,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    if (isNewDocument) {
      createDocument.mutate(documentData);
    } else {
      updateDocument.mutate(documentData);
    }
  };

  if (isLoadingDocument) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <RouteDebug />
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {isNewDocument ? "Create New Research Document" : "Edit Research Document"}
            </h2>
            <Button variant="outline" onClick={() => navigate('/research')}>
              Back to Research Management
            </Button>
          </div>

          <Input
            placeholder="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Authors</label>
            <Input
              placeholder="Authors (e.g., John Doe, Jane Smith)"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <Textarea
              placeholder="Brief summary of the research document"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)} 
                    className="rounded-full hover:bg-muted w-4 h-4 inline-flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Images</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group border rounded-md overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Research image ${index + 1}`} 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Image+Error";
                    }}
                  />
                  <button 
                    onClick={() => removeImageUrl(url)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
              />
              <Button type="button" onClick={addImageUrl} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>

          <Input
            placeholder="Thumbnail URL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Document File</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileUpload(e.target.files[0]);
                  }
                }}
                accept=".pdf,.doc,.docx,.txt"
              />
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                  View Current File
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDFs or other document formats for large research papers
            </p>
          </div>

          <div className="flex items-center space-x-2 mb-4 pt-4">
            <span className="text-sm font-medium">Editor Mode:</span>
            <Toggle
              pressed={useHtmlEditor}
              onPressedChange={setUseHtmlEditor}
              aria-label="Toggle HTML editor mode"
            >
              {useHtmlEditor ? "HTML Mode" : "Visual Editor"}
            </Toggle>
          </div>

          {useHtmlEditor ? (
            <Textarea
              placeholder="HTML Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono"
            />
          ) : isLoadingConfig ? (
            <div className="flex items-center justify-center min-h-[500px] border rounded-md">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tinyMceConfig?.apiKey ? (
            <Editor
              key={editorKey}
              apiKey={tinyMceConfig.apiKey}
              initialValue={content}
              onEditorChange={(newContent) => setContent(newContent)}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | image media table | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                images_upload_handler: function (blobInfo, progress) {
                  return new Promise((resolve, reject) => {
                    // For this example, we're just using a direct URL
                    // In a production environment, you would upload to your server
                    const imageUrl = URL.createObjectURL(blobInfo.blob());

                    // Add to our image URLs array
                    setImageUrls(prev => [...prev, imageUrl]);

                    // Resolve with the image URL
                    resolve(imageUrl);
                  });
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[500px] border rounded-md bg-destructive/10">
              <div className="text-center p-4">
                <p className="text-destructive">TinyMCE API Key is missing</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate('/research')}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateDocument.isPending || createDocument.isPending}
            >
              {updateDocument.isPending || createDocument.isPending ? 'Saving...' : 'Save Research Document'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toggle } from "@/components/ui/toggle";
import type { BlogPost } from "@shared/schema";

export default function BlogEditor() {
  // IMPORTANT: Fix for params extraction
  const params = useParams<{ id: string }>();
  const id = params?.id;
  console.log("PARAMS DEBUG:", params, "ID:", id);
  const isNewPost = id === 'new';

  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [useHtmlEditor, setUseHtmlEditor] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now()); // Force re-render when needed

  const { data: tinyMceConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/config/tinymce'],
    queryFn: async () => {
      const res = await fetch('/api/config/tinymce', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch TinyMCE config');
      return res.json();
    }
  });

  // FIXED: Properly fetch post data with correct parameter handling
  const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
    queryKey: ['/api/blog', id],
    queryFn: async () => {
      if (isNewPost) return null;

      // IMPORTANT: Log actual ID being used
      console.log(`Fetching post with ID: ${id}`);

      const res = await fetch(`/api/blog/${id}`, { 
        credentials: 'include',
        cache: 'no-cache' // Modern fetch API approach
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error fetching post: ${errorText}`);
        throw new Error(`Failed to fetch post: ${errorText}`);
      }

      const postData = await res.json();
      console.log("Received post data:", postData);
      return postData;
    },
    enabled: !isNewPost && !!id, // Only run when we have a non-null ID and it's not a new post
    staleTime: 0
  });

  // Update form when post data is loaded
  useEffect(() => {
    if (post) {
      console.log("Setting form data from post:", post);
      setTitle(post.title || "");
      setExcerpt(post.excerpt || "");
      setThumbnailUrl(post.thumbnailUrl || "");
      setContent(post.content || "");
      // Force re-render TinyMCE editor with new content
      setEditorKey(Date.now());
    }
  }, [post]);

  const createPost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post created successfully" });
      navigate('/blog');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive"
      });
    }
  });

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      console.log(`Updating post with ID: ${id}`, data);
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      navigate('/blog');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!title || !content) {
      toast({ 
        title: "Error", 
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    const postData = {
      title,
      content,
      excerpt: excerpt || title.substring(0, 100) + '...',
      thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${Math.random()}/800/400`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    if (isNewPost) {
      createPost.mutate(postData);
    } else {
      updatePost.mutate(postData);
    }
  };

  // Debug panel in development
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="bg-yellow-100 p-4 mb-4 rounded border border-yellow-500 text-xs">
        <h3 className="font-bold">Debug Information</h3>
        <pre>
          ID from params: {JSON.stringify(params, null, 2)}
        </pre>
        <p>ID value: {id}</p>
        <p>Is new post: {isNewPost ? 'Yes' : 'No'}</p>
        <p>Post data: {post ? 'Loaded' : 'Not loaded'}</p>
        <p>Form title: {title}</p>
        <p>Content length: {content?.length || 0} characters</p>
        <button
          className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
          onClick={() => {
            console.log("Current route params:", params);
            console.log("Current ID:", id);
            console.log("Post data:", post);
            console.log("Form state:", { title, excerpt, thumbnailUrl, content });
          }}
        >
          Log Debug Info
        </button>
      </div>
    );
  };

  if (isLoadingPost) {
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
      <DebugPanel />
      <Card className="p-6">
        <div className="space-y-4">
          <Input
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold"
          />
          <Input
            placeholder="Excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
          <Input
            placeholder="Thumbnail URL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />
          <div className="flex items-center space-x-2 mb-4">
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
              key={editorKey} // Key forces re-render with new content
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
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[500px] border rounded-md bg-destructive/10">
              <div className="text-center p-4">
                <p className="text-destructive">TinyMCE API Key is missing</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updatePost.isPending || createPost.isPending}
            >
              {updatePost.isPending || createPost.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
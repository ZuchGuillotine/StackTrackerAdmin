import React, { useEffect, useRef, useState } from "react";
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
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isNewPost = id === 'new';
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for form fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [useHtmlEditor, setUseHtmlEditor] = useState(false);

  // Editor references and state
  const editorRef = useRef<any>(null);
  const [editorInitialized, setEditorInitialized] = useState(false);
  const [postLoaded, setPostLoaded] = useState(false);

  // Flag to control when to initialize the editor with content
  const [shouldSetEditorContent, setShouldSetEditorContent] = useState(false);

  // Fetch TinyMCE config
  const { data: tinyMceConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/config/tinymce'],
    queryFn: async () => {
      const res = await fetch('/api/config/tinymce', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch TinyMCE config');
      return res.json();
    }
  });

  // Fetch post data if editing existing post
  const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
    queryKey: ['/api/blog', id],
    queryFn: async () => {
      if (isNewPost) return null;

      console.log(`Fetching post with ID: ${id}`);
      const res = await fetch(`/api/blog/${id}`, { 
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
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
    enabled: !isNewPost,
    retry: 1,
    staleTime: 0
  });

  // When post data is loaded, update form fields
  useEffect(() => {
    if (post && !postLoaded) {
      console.log("Setting form data from post:", post);
      setTitle(post.title || "");
      setExcerpt(post.excerpt || "");
      setThumbnailUrl(post.thumbnailUrl || "");
      setContent(post.content || "");
      setPostLoaded(true);

      // Signal that we should update the editor content once it's ready
      if (editorInitialized && !useHtmlEditor) {
        setShouldSetEditorContent(true);
      }
    }
  }, [post, postLoaded, editorInitialized, useHtmlEditor]);

  // When the editor is initialized, mark it as ready
  const handleEditorInit = (evt: any, editor: any) => {
    console.log("TinyMCE editor initialized");
    editorRef.current = editor;
    setEditorInitialized(true);

    // If post data was already loaded, set editor content
    if (postLoaded && !useHtmlEditor) {
      setShouldSetEditorContent(true);
    }
  };

  // Handle updating editor content when both editor is ready and post is loaded
  useEffect(() => {
    if (shouldSetEditorContent && editorRef.current && content) {
      console.log("Setting editor content:", content);
      // Using setTimeout to ensure the editor is fully ready
      setTimeout(() => {
        try {
          editorRef.current.setContent(content);
          console.log("Editor content set successfully");
        } catch (error) {
          console.error("Error setting editor content:", error);
        }
        setShouldSetEditorContent(false);
      }, 100);
    }
  }, [shouldSetEditorContent, content]);

  // When toggling between HTML and Visual editor, ensure content stays in sync
  useEffect(() => {
    if (editorInitialized && editorRef.current && postLoaded) {
      if (!useHtmlEditor) {
        // When switching to Visual editor, set content from state
        setShouldSetEditorContent(true);
      } else if (useHtmlEditor && editorRef.current) {
        // When switching to HTML editor, get content from visual editor
        try {
          const editorContent = editorRef.current.getContent();
          if (editorContent && editorContent !== content) {
            setContent(editorContent);
          }
        } catch (error) {
          console.error("Error getting content from editor:", error);
        }
      }
    }
  }, [useHtmlEditor, editorInitialized, postLoaded]);

  // Create new post
  const createPost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      console.log("Creating new post with data:", data);
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create post");
      }

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

  // Update existing post
  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      console.log(`Updating post with ID: ${id}`, data);
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update post");
      }

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
    // Get content from the visual editor if that's what we're using
    let finalContent = content;
    if (!useHtmlEditor && editorRef.current) {
      try {
        finalContent = editorRef.current.getContent();
      } catch (error) {
        console.error("Error getting content from editor:", error);
      }
    }

    if (!title || !finalContent) {
      toast({ 
        title: "Error", 
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    const postData = {
      title,
      content: finalContent,
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

  // Show loading state while fetching
  if (isLoadingPost) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading post data...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
              apiKey={tinyMceConfig.apiKey}
              initialValue={content} // Set initial value
              onInit={handleEditorInit}
              onEditorChange={(newContent) => {
                if (newContent !== content) {
                  setContent(newContent);
                }
              }}
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
                // No setup property that could interfere with initialization
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[500px] border rounded-md bg-destructive/10">
              <div className="text-center p-4">
                <p className="text-destructive">TinyMCE API Key is missing</p>
              </div>
            </div>
          )}

          {/* Debug info - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 border border-gray-300 rounded text-xs bg-gray-50">
              <p><strong>Debug:</strong> Post ID: {id}, Editor Ready: {editorInitialized ? 'Yes' : 'No'}, Post Loaded: {postLoaded ? 'Yes' : 'No'}</p>
              <p>Content Length: {content?.length || 0} characters</p>
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
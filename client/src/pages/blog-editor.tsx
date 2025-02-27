import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Toggle } from "@/components/ui/toggle";
import type { BlogPost } from "@shared/schema";

export default function BlogEditor() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [useHtmlEditor, setUseHtmlEditor] = React.useState(false);

  const { data: tinyMceConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/config/tinymce'],
    queryFn: async () => {
      const res = await fetch('/api/config/tinymce');
      if (!res.ok) throw new Error('Failed to fetch TinyMCE config');
      return res.json();
    }
  });

  const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
    queryKey: ['/api/blog', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const res = await fetch(`/api/blog/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    enabled: !!id && id !== 'new'
  });

  // Update form when post data is loaded
  React.useEffect(() => {
    if (post) {
      setTitle(post.title);
      setExcerpt(post.excerpt);
      setThumbnailUrl(post.thumbnailUrl);
      setContent(post.content);
    }
  }, [post]);

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      navigate('/blog-management');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive"
      });
    }
  });

  const createPost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post created successfully" });
      navigate('/blog-management');
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create post",
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

    if (id === 'new') {
      createPost.mutate(postData);
    } else {
      updatePost.mutate(postData);
    }
  };

  // Show loading state when fetching post data
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

  if (isLoadingConfig) {
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
              value={content}
              onEditorChange={setContent}
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
            <Button variant="outline" onClick={() => navigate('/blog-management')}>
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
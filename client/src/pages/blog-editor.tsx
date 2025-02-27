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
  const { id } = useParams();
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
      const res = await fetch('/api/config/tinymce', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch TinyMCE config');
      return res.json();
    }
  });

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${id}`],
    queryFn: async () => {
      if (id === 'new') return null;
      console.log(`Fetching post with ID: ${id}`);
      const res = await fetch(`/api/blog/${id}`);
      if (!res.ok) {
        console.error(`Failed to fetch post: ${await res.text()}`);
        throw new Error('Failed to fetch post');
      }
      const data = await res.json();
      console.log('Fetched post data:', data);
      return data;
    },
    enabled: !!id && id !== 'new'
  });

  React.useEffect(() => {
    console.log('Post data received:', post);
    if (post) {
      console.log('Setting form values from post:', post);
      setContent(post.content || '');
      setTitle(post.title || '');
      setExcerpt(post.excerpt || '');
      setThumbnailUrl(post.thumbnailUrl || '');
    }
  }, [post]);

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      navigate('/blog-management');
    }
  });

  const createPost = useMutation({ // Assumed mutation for creating new posts
    mutationFn: async (data: BlogPost) => {
      const res = await fetch(`/api/admin/blog/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post created successfully" });
      navigate('/blog-management');
    }
  });


  const handleSave = () => {
    if (id === 'new') {
      createPost.mutate({ title, content, excerpt, thumbnailUrl });
    } else {
      updatePost.mutate({ title, content, excerpt, thumbnailUrl });
    }
  };

  if (isLoading) return <div>Loading...</div>;

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
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading editor...</span>
              </div>
            </div>
          ) : tinyMceConfig?.apiKey ? (
            <Editor
              apiKey={tinyMceConfig.apiKey}
              initialValue={content}
              value={content}
              onEditorChange={(newContent) => setContent(newContent)}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | image media table | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                setup: function(editor) {
                  editor.on('init', function() {
                    if (content) {
                      editor.setContent(content);
                    }
                  });
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[500px] border rounded-md bg-red-50">
              <div className="text-center p-4 max-w-md">
                <div className="text-red-500 text-xl mb-2">TinyMCE API Key Missing</div>
                <p>The editor cannot be loaded because the API key is missing or invalid.</p>
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
          {(updatePost.isError || createPost.isError) && (
            <div className="mt-4 p-4 border border-red-300 bg-red-50 text-red-700 rounded">
              {updatePost.error?.toString() || createPost.error?.toString() || 'An error occurred while saving'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
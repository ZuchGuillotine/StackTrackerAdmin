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
  const id = params?.id || 'new';
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [useHtmlEditor, setUseHtmlEditor] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  console.log("Current ID from params:", id);

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

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`blog-post-${id}`],
    queryFn: async () => {
      if (id === 'new') return null;
      
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        console.error(`Invalid ID format: ${id}`);
        throw new Error('Invalid ID format');
      }
      
      console.log(`Fetching post with ID: ${numericId}`);
      
      try {
        // Use the correct endpoint for fetching a post by ID
        const res = await fetch(`/api/blog/${numericId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          },
          // Add cache busting to prevent stale data
          cache: 'no-store'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to fetch post: ${errorText}`);
          throw new Error(`Failed to fetch post: ${errorText}`);
        }
        
        const data = await res.json();
        console.log('Fetched post data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
    },
    enabled: !!id && id !== 'new',
    refetchOnWindowFocus: false,
    staleTime: 0, // Don't cache the data
    retry: 1
  });

  // Separate useEffect to handle initial load vs updates
  React.useEffect(() => {
    if (post) {
      console.log('Setting initial form values from post:', post);
      
      // Reset the isLoaded state first
      setIsLoaded(false);
      
      // Set form values from post data
      setTitle(post.title || '');
      setExcerpt(post.excerpt || '');
      setThumbnailUrl(post.thumbnailUrl || '');
      setContent(post.content || '');
      
      // Make sure TinyMCE gets the content too
      const editor = window.tinymce?.get('content-editor');
      if (editor) {
        console.log('Setting editor content to:', post.content || '');
        editor.setContent(post.content || '');
      }
      
      setIsLoaded(true);
    }
  }, [post]);

  // This effect runs after TinyMCE is mounted to ensure content is set
  React.useEffect(() => {
    if (post && isLoaded) {
      const editor = window.tinymce?.get('content-editor');
      if (editor) {
        console.log('Updating TinyMCE editor content after load');
        editor.setContent(post.content || '');
      }
    }
  }, [post, isLoaded]);

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      if (!id || id === 'new') {
        throw new Error('Invalid post ID');
      }
      
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
      
      console.log(`Updating post with ID: ${numericId}`, data);
      
      // Include the ID in the data payload
      const postData = {
        ...data,
        id: numericId
      };
      
      const res = await fetch(`/api/admin/blog/${numericId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(postData),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Update failed: ${errorText}`);
        throw new Error(errorText);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: [`blog-post-${id}`] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      navigate('/blog-management');
    },
    onError: (error) => {
      console.error('Update post error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive"
      });
    }
  });

  const createPost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      console.log('Creating new post with data:', data);
      
      // Make sure we have a valid slug
      if (!data.slug && data.title) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      
      const res = await fetch(`/api/admin/blog`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to create post:', errorText);
        throw new Error(errorText);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: "Success", description: "Blog post created successfully" });
      navigate('/blog-management');
    },
    onError: (error) => {
      console.error('Create post error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    // Ensure we have all required fields
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
      thumbnailUrl: thumbnailUrl || 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/800/400',
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    
    console.log('Handling save, id:', id);
    if (id === 'new') {
      createPost.mutate(postData);
    } else {
      updatePost.mutate(postData);
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
              id="content-editor"
              apiKey={tinyMceConfig.apiKey}
              initialValue={content || ''}
              value={content}
              onEditorChange={(newContent) => {
                console.log("Editor content changed:", newContent);
                setContent(newContent);
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
                setup: function(editor) {
                  editor.on('init', function() {
                    // This will run when the editor is first initialized
                    console.log("TinyMCE initialized with post data:", post);
                    
                    // First check if we have post data
                    if (post?.content) {
                      console.log("Setting editor content from post:", post.content);
                      editor.setContent(post.content);
                    } else if (content) {
                      console.log("Setting editor content from state:", content);
                      editor.setContent(content);
                    }
                  });
                  
                  // Add change handler to update local state
                  editor.on('change', function() {
                    const newContent = editor.getContent();
                    if (newContent !== content) {
                      setContent(newContent);
                      console.log("Updated content state:", newContent);
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
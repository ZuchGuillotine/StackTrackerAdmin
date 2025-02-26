
import React from "react";
import { useParams, useNavigate } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { BlogPost } from "@shared/schema";

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    enabled: !!id
  });

  React.useEffect(() => {
    if (post) {
      setContent(post.content);
      setTitle(post.title);
      setExcerpt(post.excerpt);
      setThumbnailUrl(post.thumbnailUrl);
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

  const handleSave = () => {
    updatePost.mutate({
      title,
      content,
      excerpt,
      thumbnailUrl
    });
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
          <Editor
            apiKey="your-tinymce-api-key"
            value={content}
            onEditorChange={(content) => setContent(content)}
            init={{
              height: 500,
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                'toc'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | image media table | toc | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/blog-management')}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

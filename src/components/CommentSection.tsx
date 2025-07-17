import React, { useEffect, useState } from 'react';
import { fetchCommentsByFile, addComment, editComment, deleteComment } from '../integrations/supabase/client';
import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

const TAGS = [
  'Issue',
  'Suggestion',
  'Question',
  'Resolved',
  'Note',
  'Todo',
  'Praise',
] as const;

type Tag = typeof TAGS[number];

type Comment = Database['public']['Tables']['file_comments']['Row'];

interface CommentSectionProps {
  filePath: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ filePath }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState<Tag>('Note');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTag, setEditingTag] = useState<Tag>('Note');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCommentsByFile(filePath)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [filePath]);

  const handleAdd = async () => {
    if (!newComment.trim() || !userId) return;
    setLoading(true);
    try {
      const comment = await addComment({
        file_path: filePath,
        content: newComment,
        tag: newTag,
        user_id: userId,
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setNewTag('Note');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingContent.trim()) return;
    setLoading(true);
    try {
      const updated = await editComment(id, editingContent, editingTag);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      setEditingContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <h3>Comments</h3>
      <ul style={{ paddingLeft: 20 }}>
        {comments.map((c) => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            {editingId === c.id ? (
              <span>
                <select
                  value={editingTag}
                  onChange={(e) => setEditingTag(e.target.value as Tag)}
                  disabled={loading}
                >
                  {TAGS.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <input
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  disabled={loading}
                  style={{ marginLeft: 8, width: 200 }}
                />
                <button onClick={() => handleEdit(c.id)} disabled={loading} style={{ marginLeft: 8 }}>Save</button>
                <button onClick={() => setEditingId(null)} disabled={loading} style={{ marginLeft: 4 }}>Cancel</button>
              </span>
            ) : (
              <span>
                <b>[{c.tag}]</b> {c.content}
                <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                  {new Date(c.created_at).toLocaleString()}
                </span>
                {userId === c.user_id && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingContent(c.content);
                        setEditingTag(c.tag);
                      }}
                      style={{ marginLeft: 8 }}
                      disabled={loading}
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ marginLeft: 4, color: 'red' }}
                      disabled={loading}
                    >Delete</button>
                  </>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <select
          value={newTag}
          onChange={(e) => setNewTag(e.target.value as Tag)}
          disabled={loading}
        >
          {TAGS.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ marginLeft: 8, width: 200 }}
          disabled={loading}
        />
        <button onClick={handleAdd} disabled={loading || !newComment.trim()} style={{ marginLeft: 8 }}>
          Add
        </button>
      </div>
    </div>
  );
};

export default CommentSection; 
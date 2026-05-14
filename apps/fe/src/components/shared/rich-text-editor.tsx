'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  ImagePlus, Link as LinkIcon, Undo, Redo, Heading2, Heading3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadService } from '@/services/upload.service';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
      Underline,
      TextStyle,
      Color,
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] focus:outline-none px-3 py-2',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const { url } = await uploadService.uploadImage(file, 'product');
        editor?.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error('Upload failed:', err);
      }
    };
    input.click();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Nhap URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div className="flex flex-wrap gap-0.5 p-1.5 bg-gray-50 border-b border-gray-200">
        <ToolbarButton icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading 2" />
        <ToolbarButton icon={Heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Heading 3" />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold" />
        <ToolbarButton icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic" />
        <ToolbarButton icon={UnderlineIcon} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="Underline" />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet List" />
        <ToolbarButton icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Ordered List" />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={ImagePlus} onClick={addImage} label="Insert Image" />
        <ToolbarButton icon={LinkIcon} onClick={addLink} label="Insert Link" />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo" />
        <ToolbarButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo" />
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.getText() && (
        <div className="px-4 py-2 text-gray-400 text-sm pointer-events-none absolute top-12 left-0">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, onClick, active, disabled, label }: {
  icon: any; onClick: () => void; active?: boolean; disabled?: boolean; label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 p-0', active && 'bg-gray-200')}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

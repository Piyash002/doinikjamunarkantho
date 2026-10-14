'use client';

import React, { useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableHeaderExtension from '@tiptap/extension-table-header';
import TableCellExtension from '@tiptap/extension-table-cell';
import YoutubeExtension from '@tiptap/extension-youtube';

import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as YoutubeIcon,
  Table as TableIcon,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
} from 'lucide-react';
import { MediaPickerModal, SelectedMedia } from '../ui/MediaPickerModal';

export interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({
  content,
  onChange,
  className = '',
}: TiptapEditorProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      UnderlineExtension,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#1b7d95] underline hover:opacity-80',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TableExtension.configure({
        resizable: true,
      }),
      TableRowExtension,
      TableHeaderExtension,
      TableCellExtension,
      YoutubeExtension.configure({
        width: 640,
        height: 360,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content-area',
      },
    },
  });

  // Calculate word count & reading time
  const { wordCount, readingTime } = useMemo(() => {
    if (!editor) return { wordCount: 0, readingTime: 1 };
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return { wordCount: words, readingTime: minutes };
  }, [editor?.getText()]);

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter Link URL (e.g. https://example.com):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function insertYoutube() {
    if (!editor) return;
    const url = window.prompt('Enter YouTube Video URL:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }

  function insertTable() {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function handleMediaSelect(media: SelectedMedia) {
    if (!editor) return;
    editor.chain().focus().setImage({ src: media.url, alt: media.alt || '' }).run();
  }

  return (
    <div className={`tiptap-editor-wrap ${className}`}>
      {/* Sticky, Horizontally Scrollable Toolbar */}
      <div className="tiptap-toolbar">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('bold') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Bold"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('italic') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Italic"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('underline') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Underline"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Heading 2"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Heading 3"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('blockquote') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Quote"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Bullet List"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Numbered List"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors ${
            editor.isActive('link') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Insert Link"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Image from Media Library */}
        <button
          type="button"
          onClick={() => setIsMediaPickerOpen(true)}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Insert Image"
          title="Insert Image from Media Library"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* YouTube */}
        <button
          type="button"
          onClick={insertYoutube}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Embed YouTube Video"
          title="Embed YouTube Video"
        >
          <YoutubeIcon className="w-4 h-4" />
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={insertTable}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Insert Table"
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Clear formatting"
          title="Clear formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          aria-label="Undo"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          aria-label="Redo"
          title="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Word Count and Reading Time Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-400">
        <span>{wordCount} words</span>
        <span>~{readingTime} min read</span>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Insert Image into Article Body"
      />
    </div>
  );
}

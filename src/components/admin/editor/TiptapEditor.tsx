'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
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
  AlignCenter,
  AlignLeft,
  AlignRight,
  Trash2,
  Loader2,
  Baseline,
  Highlighter,
  ChevronDown,
  Check,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import { ArticleImageConfigModal, ConfiguredImage } from './ArticleImageConfigModal';
import { useToast } from '../ui/Toast';

// Curated text colors for journalistic content
const TEXT_COLORS = [
  { name: 'কালো (ডিফল্ট)', value: '#0f172a' },
  { name: 'ধূসর (Slate)', value: '#64748b' },
  { name: 'ব্র্যান্ড টিল', value: '#1b7d95' },
  { name: 'গাঢ় নীল', value: '#1e40af' },
  { name: 'আকাশি নীল', value: '#0284c7' },
  { name: 'লাল', value: '#dc2626' },
  { name: 'কমলা', value: '#ea580c' },
  { name: 'সবুজ', value: '#16a34a' },
  { name: 'বেগুনি', value: '#7c3aed' },
  { name: 'গোলাপি', value: '#db2777' },
];

// Curated highlight / background tint colors
const HIGHLIGHT_COLORS = [
  { name: 'হলুদ মার্কার', value: '#fef08a' },
  { name: 'সবুজ মার্কার', value: '#bbf7d0' },
  { name: 'আকাশি মার্কার', value: '#bfdbfe' },
  { name: 'কমলা মার্কার', value: '#fed7aa' },
  { name: 'গোলাপি মার্কার', value: '#fecdd3' },
  { name: 'বেগুনি মার্কার', value: '#e9d5ff' },
  { name: 'মিন্ট মার্কার', value: '#cffafe' },
  { name: 'ধূসর ব্যাকগ্রাউন্ড', value: '#e2e8f0' },
  { name: 'হালকা লাল', value: '#fee2e2' },
  { name: 'ক্রিম গোল্ডেন', value: '#fef3c7' },
];


// Custom Image extension that stores and renders width, alignment, classes and inline styles
export const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-width') ||
            element.getAttribute('width') ||
            element.style.width ||
            '100%'
          );
        },
        renderHTML: (attributes) => {
          const width = attributes.width || '100%';
          return {
            'data-width': width,
            width: width,
          };
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-alignment') ||
            (element.classList.contains('image-align-left')
              ? 'left'
              : element.classList.contains('image-align-right')
              ? 'right'
              : element.style.float === 'left'
              ? 'left'
              : element.style.float === 'right'
              ? 'right'
              : 'center')
          );
        },
        renderHTML: (attributes) => {
          return {
            'data-alignment': attributes.alignment || 'center',
          };
        },
      },
      class: {
        default: 'article-image image-size-100 image-align-center',
        parseHTML: (element) => element.getAttribute('class') || '',
        renderHTML: (attributes) => {
          const width = attributes.width || '100%';
          const align = attributes.alignment || 'center';
          let sizeClass = 'image-size-100';
          if (width === '25%') sizeClass = 'image-size-25';
          else if (width === '50%') sizeClass = 'image-size-50';
          else if (width === '75%') sizeClass = 'image-size-75';
          else if (width === '100%') sizeClass = 'image-size-100';

          return {
            class: `article-image ${sizeClass} image-align-${align}`,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style') || null,
        renderHTML: (attributes) => {
          const width = attributes.width || '100%';
          const align = attributes.alignment || 'center';
          let alignStyle = 'display: block; margin: 1rem auto; clear: both;';
          if (align === 'left') {
            alignStyle = 'float: left; margin: 0.5rem 1.25rem 1rem 0; display: inline-block;';
          } else if (align === 'right') {
            alignStyle = 'float: right; margin: 0.5rem 0 1rem 1.25rem; display: inline-block;';
          }
          return {
            style: `width: ${width}; max-width: 100%; height: auto; ${alignStyle}`,
          };
        },
      },
    };
  },
});

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    url: string;
    publicId?: string;
    filename?: string;
    width?: number;
    height?: number;
  } | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isBgColorOpen, setIsBgColorOpen] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#1b7d95');
  const [customBgColor, setCustomBgColor] = useState('#fef08a');

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      UnderlineExtension,
      CustomImage.configure({
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

  function applyTextColor(color: string) {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setIsTextColorOpen(false);
  }

  function clearTextColor() {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
    setIsTextColorOpen(false);
  }

  function applyHighlightColor(color: string) {
    if (!editor) return;
    editor.chain().focus().setHighlight({ color }).run();
    setIsBgColorOpen(false);
  }

  function clearHighlightColor() {
    if (!editor) return;
    editor.chain().focus().unsetHighlight().run();
    setIsBgColorOpen(false);
  }

  const activeTextColor = editor.getAttributes('textStyle')?.color as string | undefined;
  const isHighlightActive = editor.isActive('highlight');
  const activeHighlightColor = editor.getAttributes('highlight')?.color as string | undefined;

  // Trigger native computer folder file picker directly
  function handleTriggerComputerFile() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  // Direct upload from computer folder
  async function handleFileFromComputer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|heic|tiff|bmp|ico)$/i)) {
      toastError('দয়া করে একটি সঠিক ইমেজ ফাইল নির্বাচন করুন (JPEG, PNG, WebP, GIF, SVG ইত্যাদি)।');
      return;
    }

    try {
      setIsUploading(true);
      toastInfo(`"${file.name}" ক্লাউডিনারিতে আপলোড হচ্ছে...`);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await res.json();
      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload to Cloudinary failed.');
      }

      const newMedia = {
        url: uploadData.data.url,
        publicId: uploadData.data.publicId || '',
        filename: file.name,
        width: uploadData.data.width || 0,
        height: uploadData.data.height || 0,
      };

      // Record to media library in background
      fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newMedia.url,
          publicId: newMedia.publicId,
          filename: newMedia.filename,
          fileSize: uploadData.data.fileSize || file.size,
          fileType: uploadData.data.format ? `image/${uploadData.data.format}` : file.type,
          width: newMedia.width,
          height: newMedia.height,
        }),
      }).catch((e) => console.warn('Media record background error:', e));

      toastSuccess('ছবি সফলভাবে আপলোড হয়েছে! এখন সাইজ ও ক্যাপশন নির্ধারণ করুন।');
      setPendingImage(newMedia);
      setIsConfigModalOpen(true);
    } catch (err: any) {
      toastError(err?.message || 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Insert configured image into the Story Body
  function handleInsertConfiguredImage(config: ConfiguredImage) {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: config.url,
        alt: config.alt || config.filename || '',
        width: config.width || '100%',
        alignment: config.alignment || 'center',
      } as any)
      .run();

    if (config.caption && config.caption.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'paragraph',
          attrs: { class: 'image-caption' },
          content: [{ type: 'text', text: config.caption.trim() }],
        })
        .run();
    }

    setPendingImage(null);
  }

  return (
    <div className={`tiptap-editor-wrap ${className}`}>
      {/* Hidden computer file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileFromComputer}
        disabled={isUploading}
      />

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

        {/* Text Color Picker */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => {
              setIsTextColorOpen((prev) => !prev);
              setIsBgColorOpen(false);
            }}
            className={`touch-target px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 ${
              activeTextColor ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-label="Text Color"
            title="টেক্সট কালার (Text Color)"
          >
            <div className="flex flex-col items-center">
              <Baseline className="w-4 h-4" />
              <span
                className="w-3.5 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: activeTextColor || '#1b7d95' }}
              />
            </div>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isTextColorOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsTextColorOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 w-64 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>টেক্সট কালার</span>
                  {activeTextColor && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearTextColor}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-normal"
                    >
                      <ResetIcon className="w-3 h-3" /> ডিফল্ট
                    </button>
                  )}
                </div>

                {/* Preset grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {TEXT_COLORS.map((c) => {
                    const isSelected = activeTextColor?.toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        title={c.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyTextColor(c.value)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 border ${
                          isSelected ? 'ring-2 ring-[#1b7d95] ring-offset-1 border-transparent' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c.value }}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">কাস্টম কালার:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="w-8 h-8 p-0 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      placeholder="#1b7d95"
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyTextColor(customTextColor)}
                      className="px-2.5 py-1 text-xs font-medium bg-[#1b7d95] hover:bg-[#156377] text-white rounded-lg transition-colors shrink-0"
                    >
                      প্রয়োগ
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Background / Highlight Color Picker */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => {
              setIsBgColorOpen((prev) => !prev);
              setIsTextColorOpen(false);
            }}
            className={`touch-target px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 ${
              isHighlightActive ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            aria-label="Highlight Color"
            title="হাইলাইট কালার / ব্যাকগ্রাউন্ড (Highlight / BG Color)"
          >
            <div className="flex flex-col items-center">
              <Highlighter className="w-4 h-4" />
              <span
                className="w-3.5 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: activeHighlightColor || '#fef08a' }}
              />
            </div>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isBgColorOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsBgColorOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 w-64 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>হাইলাইট কালার (BG)</span>
                  {isHighlightActive && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearHighlightColor}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-normal"
                    >
                      <ResetIcon className="w-3 h-3" /> রিমুভ
                    </button>
                  )}
                </div>

                {/* Preset grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {HIGHLIGHT_COLORS.map((c) => {
                    const isSelected = activeHighlightColor?.toLowerCase() === c.value.toLowerCase();
                    return (
                      <button
                        key={c.value}
                        type="button"
                        title={c.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyHighlightColor(c.value)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 border ${
                          isSelected ? 'ring-2 ring-amber-500 ring-offset-1 border-transparent' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c.value }}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-slate-800 drop-shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Highlight Color row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">কাস্টম হাইলাইট:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-8 h-8 p-0 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="#fef08a"
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyHighlightColor(customBgColor)}
                      className="px-2.5 py-1 text-xs font-medium bg-[#1b7d95] hover:bg-[#156377] text-white rounded-lg transition-colors shrink-0"
                    >
                      প্রয়োগ
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

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

        {/* Direct Computer Folder Image Upload Button */}
        <button
          type="button"
          onClick={handleTriggerComputerFile}
          disabled={isUploading}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
            isUploading ? 'opacity-70 animate-pulse text-[#1b7d95]' : ''
          }`}
          aria-label="Upload Image from Computer"
          title="কম্পিউটার ফোল্ডার থেকে সরাসরি ছবি আপলোড করুন"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1b7d95]" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
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

      {/* Selected Image In-Editor Quick Controls Bar */}
      {editor.isActive('image') && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#1b7d95]/10 dark:bg-[#1b7d95]/15 border-b border-[#1b7d95]/30 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#1b7d95] flex items-center gap-1.5 shrink-0">
              <ImageIcon className="w-4 h-4" /> নির্বাচিত ছবি:
            </span>

            {/* Size preset buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 px-1 font-medium">সাইজ:</span>
              {(['25%', '50%', '75%', '100%'] as const).map((w) => {
                const currentWidth = editor.getAttributes('image').width || '100%';
                const isCurrent = currentWidth === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('image', { width: w })
                        .run()
                    }
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-[#1b7d95] text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>

            {/* Alignment buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 px-1 font-medium">অবস্থান:</span>
              <button
                type="button"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { alignment: 'left' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('image').alignment === 'left'
                    ? 'bg-[#1b7d95] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Float Left (বামে)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { alignment: 'center' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('image').alignment === 'center' ||
                  !editor.getAttributes('image').alignment
                    ? 'bg-[#1b7d95] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Center (মাঝে)"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { alignment: 'right' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('image').alignment === 'right'
                    ? 'bg-[#1b7d95] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Float Right (ডানে)"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Replace / Remove image */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTriggerComputerFile}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              কম্পিউটার থেকে ছবি পরিবর্তন
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
              title="ছবি মুছুন (Delete image)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Word Count and Reading Time Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-400">
        <span>{wordCount} words</span>
        <span>~{readingTime} min read</span>
      </div>

      {/* Direct Upload Image Configuration Modal */}
      <ArticleImageConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setPendingImage(null);
        }}
        onConfirm={handleInsertConfiguredImage}
        image={pendingImage}
      />
    </div>
  );
}

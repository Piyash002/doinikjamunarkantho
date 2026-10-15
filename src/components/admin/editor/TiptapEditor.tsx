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
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Robust helper to extract YouTube Video ID from any format (watch?v=, youtu.be, shorts, embed)
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard full or short YouTube URLs
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1]?.length === 11 ? match[1] : null;
}

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

// Custom YouTube Extension supporting custom width, alignment, spacing and responsive embed
export const CustomYoutube = YoutubeExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => {
          const container = element.closest('div[data-youtube-video]') || element;
          return (
            container.getAttribute('data-width') ||
            container.getAttribute('width') ||
            element.getAttribute('width') ||
            element.style.width ||
            '100%'
          );
        },
        renderHTML: (attributes) => ({
          'data-width': attributes.width || '100%',
        }),
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => {
          const container = element.closest('div[data-youtube-video]') || element;
          return container.getAttribute('data-alignment') || 'center';
        },
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment || 'center',
        }),
      },
      spacing: {
        default: 'normal',
        parseHTML: (element) => {
          const container = element.closest('div[data-youtube-video]') || element;
          return container.getAttribute('data-spacing') || 'normal';
        },
        renderHTML: (attributes) => ({
          'data-spacing': attributes.spacing || 'normal',
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const rawSrc = HTMLAttributes.src || '';
    const videoId = extractYoutubeVideoId(rawSrc);
    const embedSrc = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : rawSrc;

    const width = HTMLAttributes['data-width'] || HTMLAttributes.width || '100%';
    const align = HTMLAttributes['data-alignment'] || 'center';
    const spacing = HTMLAttributes['data-spacing'] || 'normal';

    let widthStyle = 'width: 100%;';
    let widthClass = 'yt-size-100';
    if (width === '75%') {
      widthStyle = 'width: 75%;';
      widthClass = 'yt-size-75';
    } else if (width === '50%') {
      widthStyle = 'width: 50%;';
      widthClass = 'yt-size-50';
    }

    let marginY = '1.25rem';
    let spacingClass = 'yt-spacing-normal';
    if (spacing === 'compact') {
      marginY = '0.5rem';
      spacingClass = 'yt-spacing-compact';
    } else if (spacing === 'large') {
      marginY = '2rem';
      spacingClass = 'yt-spacing-large';
    }

    let alignStyle = `margin: ${marginY} auto; clear: both; display: block;`;
    let alignClass = 'yt-align-center';
    if (align === 'left') {
      alignStyle = `float: left; margin: 0.5rem 1.5rem ${marginY} 0; display: inline-block;`;
      alignClass = 'yt-align-left';
    } else if (align === 'right') {
      alignStyle = `float: right; margin: 0.5rem 0 ${marginY} 1.5rem; display: inline-block;`;
      alignClass = 'yt-align-right';
    }

    const wrapperStyle = `${widthStyle} max-width: 100%; ${alignStyle}`;
    const wrapperClass = `article-youtube-wrapper ${widthClass} ${alignClass} ${spacingClass}`;

    return [
      'div',
      {
        'data-youtube-video': '',
        'data-width': width,
        'data-alignment': align,
        'data-spacing': spacing,
        class: wrapperClass,
        style: wrapperStyle,
      },
      [
        'iframe',
        {
          src: embedSrc,
          class: 'article-embed-frame aspect-video w-full rounded-xl shadow-sm',
          style: 'width: 100%; aspect-ratio: 16 / 9; border: 0;',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowfullscreen: 'true',
          loading: 'lazy',
        },
      ],
    ];
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
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [youtubeWidth, setYoutubeWidth] = useState<'100%' | '75%' | '50%'>('100%');
  const [youtubeAlignment, setYoutubeAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [youtubeSpacing, setYoutubeSpacing] = useState<'normal' | 'compact' | 'large'>('normal');
  const [editingYoutubeNode, setEditingYoutubeNode] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isBgColorOpen, setIsBgColorOpen] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#1b7d95');
  const [customBgColor, setCustomBgColor] = useState('#fef08a');

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const detectedVideoId = useMemo(() => extractYoutubeVideoId(youtubeUrlInput), [youtubeUrlInput]);

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
      CustomYoutube.configure({
        inline: false,
        nocookie: true,
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

  function handleOpenYoutubeModal() {
    setYoutubeUrlInput('');
    setYoutubeWidth('100%');
    setYoutubeAlignment('center');
    setYoutubeSpacing('normal');
    setEditingYoutubeNode(false);
    setIsYoutubeModalOpen(true);
  }

  function handleEditExistingYoutube() {
    if (!editor) return;
    const currentAttrs = editor.getAttributes('youtube') || {};
    setYoutubeUrlInput(currentAttrs.src || '');
    setYoutubeWidth((currentAttrs.width as any) || '100%');
    setYoutubeAlignment((currentAttrs.alignment as any) || 'center');
    setYoutubeSpacing((currentAttrs.spacing as any) || 'normal');
    setEditingYoutubeNode(true);
    setIsYoutubeModalOpen(true);
  }

  function handleInsertYoutube() {
    if (!editor || !detectedVideoId) return;
    const cleanUrl = `https://www.youtube.com/watch?v=${detectedVideoId}`;

    if (editingYoutubeNode && editor.isActive('youtube')) {
      editor
        .chain()
        .focus()
        .updateAttributes('youtube', {
          src: cleanUrl,
          width: youtubeWidth,
          alignment: youtubeAlignment,
          spacing: youtubeSpacing,
        })
        .run();
      toastSuccess('ইউটিউব ভিডিওর সাইজ ও সেটিংস সফলভাবে আপডেট হয়েছে!');
    } else {
      editor.commands.setYoutubeVideo({
        src: cleanUrl,
        width: youtubeWidth,
        alignment: youtubeAlignment,
        spacing: youtubeSpacing,
      } as any);
      toastSuccess('ইউটিউব ভিডিও সফলভাবে যুক্ত হয়েছে!');
    }

    setIsYoutubeModalOpen(false);
    setYoutubeUrlInput('');
    setEditingYoutubeNode(false);
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

      {/* Horizontally Scrollable & Mobile-Friendly Toolbar */}
      <div className="tiptap-toolbar">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
            editor.isActive('underline') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Underline"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        {/* Text Color Picker */}
        <div className="relative inline-block shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsTextColorOpen((prev) => !prev);
              setIsBgColorOpen(false);
            }}
            className={`touch-target px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0 ${
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
        <div className="relative inline-block shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsBgColorOpen((prev) => !prev);
              setIsTextColorOpen(false);
            }}
            className={`touch-target px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
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
          className={`touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 transition-colors shrink-0 ${
            editor.isActive('link') ? 'bg-[#1b7d95]/15 text-[#1b7d95]' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          aria-label="Insert Link"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Direct Computer / Mobile Gallery Image Upload Button */}
        <button
          type="button"
          onClick={handleTriggerComputerFile}
          disabled={isUploading}
          className={`touch-target flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0 ${
            isUploading
              ? 'opacity-70 animate-pulse bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-600'
              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 active:scale-95'
          }`}
          aria-label="Upload Photo (ছবি আপলোড)"
          title="কম্পিউটার বা মোবাইল থেকে সরাসরি ছবি আপলোড করুন"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="text-xs font-semibold">ছবি</span>
        </button>

        {/* YouTube Video Embed Button */}
        <button
          type="button"
          onClick={handleOpenYoutubeModal}
          className="touch-target flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 active:scale-95 transition-all shrink-0"
          aria-label="Embed YouTube Video (ইউটিউব ভিডিও)"
          title="ইউটিউব ভিডিও যুক্ত করুন (YouTube Video)"
        >
          <YoutubeIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-semibold">ভিডিও</span>
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={insertTable}
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
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
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
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
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
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
          className="touch-target p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
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
              ছবি পরিবর্তন
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

      {/* Selected YouTube Video In-Editor Quick Controls Bar */}
      {editor.isActive('youtube') && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-800/40 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 shrink-0">
              <YoutubeIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" /> নির্বাচিত ভিডিও:
            </span>

            {/* Size preset buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 px-1 font-medium">সাইজ:</span>
              {(['100%', '75%', '50%'] as const).map((w) => {
                const currentWidth = editor.getAttributes('youtube').width || '100%';
                const isCurrent = currentWidth === w;
                const label = w === '100%' ? '১০০%' : w === '75%' ? '৭৫%' : '৫০%';
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('youtube', { width: w })
                        .run()
                    }
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
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
                    .updateAttributes('youtube', { alignment: 'left' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('youtube').alignment === 'left'
                    ? 'bg-rose-600 text-white shadow-xs'
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
                    .updateAttributes('youtube', { alignment: 'center' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('youtube').alignment === 'center' ||
                  !editor.getAttributes('youtube').alignment
                    ? 'bg-rose-600 text-white shadow-xs'
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
                    .updateAttributes('youtube', { alignment: 'right' })
                    .run()
                }
                className={`p-1 rounded text-xs transition-colors ${
                  editor.getAttributes('youtube').alignment === 'right'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Float Right (ডানে)"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spacing buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] text-slate-400 px-1 font-medium">ফাঁকা:</span>
              {[
                { label: 'কম', val: 'compact' },
                { label: 'স্বাভাবিক', val: 'normal' },
                { label: 'বেশি', val: 'large' },
              ].map(({ label, val }) => {
                const currentSpacing = editor.getAttributes('youtube').spacing || 'normal';
                const isCurrent = currentSpacing === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('youtube', { spacing: val })
                        .run()
                    }
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit / Remove Video */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleEditExistingYoutube}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              ভিডিও এডিট / লিংক
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
              title="ভিডিও মুছুন (Delete video)"
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

      {/* Mobile-Friendly YouTube Video Embed Modal */}
      <Modal
        isOpen={isYoutubeModalOpen}
        onClose={() => {
          setIsYoutubeModalOpen(false);
          setYoutubeUrlInput('');
          setEditingYoutubeNode(false);
        }}
        title={
          editingYoutubeNode
            ? 'ইউটিউব ভিডিও এডিট ও সাইজ নির্ধারণ (Edit YouTube Video)'
            : 'ইউটিউব ভিডিও যুক্ত করুন (Insert YouTube Video)'
        }
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              YouTube ভিডিও লিংক (URL) পেস্ট করুন:
            </label>
            <input
              type="url"
              value={youtubeUrlInput}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... অথবা https://youtu.be/..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95] focus:ring-2 focus:ring-[#1b7d95]/20 font-mono"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              ইউটিউব ভিডিও, শর্টস (Shorts) কিংবা শেয়ার লিংক সরাসরি পেস্ট করতে পারেন।
            </p>
          </div>

          {/* Size & Layout Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* Size Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ভিডিও সাইজ (Width):
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: '১০০%', val: '100%' as const },
                  { label: '৭৫%', val: '75%' as const },
                  { label: '৫০%', val: '50%' as const },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setYoutubeWidth(val)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      youtubeWidth === val
                        ? 'bg-[#1b7d95] text-white border-[#1b7d95] shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                অবস্থান (Alignment):
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'মাঝে', val: 'center' as const, icon: AlignCenter },
                  { label: 'বামে', val: 'left' as const, icon: AlignLeft },
                  { label: 'ডানে', val: 'right' as const, icon: AlignRight },
                ].map(({ label, val, icon: Icon }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setYoutubeAlignment(val)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                      youtubeAlignment === val
                        ? 'bg-[#1b7d95] text-white border-[#1b7d95] shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                স্পেসিং / ফাঁকা জায়গা:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'কম', val: 'compact' as const },
                  { label: 'স্বাভাবিক', val: 'normal' as const },
                  { label: 'বেশি', val: 'large' as const },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setYoutubeSpacing(val)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      youtubeSpacing === val
                        ? 'bg-[#1b7d95] text-white border-[#1b7d95] shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Validation & Live Preview */}
          {detectedVideoId ? (
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>সঠিক ভিডিও শনাক্ত হয়েছে (Video ID: {detectedVideoId})</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  সাইজ: {youtubeWidth} • অবস্থান: {youtubeAlignment === 'center' ? 'মাঝে' : youtubeAlignment === 'left' ? 'বামে' : 'ডানে'} • ফাঁকা: {youtubeSpacing === 'compact' ? 'কম' : youtubeSpacing === 'large' ? 'বেশি' : 'স্বাভাবিক'}
                </span>
              </div>
              <div
                className={`w-full flex ${
                  youtubeAlignment === 'left'
                    ? 'justify-start'
                    : youtubeAlignment === 'right'
                    ? 'justify-end'
                    : 'justify-center'
                }`}
              >
                <div
                  style={{ width: youtubeWidth }}
                  className="transition-all duration-200 max-w-full"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${detectedVideoId}`}
                      title="YouTube Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : youtubeUrlInput.trim().length > 0 ? (
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
              সঠিক YouTube লিংক পাওয়া যায়নি। দয়া করে একটি সঠিক YouTube ভিডিও লিংক দিন।
            </div>
          ) : null}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsYoutubeModalOpen(false);
                setYoutubeUrlInput('');
                setEditingYoutubeNode(false);
              }}
            >
              বাতিল
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!detectedVideoId}
              onClick={handleInsertYoutube}
              leftIcon={<YoutubeIcon className="w-4 h-4" />}
            >
              {editingYoutubeNode ? 'ভিডিও আপডেট করুন' : 'ভিডিও যুক্ত করুন'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

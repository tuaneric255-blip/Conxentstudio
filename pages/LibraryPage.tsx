
import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { useTranslations } from '../i18n';
import { Article } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { googleDriveService } from '../services/googleDriveService';

export const LibraryPage: React.FC = () => {
  const t = useTranslations();
  const articlesMap = useAppStore(state => state.data.articles);
  const articles = useMemo(() => 
    Object.values(articlesMap).sort((a: Article, b: Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [articlesMap]
  );
  const addToast = useAppStore(state => state.addToast);
  const googleConfig = useAppStore(state => state.googleConfig);

  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyToClipboard = (article: Article) => {
    const contentContainer = document.getElementById(`article-content-${article.id}`);
    
    if (!contentContainer) {
      // Fallback to markdown copy if DOM not found
      navigator.clipboard.writeText(article.content);
      addToast({ type: 'warning', message: t.toasts.copyWarning });
      return;
    }
    
    // Create a Blob with text/html type to support Rich Text
    const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                h1, h2, h3, h4, h5, h6 { font-weight: bold; margin-top: 1.2em; margin-bottom: 0.5em; }
                table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                th, td { border: 1px solid black; padding: 8px; }
                blockquote { border-left: 4px solid #ccc; padding-left: 10px; font-style: italic; color: #555; }
                a { color: #007bff; text-decoration: underline; }
                ul, ol { margin-left: 20px; }
            </style>
        </head>
        <body>
            ${contentContainer.innerHTML}
        </body>
        </html>
    `;
    
    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
    const blobText = new Blob([article.content], { type: 'text/plain' });
    
    const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
    });

    navigator.clipboard.write([clipboardItem]).then(() => {
        addToast({ type: 'success', message: t.library.copied });
    }).catch(err => {
        console.error('Copy failed', err);
        // Fallback
        navigator.clipboard.writeText(article.content);
        addToast({ type: 'warning', message: t.toasts.copyWarning });
    });
  };

  const handleDownload = (article: Article) => {
    const blob = new Blob([article.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${article.title.replace(/[ /]/g, '_')}.md`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: `${t.library.downloaded} ${fileName}` });
  };

  const handleExportToDrive = async (article: Article) => {
      if (!googleConfig.clientId || !googleConfig.apiKey) {
          addToast({ type: 'warning', message: 'Please configure Google API details in Settings first.' });
          return;
      }
      
      const contentContainer = document.getElementById(`article-content-${article.id}`);
      if (!contentContainer) return;

      setIsExporting(true);
      try {
          // Get the rendered HTML directly from the preview div to ensure WYSIWYG
          const htmlContent = contentContainer.innerHTML;
          const link = await googleDriveService.uploadToGoogleDrive(article.title, htmlContent, googleConfig);
          
          addToast({ type: 'success', message: t.library.driveUploadSuccess });
          window.open(link, '_blank');
      } catch (error) {
          console.error(error);
          addToast({ type: 'error', message: t.library.driveUploadFailed });
      } finally {
          setIsExporting(false);
      }
  };


  return (
    <div>
      <Header
        title={t.library.title}
        description={t.library.description}
      />
      
      {articles.length === 0 ? (
        <p className="text-muted">{t.library.empty}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {articles.map((article: Article) => (
                <Card key={article.id} onClick={() => setViewingArticle(article)} className="cursor-pointer hover:border-primary transition-colors">
                    <div className="relative aspect-video mb-sm overflow-hidden rounded-md bg-gray-100">
                         {article.featureImage ? (
                            <img src={article.featureImage} alt={article.title} className="w-full h-full object-cover" />
                         ) : (
                             <div className="flex items-center justify-center h-full text-muted text-xs">No Image</div>
                         )}
                    </div>
                    <h3 className="font-bold text-lg text-text mb-xs line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-muted line-clamp-3 mb-md">{article.content.replace(/[#*`_]/g, '')}</p>
                    <div className="flex justify-between items-center mt-auto">
                        <span className="text-xs text-muted bg-border/50 px-2 py-1 rounded">{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                </Card>
            ))}
        </div>
      )}

      {viewingArticle && (
        <Modal 
          isOpen={!!viewingArticle} 
          onClose={() => setViewingArticle(null)} 
          title={viewingArticle.title}
        >
            <div className="space-y-md">
                <div className="flex items-center gap-sm flex-wrap sticky top-0 bg-panel z-10 py-2 border-b border-border">
                    <Button onClick={() => handleCopyToClipboard(viewingArticle)}>{t.library.copyContent}</Button>
                    <Button onClick={() => handleDownload(viewingArticle)} variant="secondary">{t.library.downloadMarkdown}</Button>
                    <Button onClick={() => handleExportToDrive(viewingArticle)} variant="secondary" isLoading={isExporting}>
                        {t.library.exportDrive}
                    </Button>
                </div>
                
                {/* We render the Markdown here invisible or visible to act as source for HTML extraction */}
                <div className="bg-white text-black p-8 rounded-lg shadow-sm border border-border">
                    <h1 className="text-3xl font-bold mb-6" style={{fontSize: '2em', marginBottom: '0.5em'}}>{viewingArticle.title}</h1>
                    <img src={viewingArticle.featureImage} alt="Feature" className="w-full max-w-2xl mx-auto h-auto rounded-lg mb-8" />
                    <div id={`article-content-${viewingArticle.id}`}>
                    <ReactMarkdown 
                        className="prose prose-lg max-w-none text-black"
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            // Override default element rendering to ensure better styles for export & preview
                            h1: ({node, ...props}) => <h1 style={{fontSize: '2em', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em', color: '#1a1a1a'}} {...props} />,
                            h2: ({node, ...props}) => <h2 style={{fontSize: '1.5em', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em', color: '#1a1a1a', borderBottom: '1px solid #eee', paddingBottom: '0.2em'}} {...props} />,
                            h3: ({node, ...props}) => <h3 style={{fontSize: '1.25em', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em', color: '#333'}} {...props} />,
                            h4: ({node, ...props}) => <h4 style={{fontSize: '1.1em', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em'}} {...props} />,
                            p: ({node, ...props}) => <p style={{marginBottom: '1em', lineHeight: '1.6', color: '#333'}} {...props} />,
                            ul: ({node, ...props}) => <ul style={{listStyleType: 'disc', paddingLeft: '20px', marginBottom: '1em'}} {...props} />,
                            ol: ({node, ...props}) => <ol style={{listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '1em'}} {...props} />,
                            li: ({node, ...props}) => <li style={{marginBottom: '0.5em'}} {...props} />,
                            blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #cbd5e1', paddingLeft: '1rem', fontStyle: 'italic', color: '#4b5563', margin: '1em 0', background: '#f8fafc', padding: '1em'}} {...props} />,
                            a: ({node, ...props}) => <a style={{color: '#2563eb', textDecoration: 'underline', cursor: 'pointer'}} {...props} />,
                            table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: '100%', margin: '1em 0'}} {...props} />,
                            th: ({node, ...props}) => <th style={{border: '1px solid #ddd', padding: '10px', backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'left'}} {...props} />,
                            td: ({node, ...props}) => <td style={{border: '1px solid #ddd', padding: '10px'}} {...props} />,
                            img: ({node, ...props}) => <img style={{maxWidth: '100%', height: 'auto', display: 'block', margin: '1.5em auto', borderRadius: '8px'}} {...props} />
                        }}
                    >
                        {viewingArticle.content}
                    </ReactMarkdown>
                    </div>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};
